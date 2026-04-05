import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
  memo,
  useRef,
  forwardRef,
  useImperativeHandle,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import type {
  DataGridProps, ColumnType, SortOrder, SorterResult, InternalColumnType,
  ValidateError, ValidateResult,
} from './types'
import { useVirtualRows } from './useVirtualRows'
import './DataGrid.scss'

// ──────────────────────────────────────────────
// 헬퍼 함수
// ──────────────────────────────────────────────
function getRowKey<T>(record: T, rowKey: DataGridProps<T>['rowKey'], index: number): string | number {
  if (typeof rowKey === 'function') return rowKey(record)
  if (typeof rowKey === 'string') return (record as Record<string, unknown>)[rowKey] as string | number
  return index
}

function getValue<T>(record: T, dataIndex?: string, key?: string): unknown {
  const field = dataIndex ?? key
  if (!field) return undefined
  return (record as Record<string, unknown>)[field]
}

function resolveFixedOffsets<T>(columns: ColumnType<T>[]): InternalColumnType<T>[] {
  const result: InternalColumnType<T>[] = columns.map((c) => ({ ...c }))
  let left = 0
  for (const col of result) {
    if (col.fixed === 'left') {
      col._left = left
      const w = typeof col.width === 'number' ? col.width : 100
      left += w
    }
  }
  let right = 0
  for (let i = result.length - 1; i >= 0; i--) {
    const col = result[i]
    if (col.fixed === 'right') {
      col._right = right
      const w = typeof col.width === 'number' ? col.width : 100
      right += w
    }
  }
  return result
}

/** 모든 리프(leaf) 컬럼을 순서대로 반환 */
function getLeafColumns<T>(cols: ColumnType<T>[]): ColumnType<T>[] {
  const result: ColumnType<T>[] = []
  for (const col of cols) {
    if (col.children?.length) result.push(...getLeafColumns(col.children))
    else result.push(col)
  }
  return result
}

/** 컬럼 트리의 최대 깊이 */
function getMaxDepth<T>(cols: ColumnType<T>[]): number {
  let max = 1
  for (const col of cols) {
    if (col.children?.length) max = Math.max(max, 1 + getMaxDepth(col.children))
  }
  return max
}

/** 리프 컬럼 수 */
function getLeafCount<T>(col: ColumnType<T>): number {
  if (!col.children?.length) return 1
  return col.children.reduce((s, c) => s + getLeafCount(c), 0)
}

/** 헤더 행별 셀 목록 빌드 */
function buildHeaderRows<T>(
  cols: ColumnType<T>[],
  maxDepth: number,
): { col: ColumnType<T>; colSpan: number; rowSpan: number }[][] {
  const rows: { col: ColumnType<T>; colSpan: number; rowSpan: number }[][] = []
  function traverse(columns: ColumnType<T>[], depth: number) {
    if (!rows[depth]) rows[depth] = []
    for (const col of columns) {
      if (col.children?.length) {
        rows[depth].push({ col, colSpan: getLeafCount(col), rowSpan: 1 })
        traverse(col.children, depth + 1)
      } else {
        rows[depth].push({ col, colSpan: 1, rowSpan: maxDepth - depth })
      }
    }
  }
  traverse(cols, 0)
  return rows
}

const DEFAULT_ROW_HEIGHT = 46
const VIRTUAL_THRESHOLD = 100

// ──────────────────────────────────────────────
// EditCell — 격리된 ref 전달 컴포넌트
// 키보드 네비게이션을 위해 getValue()와 markCommitted()를 노출
// ──────────────────────────────────────────────
interface EditCellProps {
  initialValue: unknown
  onCommit: (value: unknown) => void
  onCancel: () => void
}

export interface EditCellHandle {
  getValue: () => unknown
  markCommitted: () => void
}

const EditCell = memo(forwardRef<EditCellHandle, EditCellProps>(function EditCell(
  { initialValue, onCommit, onCancel },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const committed = useRef(false)

  useImperativeHandle(ref, () => ({
    getValue: () => inputRef.current?.value ?? initialValue,
    markCommitted: () => { committed.current = true },
  }))

  const handleBlur = () => {
    if (!committed.current) {
      committed.current = true
      onCommit(inputRef.current?.value ?? initialValue)
    }
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    // Tab과 Enter는 컨테이너 keydown 핸들러에서 처리됩니다.
    // Escape만 여기서 즉시 취소 처리합니다.
    if (e.key === 'Escape') {
      e.stopPropagation()
      committed.current = true
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      className="datagrid__editor"
      defaultValue={String(initialValue ?? '')}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
    />
  )
}))

// ──────────────────────────────────────────────
// InlineEditInput — inline 모드에서 항상 보이는 입력 필드
// ──────────────────────────────────────────────
const InlineEditInput = memo(function InlineEditInput({
  initialValue,
  onCommit,
  onDirty,
}: {
  initialValue: unknown
  onCommit: (value: unknown) => void
  onDirty?: () => void
}) {
  const cancelledRef = useRef(false)
  const dirtyFiredRef = useRef(false)
  const initStr = String(initialValue ?? '')
  return (
    <input
      className="datagrid__editor datagrid__editor--inline"
      defaultValue={initStr}
      onChange={(e) => {
        if (!dirtyFiredRef.current && e.target.value !== initStr) {
          dirtyFiredRef.current = true
          onDirty?.()
        }
      }}
      onBlur={(e) => {
        if (!cancelledRef.current) onCommit(e.target.value)
        cancelledRef.current = false
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          cancelledRef.current = true
          dirtyFiredRef.current = false
          ;(e.target as HTMLInputElement).value = initStr
          ;(e.target as HTMLInputElement).blur()
        }
      }}
    />
  )
})

// ──────────────────────────────────────────────
// 정렬 아이콘
// ──────────────────────────────────────────────
function SortIcon({ order }: { order: SortOrder }) {
  return (
    <span className="datagrid__sort-icon" aria-hidden="true">
      <span className={order === 'ascend' ? 'active' : ''}>▲</span>
      <span className={order === 'descend' ? 'active' : ''}>▼</span>
    </span>
  )
}

// ──────────────────────────────────────────────
// 페이지네이션 바
// ──────────────────────────────────────────────
interface PaginationBarProps {
  current: number
  pageSize: number
  total: number
  pageSizeOptions: number[]
  showSizeChanger: boolean
  pageButtonCount: number
  showTotal?: (total: number, range: [number, number]) => React.ReactNode
  onChange: (page: number, pageSize: number) => void
}

const PaginationBar = memo(function PaginationBar({
  current,
  pageSize,
  total,
  pageSizeOptions,
  showSizeChanger,
  pageButtonCount,
  showTotal,
  onChange,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)

  const pages = useMemo(() => {
    if (totalPages <= 0) return []
    // current를 중심으로 pageButtonCount 개의 버튼을 표시합니다.
    // 1과 totalPages는 윈도우가 해당 위치에 닿을 때 자연스럽게 포함됩니다.
    const half = Math.floor(pageButtonCount / 2)
    let rangeStart = Math.max(1, current - half)
    let rangeEnd   = Math.min(totalPages, rangeStart + pageButtonCount - 1)
    // 우측 끝에 닿으면 왼쪽으로 보정
    if (rangeEnd === totalPages) {
      rangeStart = Math.max(1, totalPages - pageButtonCount + 1)
    }
    const arr: number[] = []
    for (let i = rangeStart; i <= rangeEnd; i++) arr.push(i)
    return arr
  }, [current, totalPages, pageButtonCount])

  return (
    <div className="datagrid__pagination">
      {/* 좌측: 총 개수 정보 */}
      <div className="datagrid__pagination-left">
        {showTotal && (
          <span className="datagrid__pagination-total">
            {showTotal(total, [start, end])}
          </span>
        )}
      </div>

      {/* 중앙: 페이지 이동 버튼 */}
      <div className="datagrid__pagination-nav">
        <button className="datagrid__pagination-btn datagrid__pagination-btn--word"
          disabled={current === 1} onClick={() => onChange(1, pageSize)}>처음</button>
        <button className="datagrid__pagination-btn datagrid__pagination-btn--word"
          disabled={current === 1} onClick={() => onChange(current - 1, pageSize)}>이전</button>

        {pages.map((p) => (
          <button key={p}
            className={`datagrid__pagination-btn${p === current ? ' active' : ''}`}
            onClick={() => onChange(p, pageSize)}
          >{p}</button>
        ))}

        <button className="datagrid__pagination-btn datagrid__pagination-btn--word"
          disabled={current === totalPages} onClick={() => onChange(current + 1, pageSize)}>다음</button>
        <button className="datagrid__pagination-btn datagrid__pagination-btn--word"
          disabled={current === totalPages} onClick={() => onChange(totalPages, pageSize)}>마지막</button>
      </div>

      {/* 우측: 페이지 크기 변경기 */}
      <div className="datagrid__pagination-right">
        {showSizeChanger && (
          // key prop은 pageSize 변경 시 강제 리마운트하여 select 동기화를 유지합니다
          <select
            key={pageSize}
            className="datagrid__pagination-size-select"
            defaultValue={pageSize}
            onChange={(e) => onChange(1, Number(e.target.value))}
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>{s}개씩</option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
})

// ──────────────────────────────────────────────
// DataGrid 메인 컴포넌트
// ──────────────────────────────────────────────
export function DataGrid<T = Record<string, unknown>>({
  dataSource = [],
  columns = [],
  rowKey = 'id',
  loading = false,
  pagination,
  rowSelection,
  scroll,
  bordered = false,
  striped = false,
  size = 'middle',
  className = '',
  style,
  locale,
  rowClassName,
  onRow,
  onChange,
  onCellEdit,
  editMode = 'dblclick',
  rowHeight = DEFAULT_ROW_HEIGHT,
  virtual,
  onScroll: onScrollProp,
  gridRef,
  onValidateChange,
  onFocusedRowChange,
}: DataGridProps<T>) {
  // ── 정렬 ─────────────────────────────────────
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)

  // ── 포커스된 행 (클릭 하이라이트) ────────────
  const [focusedKey, setFocusedKey] = useState<string | number | null>(null)

  // ── 활성 셀 (키보드 네비게이션) ────────────
  const [activeCellPos, setActiveCellPos] = useState<{ rowAbsIdx: number; colIdx: number } | null>(null)

  // ── 편집 상태 ────────────────────────────────
  const [editCell, setEditCell] = useState<{ rowKey: string | number; colKey: string } | null>(null)
  const editCellRef = useRef<EditCellHandle | null>(null)

  // ── 페이지네이션 상태 ─────────────────────────
  const [internalPage, setInternalPage] = useState(1)
  const [internalPageSize, setInternalPageSize] = useState(
    pagination !== false && pagination?.pageSize ? pagination.pageSize : 10,
  )

  // 리프 컬럼 (그룹 헤더 자식 포함) — 실제 데이터 셀에 대응
  const leafColumns = useMemo(() => getLeafColumns(columns), [columns])
  const resolvedColumns = useMemo(() => resolveFixedOffsets(leafColumns), [leafColumns])
  // resolvedColumnsRef는 검증 핸들에서 사용 (아래 선언 후 동기화)


  // ── 그룹헤더 th sticky-top 오프셋 ───────────────
  // <th> 셀 자체에 position:sticky 적용 시, 2번째 헤더 행은 첫 행 높이만큼 top을 내려야 함
  // useLayoutEffect는 headerRows 선언 이후에 배치 (아래 헤더 행 계산 블록 근처)
  const theadRef = useRef<HTMLTableSectionElement>(null)
  const [thTopOffsets, setThTopOffsets] = useState<number[]>([])

  // ── 리사이즈 상태 ─────────────────────────────
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const resizeRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null)

  // ── 편집된 셀 추적 (dirty) ─────────────────────
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(() => new Set())

  // ── 검증 상태 ─────────────────────────────────
  const [validateErrors, setValidateErrors] = useState<ValidateError[]>([])
  // 명령형 핸들(gridRef)에서 최신 상태에 접근하기 위한 ref (stale closure 방지)
  const validateErrorsRef  = useRef<ValidateError[]>([])
  const dataSourceRef       = useRef(dataSource)
  const resolvedColumnsRef  = useRef<InternalColumnType<T>[]>([])
  const rowKeyPropRef       = useRef(rowKey)
  const onValidateChangeRef = useRef(onValidateChange)

  // 매 렌더마다 최신값 동기화
  dataSourceRef.current       = dataSource
  resolvedColumnsRef.current  = resolvedColumns
  rowKeyPropRef.current       = rowKey
  onValidateChangeRef.current = onValidateChange

  // ── 검증 오류 Map (셀 룩업: `${rowKey}::${colKey}`) ──────────────
  const validateErrorMap = useMemo(() => {
    const m = new Map<string, ValidateError>()
    for (const e of validateErrors) m.set(`${String(e.rowKey)}::${e.columnKey}`, e)
    return m
  }, [validateErrors])

  // ── 검증 상태 업데이트 헬퍼 (ref·onValidateChange 동기 유지) ──────
  const setValidateErrorsSync = useCallback((updater: (prev: ValidateError[]) => ValidateError[]) => {
    setValidateErrors(prev => {
      const next = updater(prev)
      validateErrorsRef.current = next
      // 성공/검증중 제외한 오류만 외부에 알림
      const reportable = next.filter(e => e.status === 'error' || e.status === 'warning')
      onValidateChangeRef.current?.(reportable)
      return next
    })
  }, [])

  // ── 정렬 ─────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sortKey || !sortOrder) return dataSource
    // 그룹 헤더(children) 구조에서도 정확히 찾으려면 leafColumns 사용
    const col = leafColumns.find((c) => c.key === sortKey)
    if (!col?.sorter) return dataSource
    const sorted = [...dataSource].sort((a, b) => {
      if (typeof col.sorter === 'function') return col.sorter(a, b)
      const va = getValue(a, col.dataIndex, col.key)
      const vb = getValue(b, col.dataIndex, col.key)
      if (va === vb) return 0
      if (va == null) return 1
      if (vb == null) return -1
      return va < vb ? -1 : 1
    })
    return sortOrder === 'descend' ? sorted.reverse() : sorted
  }, [dataSource, sortKey, sortOrder, leafColumns])

  // ── 페이지네이션 ───────────────────────────────
  const isPaginationDisabled = pagination === false
  const paginationConfig = pagination !== false ? pagination ?? null : null

  // 완전 제어 모드에서만 paginationConfig.pageSize를 사용합니다.
  // 그 외에는 항상 internalPageSize를 사용하여 크기 변경기가 정상 동작하도록 합니다.
  const isControlledPagination =
    paginationConfig?.current !== undefined && paginationConfig?.total !== undefined
  const currentPage = isControlledPagination ? (paginationConfig?.current ?? 1) : internalPage
  const currentPageSize = isControlledPagination
    ? (paginationConfig?.pageSize ?? internalPageSize)
    : internalPageSize
  const totalCount = paginationConfig?.total ?? sortedData.length

  const pagedData = useMemo(() => {
    if (isPaginationDisabled || paginationConfig?.total !== undefined) return sortedData
    const start = (currentPage - 1) * currentPageSize
    return sortedData.slice(start, start + currentPageSize)
  }, [sortedData, isPaginationDisabled, paginationConfig, currentPage, currentPageSize])

  // ── 가상화 ───────────────────────────
  const shouldVirtualize = virtual ?? pagedData.length > VIRTUAL_THRESHOLD
  const { containerRef, offsetTop, offsetBottom, visibleRange, onScroll: onVirtualScroll, scrollToRow } = useVirtualRows({
    totalCount: pagedData.length,
    rowHeight,
    overscan: 8,
  })

  const visibleData = useMemo(() => {
    if (!shouldVirtualize) return pagedData
    const [start, end] = visibleRange
    return pagedData.slice(start, end + 1)
  }, [shouldVirtualize, pagedData, visibleRange])

  const visibleStartIndex = shouldVirtualize ? visibleRange[0] : 0

  // ── inline 모드: activeCellPos 변경 시 해당 셀의 에디터에 자동 포커스 ──
  useEffect(() => {
    if (editMode !== 'inline' || !activeCellPos || !containerRef.current) return
    const { rowAbsIdx, colIdx } = activeCellPos
    const td = containerRef.current.querySelector<HTMLElement>(
      `[data-row="${rowAbsIdx}"][data-col="${colIdx}"]`,
    )
    const focusable = td?.querySelector<HTMLElement>('input, select, textarea')
    if (focusable && document.activeElement !== focusable) {
      focusable.focus()
    }
  }, [editMode, activeCellPos, containerRef])

  // ── 가로 스크롤: 컬럼이 보이는 영역 밖이면 스크롤 ──
  const scrollToCol = useCallback((colIdx: number) => {
    if (!containerRef.current) return
    const col = resolvedColumns[colIdx]
    if (!col || col.fixed) return // 고정 컬럼은 항상 보임

    const container = containerRef.current
    const selWidth = rowSelection ? 40 : 0

    // 해당 컬럼의 절대 좌측 오프셋 계산
    let absLeft = selWidth
    for (let i = 0; i < colIdx; i++) {
      const c = resolvedColumns[i]
      absLeft += columnWidths[c.key] ?? (typeof c.width === 'number' ? c.width : 100)
    }
    const colWidth = columnWidths[col.key] ?? (typeof col.width === 'number' ? col.width : 100)

    // 고정 컬럼 너비 계산 (유효 가시 영역 보정용)
    let fixedLeftW = selWidth
    for (const c of resolvedColumns) {
      if (c.fixed === 'left') fixedLeftW += columnWidths[c.key] ?? (typeof c.width === 'number' ? c.width : 100)
      else break
    }
    let fixedRightW = 0
    for (let i = resolvedColumns.length - 1; i >= 0; i--) {
      const c = resolvedColumns[i]
      if (c.fixed === 'right') fixedRightW += columnWidths[c.key] ?? (typeof c.width === 'number' ? c.width : 100)
      else break
    }

    const visibleLeft = container.scrollLeft + fixedLeftW
    const visibleRight = container.scrollLeft + container.clientWidth - fixedRightW

    if (absLeft < visibleLeft) {
      container.scrollLeft = absLeft - fixedLeftW
    } else if (absLeft + colWidth > visibleRight) {
      container.scrollLeft = absLeft + colWidth + fixedRightW - container.clientWidth
    }
  }, [containerRef, resolvedColumns, columnWidths, rowSelection])

  // ── 셀 검증 실행 (onBlur 또는 내부 호출) ────────
  const runValidator = useCallback(async (
    rk: string | number,
    colKey: string,
    value: unknown,
    record: T,
  ) => {
    const col = resolvedColumns.find(c => c.key === colKey)
    if (!col?.validator) return

    // 검증 중 상태 표시
    setValidateErrorsSync(prev => {
      const next = prev.filter(e => !(e.rowKey === rk && e.columnKey === colKey))
      return [...next, { rowKey: rk, columnKey: colKey, status: 'validating' }]
    })

    try {
      const result = await col.validator(value, record, rk, dataSourceRef.current)
      setValidateErrorsSync(prev => {
        const next = prev.filter(e => !(String(e.rowKey) === String(rk) && e.columnKey === colKey))
        if (!result || result.status === 'success') return next
        return [...next, { rowKey: rk, columnKey: colKey, status: result.status, message: result.message }]
      })
    } catch (err) {
      setValidateErrorsSync(prev => {
        const next = prev.filter(e => !(String(e.rowKey) === String(rk) && e.columnKey === colKey))
        return [...next, { rowKey: rk, columnKey: colKey, status: 'error', message: String(err) }]
      })
    }
  }, [resolvedColumns, setValidateErrorsSync])

  // ── dirty 마킹 헬퍼 ─────────────────────────
  const markDirty = useCallback((rowK: string | number, colKey: string) => {
    const key = `${String(rowK)}::${colKey}`
    setDirtyKeys(prev => prev.has(key) ? prev : new Set(prev).add(key))
  }, [])

  // ── 활성 셀 이동 ────────────────────────────
  const moveActiveCell = useCallback((rowAbsIdx: number, colIdx: number) => {
    const newRow = Math.max(0, Math.min(pagedData.length - 1, rowAbsIdx))
    const newCol = Math.max(0, Math.min(resolvedColumns.length - 1, colIdx))
    const record = pagedData[newRow]
    if (!record) return
    setActiveCellPos({ rowAbsIdx: newRow, colIdx: newCol })
    setFocusedKey(getRowKey(record, rowKey, newRow))
    scrollToRow(newRow)
    scrollToCol(newCol)
    onFocusedRowChange?.(record, newRow)
  }, [pagedData, resolvedColumns.length, rowKey, scrollToRow, scrollToCol, onFocusedRowChange])

  // ── commitAndMove — 현재 편집기를 커밋하고 다음 셀로 이동 ──
  const commitAndMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (!activeCellPos || !editCell) return
    const { rowAbsIdx, colIdx } = activeCellPos

    // 값을 읽고 onBlur에서 중복 커밋 방지
    const value = editCellRef.current?.getValue()
    editCellRef.current?.markCommitted()

    // 편집 내용 저장 + onBlur 검증
    const record = pagedData[rowAbsIdx]
    if (record && value !== undefined) {
      const col = resolvedColumns.find(c => c.key === editCell.colKey)
      const oldValue = getValue(record, col?.dataIndex, editCell.colKey)
      if (String(value) !== String(oldValue ?? '')) markDirty(editCell.rowKey, editCell.colKey)
      onCellEdit?.(editCell.rowKey, editCell.colKey, value, record)
      if (col?.validator && (col.validateTrigger ?? 'onBlur') === 'onBlur') {
        const field = col.dataIndex ?? col.key
        const updatedRecord = { ...record, [field]: value }
        void runValidator(editCell.rowKey, editCell.colKey, value, updatedRecord)
      }
    }

    // 다음 위치 계산
    let nextRow = rowAbsIdx
    let nextCol = colIdx

    if (direction === 'right') {
      if (colIdx < resolvedColumns.length - 1) {
        nextCol = colIdx + 1
      } else if (rowAbsIdx < pagedData.length - 1) {
        nextRow = rowAbsIdx + 1
        nextCol = 0
      }
    } else if (direction === 'left') {
      if (colIdx > 0) {
        nextCol = colIdx - 1
      } else if (rowAbsIdx > 0) {
        nextRow = rowAbsIdx - 1
        nextCol = resolvedColumns.length - 1
      }
    } else if (direction === 'down') {
      nextRow = Math.min(pagedData.length - 1, rowAbsIdx + 1)
    } else if (direction === 'up') {
      nextRow = Math.max(0, rowAbsIdx - 1)
    }

    const nextRecord = pagedData[nextRow]
    const nextCol_ = resolvedColumns[nextCol]
    if (!nextRecord || !nextCol_) { setEditCell(null); return }

    const nextRowKey = getRowKey(nextRecord, rowKey, nextRow)
    setActiveCellPos({ rowAbsIdx: nextRow, colIdx: nextCol })
    setFocusedKey(nextRowKey)
    scrollToRow(nextRow)
    scrollToCol(nextCol)
    onFocusedRowChange?.(nextRecord, nextRow)

    if (nextCol_?.editable) {
      setEditCell({ rowKey: nextRowKey, colKey: nextCol_.key })
    } else {
      setEditCell(null)
    }
  }, [activeCellPos, editCell, pagedData, resolvedColumns, rowKey,
    onCellEdit, scrollToRow, scrollToCol, runValidator, onFocusedRowChange, markDirty])

  // ── 키보드 핸들러 (스크롤 컨테이너에 적용) ────
  const handleContainerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName
    const isEditorFocused = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA'

    // ── inline 모드: 에디터에 포커스된 상태에서 Tab 처리 ──
    if (editMode === 'inline' && isEditorFocused && e.key === 'Tab' && activeCellPos) {
      e.preventDefault()
      const dir = e.shiftKey ? -1 : 1
      const { rowAbsIdx, colIdx } = activeCellPos
      const nextCol = colIdx + dir
      if (nextCol >= 0 && nextCol < resolvedColumns.length) {
        moveActiveCell(rowAbsIdx, nextCol)
      } else if (dir === 1 && rowAbsIdx < pagedData.length - 1) {
        moveActiveCell(rowAbsIdx + 1, 0)
      } else if (dir === -1 && rowAbsIdx > 0) {
        moveActiveCell(rowAbsIdx - 1, resolvedColumns.length - 1)
      }
      return
    }

    // ── 편집 모드 ──
    if (editCell) {
      if (e.key === 'Tab') {
        e.preventDefault()
        commitAndMove(e.shiftKey ? 'left' : 'right')
        return
      }
      if (e.key === 'Enter' && isEditorFocused) {
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
        e.preventDefault()
        if (editCellRef.current) {
          const value = editCellRef.current.getValue()
          editCellRef.current.markCommitted()
          if (activeCellPos) {
            const record = pagedData[activeCellPos.rowAbsIdx]
            if (record) {
              const col = resolvedColumns.find(c => c.key === editCell.colKey)
              const oldValue = getValue(record, col?.dataIndex, editCell.colKey)
              if (String(value) !== String(oldValue ?? '')) markDirty(editCell.rowKey, editCell.colKey)
              onCellEdit?.(editCell.rowKey, editCell.colKey, value, record)
              if (col?.validator && (col.validateTrigger ?? 'onBlur') === 'onBlur') {
                const field = col.dataIndex ?? col.key
                const updatedRecord = { ...record, [field]: value }
                void runValidator(editCell.rowKey, editCell.colKey, value, updatedRecord)
              }
            }
          }
        }
        setEditCell(null)
        return
      }
      // Escape는 EditCell 내부에서 처리됩니다; 여기서는 건너뜁니다
      return
    }

    // ── 네비게이션 모드 (편집 중 아님) ──
    if (!activeCellPos) return

    // inline 모드에서 에디터(input/select/textarea)가 포커스된 경우
    // 방향키·Enter 등은 브라우저 기본 동작(커서 이동, 옵션 선택 등)에 맡김
    // Tab은 이미 위의 inline 모드 섹션에서 처리됐으므로 여기서는 제외
    if (editMode === 'inline' && isEditorFocused) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        moveActiveCell(activeCellPos.rowAbsIdx + 1, activeCellPos.colIdx)
        break
      case 'ArrowUp':
        e.preventDefault()
        moveActiveCell(activeCellPos.rowAbsIdx - 1, activeCellPos.colIdx)
        break
      case 'ArrowRight':
        e.preventDefault()
        moveActiveCell(activeCellPos.rowAbsIdx, activeCellPos.colIdx + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        moveActiveCell(activeCellPos.rowAbsIdx, activeCellPos.colIdx - 1)
        break
      case 'Tab': {
        // Tab: 인접 컬럼으로 이동 (편집 여부 무관); 행 경계에서는 다음/이전 행으로
        e.preventDefault()
        const dir = e.shiftKey ? -1 : 1
        const nextCol = activeCellPos.colIdx + dir
        if (nextCol >= 0 && nextCol < resolvedColumns.length) {
          moveActiveCell(activeCellPos.rowAbsIdx, nextCol)
        } else if (dir === 1 && activeCellPos.rowAbsIdx < pagedData.length - 1) {
          moveActiveCell(activeCellPos.rowAbsIdx + 1, 0)
        } else if (dir === -1 && activeCellPos.rowAbsIdx > 0) {
          moveActiveCell(activeCellPos.rowAbsIdx - 1, resolvedColumns.length - 1)
        }
        break
      }
      case 'Enter':
      case 'F2': {
        // Enter/F2: 편집 가능 셀이면 에디터 열기, 그 외엔 아무것도 하지 않음
        // (행 이동은 방향키로만 수행)
        e.preventDefault()
        const col = resolvedColumns[activeCellPos.colIdx]
        if (col?.editable) {
          const rec = pagedData[activeCellPos.rowAbsIdx]
          if (rec) setEditCell({ rowKey: getRowKey(rec, rowKey, activeCellPos.rowAbsIdx), colKey: col.key })
        }
        break
      }
      case 'Escape':
        setActiveCellPos(null)
        setFocusedKey(null)
        break
    }
  }, [editCell, activeCellPos, moveActiveCell, commitAndMove,
    editMode, resolvedColumns, pagedData, rowKey, onCellEdit, runValidator, markDirty])

  // ── 정렬 핸들러 ─────────────────────────────
  const handleSort = useCallback((col: ColumnType<T>) => {
    if (!col.sorter) return
    let newOrder: SortOrder
    if (sortKey !== col.key) newOrder = 'ascend'
    else if (sortOrder === 'ascend') newOrder = 'descend'
    else newOrder = null
    setSortKey(newOrder ? col.key : null)
    setSortOrder(newOrder)
    setActiveCellPos(null)
    setEditCell(null)

    let newSortedData = dataSource
    if (newOrder) {
      const sorted = [...dataSource].sort((a, b) => {
        if (typeof col.sorter === 'function') return col.sorter(a, b)
        const va = getValue(a, col.dataIndex, col.key)
        const vb = getValue(b, col.dataIndex, col.key)
        if (va === vb) return 0
        if (va == null) return 1
        if (vb == null) return -1
        return va < vb ? -1 : 1
      })
      newSortedData = newOrder === 'descend' ? sorted.reverse() : sorted
    }

    const sorterResult: SorterResult<T> = {
      column: col, columnKey: col.key, order: newOrder, field: col.dataIndex ?? col.key,
    }
    onChange?.({ current: currentPage, pageSize: currentPageSize }, sorterResult, {
      currentDataSource: newSortedData, action: 'sort',
    })
  }, [sortKey, sortOrder, onChange, currentPage, currentPageSize, dataSource])

  // ── 페이지네이션 핸들러 ────────────────────────
  const handlePageChange = useCallback((page: number, pageSize: number) => {
    setInternalPage(page)
    setInternalPageSize(pageSize)
    // 페이지 변경 시 키보드 위치 초기화
    setActiveCellPos(null)
    setEditCell(null)
    paginationConfig?.onChange?.(page, pageSize)
    onChange?.({ current: page, pageSize }, { order: sortOrder ?? undefined, columnKey: sortKey ?? undefined }, {
      currentDataSource: sortedData, action: 'paginate',
    })
  }, [paginationConfig, onChange, sortOrder, sortKey, sortedData])

  // ── 선택 핸들러 ────────────────────────────────
  const selectedKeys = useMemo(
    () => new Set(rowSelection?.selectedRowKeys ?? []),
    [rowSelection?.selectedRowKeys],
  )

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!rowSelection) return
    const newKeys: (string | number)[] = []
    const newRows: T[] = []
    const changeRows: T[] = []
    for (let i = 0; i < pagedData.length; i++) {
      const r = pagedData[i]
      const key = getRowKey(r, rowKey, i)
      const disabled = rowSelection.getCheckboxProps?.(r)?.disabled
      if (disabled) {
        if (selectedKeys.has(key)) { newKeys.push(key); newRows.push(r) }
      } else {
        changeRows.push(r)
        if (checked) { newKeys.push(key); newRows.push(r) }
      }
    }
    rowSelection.onChange?.(newKeys, newRows)
    rowSelection.onSelectAll?.(checked, newRows, changeRows)
  }, [rowSelection, pagedData, rowKey, selectedKeys])

  const handleSelectRow = useCallback((record: T, index: number, checked: boolean) => {
    if (!rowSelection) return
    const key = getRowKey(record, rowKey, index)
    const type = rowSelection.type ?? 'checkbox'
    let newKeys: (string | number)[]
    let newRows: T[]
    if (type === 'radio') {
      newKeys = checked ? [key] : []
      newRows = checked ? [record] : []
    } else {
      newKeys = checked
        ? [...(rowSelection.selectedRowKeys ?? []), key]
        : (rowSelection.selectedRowKeys ?? []).filter((k) => k !== key)
      const newKeysSet = new Set(newKeys)
      newRows = pagedData.filter((r, i) => newKeysSet.has(getRowKey(r, rowKey, i)))
    }
    rowSelection.onChange?.(newKeys, newRows)
    rowSelection.onSelect?.(record, checked, newRows)
  }, [rowSelection, rowKey, pagedData])

  // ── 셀 편집 핸들러 ────────────────────────────
  const handleCellActivate = useCallback((
    rowK: string | number, colKey: string, col: ColumnType<T>, rowAbsIdx: number, colIdx: number,
  ) => {
    if (!col.editable) return
    setEditCell({ rowKey: rowK, colKey })
    setActiveCellPos({ rowAbsIdx, colIdx })
    setFocusedKey(rowK)
  }, [])

  const handleEditCommit = useCallback((record: T, rowK: string | number, colKey: string, newValue: unknown) => {
    setEditCell(null)
    const col = resolvedColumns.find(c => c.key === colKey)
    const oldValue = getValue(record, col?.dataIndex, colKey)
    if (String(newValue) !== String(oldValue ?? '')) markDirty(rowK, colKey)
    onCellEdit?.(rowK, colKey, newValue, record)
    if (col?.validator && (col.validateTrigger ?? 'onBlur') === 'onBlur') {
      const field = col.dataIndex ?? col.key
      const updatedRecord = { ...record, [field]: newValue }
      void runValidator(rowK, colKey, newValue, updatedRecord)
    }
  }, [onCellEdit, resolvedColumns, runValidator, markDirty])

  // ── 리사이즈 핸들러 ───────────────────────────
  const handleResizeStart = useCallback((e: React.MouseEvent, col: ColumnType<T>) => {
    e.preventDefault()
    e.stopPropagation()
    const startWidth = columnWidths[col.key] ?? (typeof col.width === 'number' ? col.width : 100)
    resizeRef.current = { key: col.key, startX: e.clientX, startWidth }

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const { key, startX, startWidth: sw } = resizeRef.current
      const delta = ev.clientX - startX
      const colDef = leafColumns.find(c => c.key === key)
      const min = colDef?.minWidth ?? 40
      const max = colDef?.maxWidth ?? Infinity
      setColumnWidths(prev => ({ ...prev, [key]: Math.min(max, Math.max(min, sw + delta)) }))
    }
    const onMouseUp = () => {
      resizeRef.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [columnWidths, leafColumns])

  // ── gridRef 명령형 핸들 등록 ─────────────────────
  useEffect(() => {
    if (!gridRef) return
    const handle = {
      /** dataSource 전체에 대해 validator 실행 */
      validate: async (): Promise<boolean> => {
        const allData   = dataSourceRef.current
        const cols      = resolvedColumnsRef.current
        const rk        = rowKeyPropRef.current

        // 검증 대상 컬럼만 추출
        const validatorCols = cols.filter(c => c.validator)
        if (validatorCols.length === 0) return true

        // 모든 셀 병렬 검증
        type Entry = { rowKey: string | number; columnKey: string; result: ValidateResult | null | undefined }
        const entries = await Promise.all(
          allData.flatMap((record, idx) => {
            const recordKey = getRowKey(record, rk, idx)
            return validatorCols.map(async (col): Promise<Entry> => {
              const val = getValue(record, col.dataIndex, col.key)
              try {
                const result = await col.validator!(val, record, recordKey, allData)
                return { rowKey: recordKey, columnKey: col.key, result }
              } catch (err) {
                return { rowKey: recordKey, columnKey: col.key,
                  result: { status: 'error', message: String(err) } }
              }
            })
          })
        )

        const newErrors: ValidateError[] = entries
          .filter(e => e.result && e.result.status !== 'success')
          .map(e => ({
            rowKey: e.rowKey,
            columnKey: e.columnKey,
            status: e.result!.status,
            message: e.result!.message,
          }))

        validateErrorsRef.current = newErrors
        setValidateErrors(newErrors)
        const reportable = newErrors.filter(e => e.status === 'error' || e.status === 'warning')
        onValidateChangeRef.current?.(reportable)

        return !newErrors.some(e => e.status === 'error')
      },

      /** 현재 오류 목록 반환 */
      getErrors: (): ValidateError[] =>
        validateErrorsRef.current.filter(e => e.status === 'error' || e.status === 'warning'),

      /** 모든 오류 초기화 */
      clearErrors: () => {
        validateErrorsRef.current = []
        setValidateErrors([])
        onValidateChangeRef.current?.([])
      },

      /** 특정 rowKey에 해당하는 레코드 반환 */
      getRow: (rk: string | number): T | undefined => {
        const data = dataSourceRef.current
        const prop = rowKeyPropRef.current
        return data.find((record, idx) => String(getRowKey(record, prop, idx)) === String(rk))
      },

      /** 특정 rowKey·columnKey에 해당하는 셀 값 반환 */
      getCell: (rk: string | number, columnKey: string): unknown => {
        const data = dataSourceRef.current
        const prop = rowKeyPropRef.current
        const record = data.find((r, idx) => String(getRowKey(r, prop, idx)) === String(rk))
        if (record === undefined) return undefined
        const col = resolvedColumnsRef.current.find(c => c.key === columnKey)
        return getValue(record, col?.dataIndex, columnKey)
      },

      /** dataSource 전체 배열 반환 */
      getData: (): T[] => dataSourceRef.current,
    }
    ;(gridRef as React.MutableRefObject<typeof handle>).current = handle
    return () => {
      ;(gridRef as React.MutableRefObject<typeof handle | null>).current = null
    }
  }, [gridRef])

  // ── 헤더 행 계산 ─────────────────────────────
  const maxDepth = useMemo(() => getMaxDepth(columns), [columns])
  const headerRows = useMemo(() => buildHeaderRows(columns, maxDepth), [columns, maxDepth])

  // ── 그룹헤더 th sticky-top 오프셋 측정 ───────────────
  // headerRows 선언 이후에 배치해야 deps 참조 가능
  useLayoutEffect(() => {
    if (!theadRef.current) return
    const rows = Array.from(theadRef.current.querySelectorAll('tr'))
    let cumulative = 0
    const newOffsets: number[] = []
    for (const row of rows) {
      newOffsets.push(cumulative)
      cumulative += row.getBoundingClientRect().height
    }
    // 값이 동일하면 불필요한 재렌더 방지
    setThTopOffsets(prev =>
      prev.length === newOffsets.length && prev.every((v, i) => v === newOffsets[i])
        ? prev
        : newOffsets
    )
  }, [headerRows])

  // ── 루트 클래스 ────────────────────────────────
  const rootClass = [
    'datagrid',
    `datagrid--${size}`,
    bordered && 'bordered',
    className,
  ].filter(Boolean).join(' ')

  let _enabledCount = 0, _selectedEnabledCount = 0
  for (let i = 0; i < pagedData.length; i++) {
    if (rowSelection?.getCheckboxProps?.(pagedData[i])?.disabled) continue
    _enabledCount++
    if (selectedKeys.has(getRowKey(pagedData[i], rowKey, i))) _selectedEnabledCount++
  }
  const allSelected = _enabledCount > 0 && _selectedEnabledCount === _enabledCount
  const indeterminate = !allSelected && _selectedEnabledCount > 0

  return (
    <div className={rootClass} style={style}>
      {loading && (
        <div className="datagrid__loading">
          <div className="datagrid__spinner" />
        </div>
      )}

      {/* 스크롤 컨테이너 — 키보드 핸들러가 이곳에 위치 */}
      <div
        className="datagrid__scroll"
        ref={containerRef}
        tabIndex={0}
        onScroll={(e) => {
          if (shouldVirtualize) onVirtualScroll()
          onScrollProp?.(e)
        }}
        onKeyDown={handleContainerKeyDown}
        style={{ overflowX: scroll?.x ? 'auto' : undefined, outline: 'none' }}
      >
        <table
          className="datagrid__table"
          style={{ minWidth: scroll?.x === true ? undefined : scroll?.x }}
        >
          <colgroup>
            {rowSelection && <col style={{ width: 40 }} />}
            {resolvedColumns.map((col) => (
              <col key={col.key} style={{ width: columnWidths[col.key] ?? col.width }} />
            ))}
          </colgroup>

          {/* 헤더 — 다중 행(그룹 헤더) 지원 */}
          <thead className="datagrid__thead" ref={theadRef}>
            {headerRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {rowIdx === 0 && rowSelection && (
                  <th
                    className="datagrid__th datagrid__selection-col"
                    rowSpan={maxDepth > 1 ? maxDepth : undefined}
                    style={{ '--th-sticky-top': `${thTopOffsets[0] ?? 0}px` } as React.CSSProperties}
                  >
                    {(rowSelection.type ?? 'checkbox') === 'checkbox' && (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = indeterminate }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    )}
                  </th>
                )}
                {row.map(({ col, colSpan, rowSpan }) => {
                  const isLeaf = !col.children?.length
                  const isCurrentSort = sortKey === col.key
                  const leafInternal = resolvedColumns.find(c => c.key === col.key)
                  const thClass = [
                    'datagrid__th',
                    col.align ? `align-${col.align}` : '',
                    isLeaf && col.sorter ? 'sortable' : '',
                    isLeaf && isCurrentSort && sortOrder ? 'sorted' : '',
                    isLeaf && col.fixed ? `fixed-${col.fixed}` : '',
                    !isLeaf ? 'group-header' : '',
                    isLeaf && col.resizable !== false ? 'resizable' : '',
                  ].filter(Boolean).join(' ')

                  const stickyStyle: React.CSSProperties = {
                    '--th-sticky-top': `${thTopOffsets[rowIdx] ?? 0}px`,
                  } as React.CSSProperties
                  if (isLeaf && col.fixed === 'left') {
                    (stickyStyle as Record<string, unknown>)['--sticky-left'] = `${leafInternal?._left ?? 0}px`
                  }
                  if (isLeaf && col.fixed === 'right') {
                    (stickyStyle as Record<string, unknown>)['--sticky-right'] = `${leafInternal?._right ?? 0}px`
                  }

                  return (
                    <th
                      key={col.key}
                      className={thClass}
                      colSpan={colSpan > 1 ? colSpan : undefined}
                      rowSpan={rowSpan > 1 ? rowSpan : undefined}
                      style={stickyStyle}
                      onClick={isLeaf ? () => handleSort(col) : undefined}
                    >
                      {col.title}
                      {isLeaf && col.sorter && <SortIcon order={isCurrentSort ? sortOrder : null} />}
                      {isLeaf && col.resizable !== false && (
                        <span
                          className="datagrid__resize-handle"
                          onMouseDown={(e) => handleResizeStart(e, col)}
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>

          {/* 바디 */}
          <tbody className="datagrid__tbody">
            {shouldVirtualize && offsetTop > 0 && (
              <tr style={{ height: offsetTop }}>
                <td colSpan={resolvedColumns.length + (rowSelection ? 1 : 0)} />
              </tr>
            )}

            {visibleData.length === 0 && !loading && (
              <tr>
                <td className="datagrid__empty"
                  colSpan={resolvedColumns.length + (rowSelection ? 1 : 0)}>
                  {locale?.emptyText ?? '데이터가 없습니다'}
                </td>
              </tr>
            )}

            {visibleData.map((record, relIdx) => {
              const absIdx = visibleStartIndex + relIdx
              const rk = getRowKey(record, rowKey, absIdx)
              const isSelected = selectedKeys.has(rk)
              const isFocused = focusedKey === rk
              const isStripe = striped && absIdx % 2 === 1
              const rowExtraProps = onRow?.(record, absIdx) ?? {}
              const customRowClass =
                typeof rowClassName === 'function' ? rowClassName(record, absIdx) : (rowClassName ?? '')

              const trClass = [
                'datagrid__tr',
                isFocused ? 'focused' : '',
                isSelected ? 'selected' : '',
                isStripe ? 'stripe' : '',
                rowSelection?.clickRowToSelect ? 'clickable' : '',
                customRowClass,
                rowExtraProps.className,
              ].filter(Boolean).join(' ')

              return (
                <tr
                  key={rk}
                  {...rowExtraProps}
                  className={trClass}
                  onClick={(e) => {
                    setFocusedKey(rk)
                    onFocusedRowChange?.(record, absIdx)
                    // clickRowToSelect: 행 클릭으로 체크박스/라디오 토글
                    if (rowSelection?.clickRowToSelect) {
                      const disabled = rowSelection.getCheckboxProps?.(record)?.disabled
                      if (!disabled) handleSelectRow(record, absIdx, !isSelected)
                    }
                    rowExtraProps.onClick?.(e)
                  }}
                >
                  {rowSelection && (
                    <td className="datagrid__td datagrid__selection-col">
                      <input
                        type={rowSelection.type ?? 'checkbox'}
                        checked={isSelected}
                        disabled={rowSelection.getCheckboxProps?.(record)?.disabled}
                        onChange={(e) => handleSelectRow(record, absIdx, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}

                  {resolvedColumns.map((col, colIdx) => {
                    const cellProps = col.onCell?.(record, absIdx) ?? {}
                    const rawValue = getValue(record, col.dataIndex, col.key)

                    // inline 모드: 편집 가능한 셀은 항상 에디터 노출
                    const isEditing = editMode === 'inline'
                      ? (col.editable ?? false)
                      : (editCell?.rowKey === rk && editCell.colKey === col.key)

                    const isActiveCell = activeCellPos?.rowAbsIdx === absIdx && activeCellPos?.colIdx === colIdx
                    const validateErr  = validateErrorMap.get(`${String(rk)}::${col.key}`)
                    const isDirty = dirtyKeys.has(`${String(rk)}::${col.key}`)

                    const tdClass = [
                      'datagrid__td',
                      col.align ? `align-${col.align}` : '',
                      col.ellipsis ? 'ellipsis' : '',
                      col.fixed ? `fixed-${col.fixed}` : '',
                      isEditing ? 'editing' : '',
                      col.editable && !isEditing ? 'editable' : '',
                      isActiveCell && !isEditing ? 'active-cell' : '',
                      col.editable && !isEditing && editMode === 'click' ? 'editable-click' : '',
                      editMode === 'inline' && isEditing ? 'inline-editing' : '',
                      isDirty ? 'dirty' : '',
                      // 편집 중인 셀은 오류 표시 제거 (inline 모드는 항상 editing이므로 제외)
                      validateErr && (!isEditing || editMode === 'inline') ? `validate-${validateErr.status}` : '',
                    ].filter(Boolean).join(' ')

                    return (
                      <td
                        key={col.key}
                        data-row={absIdx}
                        data-col={colIdx}
                        className={`${tdClass} ${cellProps.className ?? ''}`.trim()}
                        style={{
                          ...cellProps.style,
                          ...(col.fixed === 'left' ? { '--sticky-left': `${col._left ?? 0}px` } as React.CSSProperties : {}),
                          ...(col.fixed === 'right' ? { '--sticky-right': `${col._right ?? 0}px` } as React.CSSProperties : {}),
                        }}
                        onFocus={editMode === 'inline' && col.editable ? () => {
                          setActiveCellPos({ rowAbsIdx: absIdx, colIdx })
                          setFocusedKey(rk)
                        } : undefined}
                        onClick={editMode === 'click'
                          ? (e) => {
                            e.stopPropagation()
                            setActiveCellPos({ rowAbsIdx: absIdx, colIdx })
                            setFocusedKey(rk)
                            onFocusedRowChange?.(record, absIdx)
                            if (col.editable) setEditCell({ rowKey: rk, colKey: col.key })
                          }
                          : editMode !== 'inline' ? () => {
                            setActiveCellPos({ rowAbsIdx: absIdx, colIdx })
                            setFocusedKey(rk)
                          } : undefined
                        }
                        onDoubleClick={editMode === 'dblclick'
                          ? () => handleCellActivate(rk, col.key, col, absIdx, colIdx)
                          : undefined}
                      >
                        {isEditing ? (
                          col.renderEditor ? (
                            col.renderEditor(
                              rawValue, record, absIdx,
                              (v) => handleEditCommit(record, rk, col.key, v),
                              // inline 모드에서 onCancel은 에디터를 닫지 않음 (항상 노출)
                              editMode === 'inline' ? () => {} : () => setEditCell(null),
                            )
                          ) : editMode === 'inline' ? (
                            // inline 모드 표준 입력 — handleEditCommit을 통해 validator도 실행
                            <InlineEditInput
                              key={`${rk}-${col.key}`}
                              initialValue={rawValue}
                              onCommit={(v) => handleEditCommit(record, rk, col.key, v)}
                              onDirty={() => markDirty(rk, col.key)}
                            />
                          ) : (
                            <EditCell
                              ref={editCellRef}
                              initialValue={rawValue}
                              onCommit={(v) => handleEditCommit(record, rk, col.key, v)}
                              onCancel={() => setEditCell(null)}
                            />
                          )
                        ) : col.render ? (
                          col.render(rawValue, record, absIdx)
                        ) : (
                          rawValue as React.ReactNode
                        )}
                        {/* 검증 오류 메시지 툴팁 */}
                        {validateErr?.message && (
                          <span className={`datagrid__validate-msg datagrid__validate-msg--${validateErr.status}`}>
                            {validateErr.message}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {shouldVirtualize && offsetBottom > 0 && (
              <tr style={{ height: offsetBottom }}>
                <td colSpan={resolvedColumns.length + (rowSelection ? 1 : 0)} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isPaginationDisabled && (
        <PaginationBar
          current={currentPage}
          pageSize={currentPageSize}
          total={totalCount}
          pageSizeOptions={paginationConfig?.pageSizeOptions ?? [10, 20, 50, 100]}
          showSizeChanger={paginationConfig?.showSizeChanger ?? false}
          pageButtonCount={paginationConfig?.pageButtonCount ?? 5}
          showTotal={paginationConfig?.showTotal}
          onChange={handlePageChange}
        />
      )}
    </div>
  )
}

export default DataGrid
