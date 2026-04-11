import {
  Fragment,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
  memo,
  useRef,
  forwardRef,
  useImperativeHandle,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type Key,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import type {
  DataGridProps,
  ColumnType,
  SortOrder,
  SorterResult,
  InternalColumnType,
  ValidateError,
  ValidateResult,
  TableFilters,
} from '@/components/DataGrid/types'
import { useVirtualRows } from '@/components/DataGrid/useVirtualRows'
import { useGridBreakpoint } from '@/components/DataGrid/useGridBreakpoint'
import { getRecordValue, filterColumnsTree, normalizeCellRenderResult, getSorterMultiple } from '@/components/DataGrid/tableUtils'
import {
  applyColumnFilters,
  applyMultiSort,
  recordMatchesColumnFilters,
  flattenTreeRows,
  flattenFlatDepthTreeRows,
  type FlatTreeRow,
} from '@/components/DataGrid/sortAndFilter'
import { ColumnFilterDropdownPanel } from '@/components/DataGrid/ColumnFilterDropdown'
import '@/components/DataGrid/DataGrid.scss'

// ──────────────────────────────────────────────
// 헬퍼 함수
// ──────────────────────────────────────────────
function getRowKey<T>(record: T, rowKey: DataGridProps<T>['rowKey'], index: number): string | number {
  if (typeof rowKey === 'function') {
    const k = rowKey(record)
    if (k !== undefined && k !== null && String(k) !== '') return k
  }
  if (typeof rowKey === 'string') {
    const k = (record as Record<string, unknown>)[rowKey] as string | number | undefined
    if (k !== undefined && k !== null && String(k) !== '') return k
  }
  const fallbackId = (record as Record<string, unknown>)['id'] as string | number | undefined
  if (fallbackId !== undefined && fallbackId !== null && String(fallbackId) !== '') return fallbackId
  return `__dg_auto_${index}`
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

/** 적용 중인 필터가 있는지(텍스트 모드는 공백 제외 첫 값 기준) */
function isColumnFilterActive<T>(col: ColumnType<T>, selected: Key[] | null | undefined): boolean {
  if (selected == null || selected.length === 0) return false
  if (col.filterMode === 'text' && col.onTextFilter) {
    return String(selected[0] ?? '').trim().length > 0
  }
  return true
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
const ROW_OPS_DELETE_COL_WIDTH = 56

/** Tab 이동용: 읽기 순서로 한 칸 오른쪽 (행 끝이면 다음 행 첫 칸) */
function stepCellRight(
  row: number,
  col: number,
  numRows: number,
  numCols: number,
): { row: number; col: number } | null {
  if (numCols <= 0 || numRows <= 0) return null
  if (col < numCols - 1) return { row, col: col + 1 }
  if (row < numRows - 1) return { row: row + 1, col: 0 }
  return null
}

function stepCellLeft(
  row: number,
  col: number,
  numRows: number,
  numCols: number,
): { row: number; col: number } | null {
  if (numCols <= 0 || numRows <= 0) return null
  if (col > 0) return { row, col: col - 1 }
  if (row > 0) return { row: row - 1, col: numCols - 1 }
  return null
}

function findNextEditableRight(
  startRow: number,
  startCol: number,
  columns: { editable?: boolean }[],
  numRows: number,
): { row: number; col: number } | null {
  let pos = stepCellRight(startRow, startCol, numRows, columns.length)
  while (pos) {
    if (columns[pos.col]?.editable) return pos
    pos = stepCellRight(pos.row, pos.col, numRows, columns.length)
  }
  return null
}

function findNextEditableLeft(
  startRow: number,
  startCol: number,
  columns: { editable?: boolean }[],
  numRows: number,
): { row: number; col: number } | null {
  let pos = stepCellLeft(startRow, startCol, numRows, columns.length)
  while (pos) {
    if (columns[pos.col]?.editable) return pos
    pos = stepCellLeft(pos.row, pos.col, numRows, columns.length)
  }
  return null
}

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

const EditCell = memo(
  forwardRef<EditCellHandle, EditCellProps>(function EditCell({ initialValue, onCommit, onCancel }, ref) {
    const inputRef = useRef<HTMLInputElement>(null)
    const committed = useRef(false)

    useImperativeHandle(ref, () => ({
      getValue: () => inputRef.current?.value ?? initialValue,
      markCommitted: () => {
        committed.current = true
      },
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
  }),
)

// ──────────────────────────────────────────────
// InlineEditInput — inline 모드에서 항상 보이는 입력 필드
// ──────────────────────────────────────────────
const InlineEditInput = memo(function InlineEditInput({
  initialValue,
  originalValue,
  onCommit,
}: {
  initialValue: unknown
  originalValue: string
  onCommit: (value: unknown) => void
}) {
  const cancelledRef = useRef(false)
  const initStr = String(initialValue ?? '')
  return (
    <input
      className="datagrid__editor datagrid__editor--inline"
      defaultValue={initStr}
      onChange={(e) => {
        const td = e.target.closest<HTMLElement>('.datagrid__td')
        if (td) td.classList.toggle('dirty', e.target.value !== originalValue)
      }}
      onBlur={(e) => {
        if (!cancelledRef.current) onCommit(e.target.value)
        cancelledRef.current = false
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          cancelledRef.current = true
          ;(e.target as HTMLInputElement).value = initStr
          const td = (e.target as HTMLElement).closest<HTMLElement>('.datagrid__td')
          if (td) td.classList.toggle('dirty', initStr !== originalValue)
          ;(e.target as HTMLInputElement).blur()
        }
      }}
    />
  )
})

// ──────────────────────────────────────────────
// 정렬 아이콘
// ──────────────────────────────────────────────
function SortIcon({
  order,
  tooltip,
}: {
  order: SortOrder
  tooltip?: boolean | { title?: ReactNode }
}) {
  const title =
    tooltip === true
      ? order === 'ascend'
        ? '오름차순'
        : order === 'descend'
          ? '내림차순'
          : '정렬'
      : typeof tooltip === 'object'
        ? tooltip.title
        : undefined
  const titleAttr = typeof title === 'string' ? title : undefined
  return (
    <span className="datagrid__sort-icon" aria-hidden="true" title={titleAttr}>
      <span className={order === 'ascend' ? 'active' : ''}>▲</span>
      <span className={order === 'descend' ? 'active' : ''}>▼</span>
    </span>
  )
}

const GridCellInner = memo(function GridCellInner({
  col,
  record,
  absIdx,
  rawValue,
}: {
  col: ColumnType<Record<string, unknown>>
  record: Record<string, unknown>
  absIdx: number
  rawValue: unknown
}) {
  if (!col.render) return <>{rawValue as ReactNode}</>
  const out = normalizeCellRenderResult(col.render(rawValue, record, absIdx))
  return <>{out.children}</>
},
(prev, next) => {
  const fn = next.col.shouldCellUpdate
  if (fn) return !fn(next.record, prev.record)
  return prev.record === next.record && prev.rawValue === next.rawValue && prev.absIdx === next.absIdx
})

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
    let rangeEnd = Math.min(totalPages, rangeStart + pageButtonCount - 1)
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
        {showTotal && <span className="datagrid__pagination-total">{showTotal(total, [start, end])}</span>}
      </div>

      {/* 중앙: 페이지 이동 버튼 */}
      <div className="datagrid__pagination-nav">
        <button
          className="datagrid__pagination-btn datagrid__pagination-btn--word"
          disabled={current === 1}
          onClick={() => onChange(1, pageSize)}
        >
          처음
        </button>
        <button
          className="datagrid__pagination-btn datagrid__pagination-btn--word"
          disabled={current === 1}
          onClick={() => onChange(current - 1, pageSize)}
        >
          이전
        </button>

        {pages.map((p) => (
          <button
            key={p}
            className={`datagrid__pagination-btn${p === current ? ' active' : ''}`}
            onClick={() => onChange(p, pageSize)}
          >
            {p}
          </button>
        ))}

        <button
          className="datagrid__pagination-btn datagrid__pagination-btn--word"
          disabled={current === totalPages}
          onClick={() => onChange(current + 1, pageSize)}
        >
          다음
        </button>
        <button
          className="datagrid__pagination-btn datagrid__pagination-btn--word"
          disabled={current === totalPages}
          onClick={() => onChange(totalPages, pageSize)}
        >
          마지막
        </button>
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
              <option key={s} value={s}>
                {s}개씩
              </option>
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
  rowKey,
  loading = false,
  pagination,
  rowSelection,
  rowOperations,
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
  title,
  footer,
  showHeader = true,
  onHeaderRow,
  expandable,
  summary,
  summaryFixed,
  components,
  tableLayout = 'fixed',
  getPopupContainer,
  sticky,
  sortRemote = false,
}: DataGridProps<T>) {
  // ── 정렬 (다중 컬럼: Shift+클릭) ─────────────────
  const [sortStates, setSortStates] = useState<{ columnKey: string; order: 'ascend' | 'descend' }[]>([])
  const sortInitRef = useRef(false)

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

  useGridBreakpoint()
  const effectiveColumns = useMemo(() => filterColumnsTree(columns), [columns])
  const leafColumns = useMemo(() => getLeafColumns(effectiveColumns), [effectiveColumns])
  const resolvedColumns = useMemo(() => resolveFixedOffsets(leafColumns), [leafColumns])

  // 트리/확장처럼 index를 알기 어려운 구간에서 사용하는 내부 자동 키
  const internalObjectKeyRef = useRef(new WeakMap<object, string>())
  const internalObjectKeySeqRef = useRef(0)
  const getInternalObjectKey = useCallback((record: T) => {
    if (typeof record === 'object' && record !== null) {
      const map = internalObjectKeyRef.current
      const existing = map.get(record as object)
      if (existing) return existing
      const next = `__dg_obj_${internalObjectKeySeqRef.current++}`
      map.set(record as object, next)
      return next
    }
    // 객체가 아닌 타입은 값 기반으로라도 일관된 문자열 키를 부여
    return `__dg_prim_${String(record)}`
  }, [])

  const getRowKeyForRecord = useCallback(
    (record: T) => {
      if (typeof rowKey === 'function') {
        const k = rowKey(record)
        if (k !== undefined && k !== null && String(k) !== '') return k
      }
      if (typeof rowKey === 'string') {
        const k = (record as Record<string, unknown>)[rowKey] as string | number | undefined
        if (k !== undefined && k !== null && String(k) !== '') return k
      }
      const fallbackId = (record as Record<string, unknown>)['id'] as string | number | undefined
      if (fallbackId !== undefined && fallbackId !== null && String(fallbackId) !== '') return fallbackId
      return getInternalObjectKey(record)
    },
    [rowKey, getInternalObjectKey],
  )

  const [internalFilters, setInternalFilters] = useState<TableFilters>(() => {
    const m: TableFilters = {}
    for (const c of getLeafColumns(filterColumnsTree(columns))) {
      if (c.defaultFilteredValue?.length) m[c.key] = [...c.defaultFilteredValue]
    }
    return m
  })
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null)

  const [internalExpandedKeys, setInternalExpandedKeys] = useState<(string | number)[]>(
    () => expandable?.defaultExpandedRowKeys ?? [],
  )

  const expandedKeysList = expandable?.expandedRowKeys ?? internalExpandedKeys
  const expandedKeysSet = useMemo(() => new Set(expandedKeysList.map((k) => String(k))), [expandedKeysList])

  const mergedFilters = useMemo(() => {
    const out: TableFilters = {}
    for (const c of leafColumns) {
      const hasFilter =
        (c.filters?.length && c.onFilter) ||
        c.filterDropdown ||
        (c.filterMode === 'text' && c.onTextFilter)
      if (!hasFilter) continue
      const v = c.filteredValue !== undefined ? c.filteredValue : internalFilters[c.key]
      out[c.key] = v === undefined ? null : v
    }
    return out
  }, [leafColumns, internalFilters])

  useEffect(() => {
    if (sortInitRef.current || sortRemote) return
    const initial: { columnKey: string; order: 'ascend' | 'descend' }[] = []
    for (const c of leafColumns) {
      const o = c.defaultSortOrder
      if (o === 'ascend' || o === 'descend') initial.push({ columnKey: c.key, order: o })
    }
    if (initial.length) {
      sortInitRef.current = true
      setSortStates(initial)
    }
  }, [leafColumns, sortRemote])

  const sortOrderStatesFromColumns = useMemo(
    () =>
      leafColumns
        .filter((c) => c.sortOrder === 'ascend' || c.sortOrder === 'descend')
        .sort((a, b) => (getSorterMultiple(a) ?? 100) - (getSorterMultiple(b) ?? 100))
        .map((c) => ({ columnKey: c.key, order: c.sortOrder as 'ascend' | 'descend' })),
    [leafColumns],
  )

  const effectiveSortStates = useMemo(() => {
    if (sortRemote) {
      return sortOrderStatesFromColumns
    }
    if (sortOrderStatesFromColumns.length > 0) return sortOrderStatesFromColumns
    return sortStates
  }, [sortRemote, sortOrderStatesFromColumns, sortStates])

  const flatTreeOpts = expandable?.treeDataFromFlatList
  const childrenColumnName = expandable?.childrenColumnName
  const isFlatDepthTree = Boolean(flatTreeOpts)
  const isTreeMode = Boolean(childrenColumnName) || isFlatDepthTree

  const treeFlatRows = useMemo((): FlatTreeRow<T>[] | null => {
    if (!isTreeMode) return null
    if (isFlatDepthTree) {
      const field = flatTreeOpts?.depthField ?? 'depth'
      return flattenFlatDepthTreeRows(dataSource, field, expandedKeysSet, getRowKeyForRecord)
    }
    if (childrenColumnName) {
      return flattenTreeRows(dataSource, childrenColumnName, expandedKeysSet, getRowKeyForRecord)
    }
    return null
  }, [
    dataSource,
    isTreeMode,
    isFlatDepthTree,
    flatTreeOpts?.depthField,
    childrenColumnName,
    expandedKeysSet,
    getRowKeyForRecord,
  ])

  const filteredTreeRows = useMemo(() => {
    if (!treeFlatRows) return null
    return treeFlatRows.filter(({ record }) =>
      recordMatchesColumnFilters(record, leafColumns as unknown as ColumnType<T>[], mergedFilters),
    )
  }, [treeFlatRows, leafColumns, mergedFilters])

  const filteredFlatData = useMemo(() => {
    if (treeFlatRows) return null
    return applyColumnFilters(
      dataSource,
      leafColumns as unknown as ColumnType<T>[],
      mergedFilters as Record<string, Key[] | null | undefined>,
    )
  }, [dataSource, treeFlatRows, leafColumns, mergedFilters])

  const sortedFlatData = useMemo(() => {
    if (treeFlatRows) return null
    if (sortRemote) return filteredFlatData ?? []
    return applyMultiSort(filteredFlatData ?? [], effectiveSortStates, leafColumns as unknown as ColumnType<T>[])
  }, [treeFlatRows, filteredFlatData, effectiveSortStates, leafColumns, sortRemote])

  const rowPacks = useMemo((): {
    record: T
    depth: number
    rowKey: string | number
    hasTreeChildren?: boolean
  }[] => {
    if (filteredTreeRows) {
      return filteredTreeRows.map((r) => ({
        record: r.record,
        depth: r.depth,
        rowKey: r.rowKey,
        hasTreeChildren: r.hasTreeChildren,
      }))
    }
    const list = sortedFlatData ?? []
    return list.map((record, i) => ({
      record,
      depth: 0,
      rowKey: getRowKey(record, rowKey, i),
    }))
  }, [filteredTreeRows, sortedFlatData, rowKey])
  // resolvedColumnsRef는 검증 핸들에서 사용 (아래 선언 후 동기화)

  // ── 그룹헤더 th sticky-top 오프셋 ───────────────
  // <th> 셀 자체에 position:sticky 적용 시, 2번째 헤더 행은 첫 행 높이만큼 top을 내려야 함
  // useLayoutEffect는 headerRows 선언 이후에 배치 (아래 헤더 행 계산 블록 근처)
  const theadRef = useRef<HTMLTableSectionElement>(null)
  const [thTopOffsets, setThTopOffsets] = useState<number[]>([])

  // ── 리사이즈 상태 ─────────────────────────────
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const resizeRef = useRef<{ key: string; startX: number; startWidth: number; moved: boolean } | null>(null)

  // ── 편집된 셀 추적 (dirty): 원본 값을 저장하여 현재 값과 비교 ──
  const originalValuesRef = useRef<Map<string, unknown>>(new Map())

  // ── 검증 상태 ─────────────────────────────────
  const [validateErrors, setValidateErrors] = useState<ValidateError[]>([])
  // 명령형 핸들(gridRef)에서 최신 상태에 접근하기 위한 ref (stale closure 방지)
  const validateErrorsRef = useRef<ValidateError[]>([])
  const dataSourceRef = useRef(dataSource)
  const resolvedColumnsRef = useRef<InternalColumnType<T>[]>([])
  const rowKeyPropRef = useRef(rowKey)
  const onValidateChangeRef = useRef(onValidateChange)

  // 매 렌더마다 최신값 동기화
  dataSourceRef.current = dataSource
  resolvedColumnsRef.current = resolvedColumns
  rowKeyPropRef.current = rowKey
  onValidateChangeRef.current = onValidateChange

  // ── 검증 오류 Map (셀 룩업: `${rowKey}::${colKey}`) ──────────────
  const validateErrorMap = useMemo(() => {
    const m = new Map<string, ValidateError>()
    for (const e of validateErrors) m.set(`${String(e.rowKey)}::${e.columnKey}`, e)
    return m
  }, [validateErrors])

  // ── 검증 상태 업데이트 헬퍼 (ref·onValidateChange 동기 유지) ──────
  const setValidateErrorsSync = useCallback((updater: (prev: ValidateError[]) => ValidateError[]) => {
    setValidateErrors((prev) => {
      const next = updater(prev)
      validateErrorsRef.current = next
      // 성공/검증중 제외한 오류만 외부에 알림
      const reportable = next.filter((e) => e.status === 'error' || e.status === 'warning')
      onValidateChangeRef.current?.(reportable)
      return next
    })
  }, [])

  // ── 페이지네이션 ───────────────────────────────
  const isPaginationDisabled = pagination === false
  const paginationConfig = pagination !== false ? (pagination ?? null) : null

  // 완전 제어 모드에서만 paginationConfig.pageSize를 사용합니다.
  // 그 외에는 항상 internalPageSize를 사용하여 크기 변경기가 정상 동작하도록 합니다.
  const isControlledPagination = paginationConfig?.current !== undefined && paginationConfig?.total !== undefined
  const currentPage = isControlledPagination ? (paginationConfig?.current ?? 1) : internalPage
  const currentPageSize = isControlledPagination ? (paginationConfig?.pageSize ?? internalPageSize) : internalPageSize
  const totalCount = paginationConfig?.total ?? rowPacks.length

  const pagedData = useMemo(() => {
    if (isPaginationDisabled || paginationConfig?.total !== undefined) return rowPacks
    const start = (currentPage - 1) * currentPageSize
    return rowPacks.slice(start, start + currentPageSize)
  }, [rowPacks, isPaginationDisabled, paginationConfig, currentPage, currentPageSize])

  const hasExpandRender = Boolean(expandable?.expandedRowRender && !isTreeMode)
  const hasExpandCol = hasExpandRender || isTreeMode
  const expandColWidth = hasExpandCol ? 40 : 0

  // ── 가상화 ───────────────────────────
  const shouldVirtualize =
    !isTreeMode && !hasExpandCol && (virtual ?? pagedData.length > VIRTUAL_THRESHOLD)
  const {
    containerRef,
    offsetTop,
    offsetBottom,
    visibleRange,
    onScroll: onVirtualScroll,
    scrollToRow,
  } = useVirtualRows({
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

  // ── inline 모드: 활성 셀 이동 시 에디터 또는(텍스트 전용 셀이면) td에 포커스 — Tab 순서가 그리드 밖으로 새지 않도록 함
  useLayoutEffect(() => {
    if (editMode !== 'inline' || !activeCellPos || !containerRef.current) return
    const { rowAbsIdx, colIdx } = activeCellPos
    const td = containerRef.current.querySelector<HTMLElement>(`[data-row="${rowAbsIdx}"][data-col="${colIdx}"]`)
    if (!td) return
    const focusable = td.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea')
    if (focusable) {
      if (document.activeElement !== focusable) focusable.focus()
    } else if (document.activeElement !== td) {
      td.focus()
    }
  }, [editMode, activeCellPos, containerRef])

  // ── dblclick/click 편집: editCell 변경 직후 에디터에 포커스 (Tab으로 이동 시 autoFocus 타이밍상 포커스가 빠져 행 선택 체크박스로 가는 것 방지)
  useLayoutEffect(() => {
    if (editMode === 'inline' || !editCell || !containerRef.current) return
    const rowAbsIdx = pagedData.findIndex((p) => String(p.rowKey) === String(editCell.rowKey))
    if (rowAbsIdx < 0) return
    const colIdx = resolvedColumns.findIndex((c) => c.key === editCell.colKey)
    if (colIdx < 0) return
    const td = containerRef.current.querySelector<HTMLElement>(`[data-row="${rowAbsIdx}"][data-col="${colIdx}"]`)
    if (!td) return
    const focusable = td.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea')
    if (focusable && document.activeElement !== focusable) {
      focusable.focus()
    }
  }, [editMode, editCell, pagedData, resolvedColumns, containerRef])

  // ── 가로 스크롤: 컬럼이 보이는 영역 밖이면 스크롤 ──
  const scrollToCol = useCallback(
    (colIdx: number) => {
      if (!containerRef.current) return
      const col = resolvedColumns[colIdx]
      if (!col || col.fixed) return // 고정 컬럼은 항상 보임

      const container = containerRef.current
      const selWidth = rowSelection ? 40 : 0

      // 해당 컬럼의 절대 좌측 오프셋 계산
      let absLeft = selWidth + expandColWidth
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
    },
    [containerRef, resolvedColumns, columnWidths, rowSelection, expandColWidth],
  )

  // ── 셀 검증 실행 (onBlur 또는 내부 호출) ────────
  const runValidator = useCallback(
    async (rk: string | number, colKey: string, value: unknown, record: T) => {
      const col = resolvedColumns.find((c) => c.key === colKey)
      if (!col?.validator) return

      // 검증 중 상태 표시
      setValidateErrorsSync((prev) => {
        const next = prev.filter((e) => !(e.rowKey === rk && e.columnKey === colKey))
        return [...next, { rowKey: rk, columnKey: colKey, status: 'validating' }]
      })

      try {
        const result = await col.validator(value, record, rk, dataSourceRef.current)
        setValidateErrorsSync((prev) => {
          const next = prev.filter((e) => !(String(e.rowKey) === String(rk) && e.columnKey === colKey))
          if (!result || result.status === 'success') return next
          return [...next, { rowKey: rk, columnKey: colKey, status: result.status, message: result.message }]
        })
      } catch (err) {
        setValidateErrorsSync((prev) => {
          const next = prev.filter((e) => !(String(e.rowKey) === String(rk) && e.columnKey === colKey))
          return [...next, { rowKey: rk, columnKey: colKey, status: 'error', message: String(err) }]
        })
      }
    },
    [resolvedColumns, setValidateErrorsSync],
  )

  const isCellEditable = useCallback((col: ColumnType<T>, record: T, rowAbsIdx: number) => {
    if (!col.editable) return false
    return col.editableWhen ? col.editableWhen(record, rowAbsIdx) : true
  }, [])

  // ── 활성 셀 이동 ────────────────────────────
  const moveActiveCell = useCallback(
    (rowAbsIdx: number, colIdx: number) => {
      const newRow = Math.max(0, Math.min(pagedData.length - 1, rowAbsIdx))
      const newCol = Math.max(0, Math.min(resolvedColumns.length - 1, colIdx))
      const pack = pagedData[newRow]
      if (!pack) return
      const { record, rowKey: rk } = pack
      setActiveCellPos({ rowAbsIdx: newRow, colIdx: newCol })
      setFocusedKey(rk)
      scrollToRow(newRow)
      scrollToCol(newCol)
      onFocusedRowChange?.(record, newRow)
    },
    [pagedData, resolvedColumns.length, scrollToRow, scrollToCol, onFocusedRowChange],
  )

  // ── commitAndMove — 현재 편집기를 커밋하고 다음 셀로 이동 ──
  const commitAndMove = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (!activeCellPos || !editCell) return
      const { rowAbsIdx, colIdx } = activeCellPos

      // 값을 읽고 onBlur에서 중복 커밋 방지
      const value = editCellRef.current?.getValue()
      editCellRef.current?.markCommitted()

      // 편집 내용 저장 + onBlur 검증
      const pack = pagedData[rowAbsIdx]
      const record = pack?.record
      if (record && value !== undefined) {
        const col = resolvedColumns.find((c) => c.key === editCell.colKey)
        const oldValue = getRecordValue(record, col?.dataIndex, editCell.colKey)
        const ck = `${String(editCell.rowKey)}::${editCell.colKey}`
        if (!originalValuesRef.current.has(ck)) originalValuesRef.current.set(ck, oldValue)
        onCellEdit?.(editCell.rowKey, editCell.colKey, value, record)
        if (col?.validator && (col.validateTrigger ?? 'onBlur') === 'onBlur') {
          const field = typeof col.dataIndex === 'string' ? col.dataIndex : col.key
          const updatedRecord = { ...record, [field]: value }
          void runValidator(editCell.rowKey, editCell.colKey, value, updatedRecord)
        }
      }

      const numRows = pagedData.length
      const focusScrollSoon = () => {
        requestAnimationFrame(() => {
          containerRef.current?.focus()
        })
      }

      // 다음 위치 계산 (좌우 Tab: 비편집 컬럼은 건너뛰어 다음 editable로 — 포커스가 그리드 밖으로 새지 않게)
      let nextRow = rowAbsIdx
      let nextCol = colIdx

      if (direction === 'right') {
        const pos = findNextEditableRight(rowAbsIdx, colIdx, resolvedColumns, numRows)
        if (!pos) {
          setEditCell(null)
          focusScrollSoon()
          return
        }
        nextRow = pos.row
        nextCol = pos.col
      } else if (direction === 'left') {
        const pos = findNextEditableLeft(rowAbsIdx, colIdx, resolvedColumns, numRows)
        if (!pos) {
          setEditCell(null)
          focusScrollSoon()
          return
        }
        nextRow = pos.row
        nextCol = pos.col
      } else if (direction === 'down') {
        nextRow = Math.min(numRows - 1, rowAbsIdx + 1)
      } else if (direction === 'up') {
        nextRow = Math.max(0, rowAbsIdx - 1)
      }

      const nextPack = pagedData[nextRow]
      const nextRecord = nextPack?.record
      const nextCol_ = resolvedColumns[nextCol]
      if (!nextRecord || !nextCol_) {
        setEditCell(null)
        focusScrollSoon()
        return
      }

      const nextRowKey = nextPack.rowKey
      setActiveCellPos({ rowAbsIdx: nextRow, colIdx: nextCol })
      setFocusedKey(nextRowKey)
      scrollToRow(nextRow)
      scrollToCol(nextCol)
      onFocusedRowChange?.(nextRecord, nextRow)

      if (direction === 'right' || direction === 'left') {
        setEditCell(
          isCellEditable(nextCol_, nextRecord, nextRow) ? { rowKey: nextRowKey, colKey: nextCol_.key } : null,
        )
      } else if (isCellEditable(nextCol_, nextRecord, nextRow)) {
        setEditCell({ rowKey: nextRowKey, colKey: nextCol_.key })
      } else {
        setEditCell(null)
        focusScrollSoon()
      }
    },
    [
      activeCellPos,
      editCell,
      pagedData,
      resolvedColumns,
      onCellEdit,
      scrollToRow,
      scrollToCol,
      runValidator,
      onFocusedRowChange,
      containerRef,
      isCellEditable,
    ],
  )

  // ── 키보드 핸들러 (스크롤 컨테이너에 적용) ────
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
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
              const record = pagedData[activeCellPos.rowAbsIdx]?.record
              if (record) {
                const col = resolvedColumns.find((c) => c.key === editCell.colKey)
                const oldValue = getRecordValue(record, col?.dataIndex, editCell.colKey)
                const ck = `${String(editCell.rowKey)}::${editCell.colKey}`
                if (!originalValuesRef.current.has(ck)) originalValuesRef.current.set(ck, oldValue)
                onCellEdit?.(editCell.rowKey, editCell.colKey, value, record)
                if (col?.validator && (col.validateTrigger ?? 'onBlur') === 'onBlur') {
                  const field = typeof col.dataIndex === 'string' ? col.dataIndex : col.key
                  const updatedRecord = { ...record, [field]: value }
                  void runValidator(editCell.rowKey, editCell.colKey, value, updatedRecord)
                }
              }
            }
          }
          setEditCell(null)
          // 입력이 언마운트되며 포커스가 사라지면 다음 Tab이 그리드 밖(사이드바 등)으로 새므로 컨테이너로 되돌림
          requestAnimationFrame(() => {
            containerRef.current?.focus()
          })
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
          if (col) {
            const pk = pagedData[activeCellPos.rowAbsIdx]
            if (pk && isCellEditable(col, pk.record, activeCellPos.rowAbsIdx)) {
              setEditCell({ rowKey: pk.rowKey, colKey: col.key })
            }
          }
          break
        }
        case 'Escape':
          setActiveCellPos(null)
          setFocusedKey(null)
          break
      }
    },
    [
      editCell,
      activeCellPos,
      moveActiveCell,
      commitAndMove,
      editMode,
      resolvedColumns,
      pagedData,
      onCellEdit,
      runValidator,
      containerRef,
      isCellEditable,
    ],
  )

  // ── 정렬 핸들러 (Shift+클릭: 다중 정렬) ───────────
  const handleSort = useCallback(
    (col: ColumnType<T>, e?: ReactMouseEvent) => {
      if (!col.sorter || isTreeMode) return
      const shift = e?.shiftKey
      setActiveCellPos(null)
      setEditCell(null)

      const sorterField = (c: ColumnType<T>) => {
        const di = c.dataIndex
        return Array.isArray(di) ? di.join('.') : (di ?? c.key)
      }

      const computeNextSortKeys = (
        base: { columnKey: string; order: 'ascend' | 'descend' }[],
      ): { columnKey: string; order: 'ascend' | 'descend' }[] => {
        const ex = base.find((s) => s.columnKey === col.key)
        let next: { columnKey: string; order: 'ascend' | 'descend' }[]
        if (!shift) {
          if (!ex) next = [{ columnKey: col.key, order: 'ascend' }]
          else if (ex.order === 'ascend') next = [{ columnKey: col.key, order: 'descend' }]
          else next = []
        } else {
          const i = base.findIndex((s) => s.columnKey === col.key)
          if (i < 0) next = [...base, { columnKey: col.key, order: 'ascend' }]
          else if (base[i].order === 'ascend')
            next = base.map((s, j) => (j === i ? { ...s, order: 'descend' as const } : s))
          else next = base.filter((s) => s.columnKey !== col.key)
        }
        return next
      }

      const filtered = applyColumnFilters(
        dataSource,
        leafColumns as unknown as ColumnType<T>[],
        mergedFilters as Record<string, Key[] | null | undefined>,
      )

      if (sortRemote) {
        const next = computeNextSortKeys(sortOrderStatesFromColumns)
        const sr: SorterResult<T>[] = next.map((s) => {
          const c = leafColumns.find((x) => x.key === s.columnKey)!
          return {
            column: c,
            columnKey: s.columnKey,
            order: s.order,
            field: sorterField(c),
          }
        })
        onChange?.(
          { current: currentPage, pageSize: currentPageSize },
          mergedFilters,
          sr.length <= 1 ? (sr[0] ?? {}) : sr,
          { currentDataSource: filtered, action: 'sort' },
        )
        return
      }

      setSortStates((prev) => {
        const fromProps = leafColumns.filter((c) => c.sortOrder === 'ascend' || c.sortOrder === 'descend')
        const base =
          fromProps.length > 0
            ? fromProps
                .sort((a, b) => (getSorterMultiple(a) ?? 100) - (getSorterMultiple(b) ?? 100))
                .map((c) => ({ columnKey: c.key, order: c.sortOrder as 'ascend' | 'descend' }))
            : prev

        const next = computeNextSortKeys(base)
        const after = applyMultiSort(filtered, next, leafColumns as unknown as ColumnType<T>[])
        const sr: SorterResult<T>[] = next.map((s) => {
          const c = leafColumns.find((x) => x.key === s.columnKey)!
          return {
            column: c,
            columnKey: s.columnKey,
            order: s.order,
            field: sorterField(c),
          }
        })
        onChange?.(
          { current: currentPage, pageSize: currentPageSize },
          mergedFilters,
          sr.length <= 1 ? (sr[0] ?? {}) : sr,
          { currentDataSource: after, action: 'sort' },
        )

        return next
      })
    },
    [
      isTreeMode,
      leafColumns,
      dataSource,
      mergedFilters,
      onChange,
      currentPage,
      currentPageSize,
      sortRemote,
      sortOrderStatesFromColumns,
    ],
  )

  // ── 페이지네이션 핸들러 ────────────────────────
  const handlePageChange = useCallback(
    (page: number, pageSize: number) => {
      setInternalPage(page)
      setInternalPageSize(pageSize)
      // 페이지 변경 시 키보드 위치 초기화
      setActiveCellPos(null)
      setEditCell(null)
      paginationConfig?.onChange?.(page, pageSize)
      const sr: SorterResult<T>[] = effectiveSortStates.map((s) => {
        const c = leafColumns.find((x) => x.key === s.columnKey)!
        const di = c.dataIndex
        const field = Array.isArray(di) ? di.join('.') : (di ?? c.key)
        return { column: c, columnKey: s.columnKey, order: s.order, field }
      })
      onChange?.(
        { current: page, pageSize },
        mergedFilters,
        sr.length <= 1 ? (sr[0] ?? {}) : sr,
        {
          currentDataSource: rowPacks.map((p) => p.record),
          action: 'paginate',
        },
      )
    },
    [paginationConfig, onChange, mergedFilters, effectiveSortStates, leafColumns, rowPacks],
  )

  // ── 선택 핸들러 ────────────────────────────────
  const selectedKeys = useMemo(() => new Set(rowSelection?.selectedRowKeys ?? []), [rowSelection?.selectedRowKeys])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!rowSelection) return
      const newKeys: (string | number)[] = []
      const newRows: T[] = []
      const changeRows: T[] = []
      for (let i = 0; i < pagedData.length; i++) {
        const { record: r, rowKey: key } = pagedData[i]
        const disabled = rowSelection.getCheckboxProps?.(r)?.disabled
        if (disabled) {
          if (selectedKeys.has(key)) {
            newKeys.push(key)
            newRows.push(r)
          }
        } else {
          changeRows.push(r)
          if (checked) {
            newKeys.push(key)
            newRows.push(r)
          }
        }
      }
      rowSelection.onChange?.(newKeys, newRows)
      rowSelection.onSelectAll?.(checked, newRows, changeRows)
    },
    [rowSelection, pagedData, selectedKeys],
  )

  const handleSelectRow = useCallback(
    (record: T, index: number, checked: boolean) => {
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
        newRows = pagedData.filter((p) => newKeysSet.has(p.rowKey)).map((p) => p.record)
      }
      rowSelection.onChange?.(newKeys, newRows)
      rowSelection.onSelect?.(record, checked, newRows)
    },
    [rowSelection, rowKey, pagedData],
  )

  const handleRowDeleteClick = useCallback(
    (rk: string | number, record: T) => {
      rowOperations?.onDelete?.(rk, record)
      setValidateErrorsSync((prev) => prev.filter((e) => String(e.rowKey) !== String(rk)))
      setEditCell((prev) => (prev && String(prev.rowKey) === String(rk) ? null : prev))
      setFocusedKey((fk) => (fk !== null && String(fk) === String(rk) ? null : fk))
      setActiveCellPos(null)
    },
    [rowOperations, setValidateErrorsSync],
  )

  const handleDeleteSelectedClick = useCallback(() => {
    const onBulk = rowOperations?.onDeleteSelected
    const rs = rowSelection
    if (!onBulk || !rs) return
    const keys = rs.selectedRowKeys ?? []
    if (keys.length === 0) return
    const keySet = new Set(keys.map((k) => String(k)))
    const rows: T[] = []
    for (let i = 0; i < dataSource.length; i++) {
      const rec = dataSource[i]
      if (keySet.has(String(getRowKey(rec, rowKey, i)))) rows.push(rec)
    }
    onBulk(keys, rows)
    setValidateErrorsSync((prev) => prev.filter((e) => !keySet.has(String(e.rowKey))))
    setEditCell((prev) => (prev && keySet.has(String(prev.rowKey)) ? null : prev))
    setFocusedKey((fk) => (fk !== null && keySet.has(String(fk)) ? null : fk))
    setActiveCellPos(null)
  }, [rowOperations, rowSelection, dataSource, rowKey, setValidateErrorsSync])

  // ── 셀 편집 핸들러 ────────────────────────────
  const handleCellActivate = useCallback(
    (
      rowK: string | number,
      colKey: string,
      col: ColumnType<T>,
      record: T,
      rowAbsIdx: number,
      colIdx: number,
    ) => {
      if (!isCellEditable(col, record, rowAbsIdx)) return
      setEditCell({ rowKey: rowK, colKey })
      setActiveCellPos({ rowAbsIdx, colIdx })
      setFocusedKey(rowK)
    },
    [isCellEditable],
  )

  const handleEditCommit = useCallback(
    (record: T, rowK: string | number, colKey: string, newValue: unknown) => {
      setEditCell(null)
      const col = resolvedColumns.find((c) => c.key === colKey)
      const oldValue = getRecordValue(record, col?.dataIndex, colKey)
      const ck = `${String(rowK)}::${colKey}`
      if (!originalValuesRef.current.has(ck)) originalValuesRef.current.set(ck, oldValue)
      onCellEdit?.(rowK, colKey, newValue, record)
      if (col?.validator && (col.validateTrigger ?? 'onBlur') === 'onBlur') {
        const field = typeof col.dataIndex === 'string' ? col.dataIndex : col.key
        const updatedRecord = { ...record, [field]: newValue }
        void runValidator(rowK, colKey, newValue, updatedRecord)
      }
    },
    [onCellEdit, resolvedColumns, runValidator],
  )

  // ── 리사이즈 핸들러 ───────────────────────────
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, col: ColumnType<T>) => {
      e.preventDefault()
      e.stopPropagation()
      const thEl = (e.currentTarget as HTMLElement).closest('th')
      const startWidth = columnWidths[col.key] ?? (typeof col.width === 'number' ? col.width : 100)
      resizeRef.current = { key: col.key, startX: e.clientX, startWidth, moved: false }

      const onMouseMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return
        const { key, startX, startWidth: sw } = resizeRef.current
        const delta = ev.clientX - startX
        if (Math.abs(delta) > 1) resizeRef.current.moved = true
        const colDef = leafColumns.find((c) => c.key === key)
        const min = colDef?.minWidth ?? 40
        const max = colDef?.maxWidth ?? Infinity
        setColumnWidths((prev) => ({ ...prev, [key]: Math.min(max, Math.max(min, sw + delta)) }))
      }
      const onMouseUp = () => {
        const session = resizeRef.current
        if (session?.moved && thEl) {
          const t0 = performance.now()
          const ac = new AbortController()
          const killResizeGhostClick = (ev: MouseEvent) => {
            if (thEl.contains(ev.target as Node) && performance.now() - t0 < 100) {
              ev.preventDefault()
              ev.stopPropagation()
            }
            ac.abort()
          }
          document.addEventListener('click', killResizeGhostClick, { capture: true, signal: ac.signal })
          window.setTimeout(() => ac.abort(), 400)
        }
        resizeRef.current = null
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [columnWidths, leafColumns],
  )

  // ── gridRef 명령형 핸들 등록 ─────────────────────
  useEffect(() => {
    if (!gridRef) return
    const handle = {
      /** dataSource 전체에 대해 validator 실행 */
      validate: async (): Promise<boolean> => {
        const allData = dataSourceRef.current
        const cols = resolvedColumnsRef.current
        const rk = rowKeyPropRef.current

        // 검증 대상 컬럼만 추출
        const validatorCols = cols.filter((c) => c.validator)
        if (validatorCols.length === 0) return true

        // 모든 셀 병렬 검증
        type Entry = { rowKey: string | number; columnKey: string; result: ValidateResult | null | undefined }
        const entries = await Promise.all(
          allData.flatMap((record, idx) => {
            const recordKey = getRowKey(record, rk, idx)
            return validatorCols.map(async (col): Promise<Entry> => {
              const val = getRecordValue(record, col.dataIndex, col.key)
              try {
                const result = await col.validator!(val, record, recordKey, allData)
                return { rowKey: recordKey, columnKey: col.key, result }
              } catch (err) {
                return { rowKey: recordKey, columnKey: col.key, result: { status: 'error', message: String(err) } }
              }
            })
          }),
        )

        const newErrors: ValidateError[] = entries
          .filter((e) => e.result && e.result.status !== 'success')
          .map((e) => ({
            rowKey: e.rowKey,
            columnKey: e.columnKey,
            status: e.result!.status,
            message: e.result!.message,
          }))

        validateErrorsRef.current = newErrors
        setValidateErrors(newErrors)
        const reportable = newErrors.filter((e) => e.status === 'error' || e.status === 'warning')
        onValidateChangeRef.current?.(reportable)

        return !newErrors.some((e) => e.status === 'error')
      },

      /** 현재 오류 목록 반환 */
      getErrors: (): ValidateError[] =>
        validateErrorsRef.current.filter((e) => e.status === 'error' || e.status === 'warning'),

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
        const col = resolvedColumnsRef.current.find((c) => c.key === columnKey)
        return getRecordValue(record, col?.dataIndex, columnKey)
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
  const maxDepth = useMemo(() => getMaxDepth(effectiveColumns), [effectiveColumns])
  const headerRows = useMemo(() => buildHeaderRows(effectiveColumns, maxDepth), [effectiveColumns, maxDepth])

  const hasRowAdd = Boolean(rowOperations?.showAdd && rowOperations.onAdd)
  const hasRowDelete = Boolean(rowOperations?.showDelete && rowOperations.onDelete)
  const hasDeleteSelected = Boolean(
    rowOperations?.showDeleteSelected && rowOperations.onDeleteSelected && rowSelection,
  )
  const hasToolbar = hasRowAdd || hasDeleteSelected
  const tableBodyColSpan =
    resolvedColumns.length + (rowSelection ? 1 : 0) + (hasRowDelete ? 1 : 0) + (hasExpandCol ? 1 : 0)

  const selectedRowKeysForOps = rowSelection?.selectedRowKeys ?? []
  const deleteSelectedDisabled = (() => {
    const override = rowOperations?.getDeleteSelectedButtonProps?.()
    if (override?.disabled !== undefined) return override.disabled
    return selectedRowKeysForOps.length === 0
  })()

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
    setThTopOffsets((prev) =>
      prev.length === newOffsets.length && prev.every((v, i) => v === newOffsets[i]) ? prev : newOffsets,
    )
  }, [headerRows, hasRowDelete, hasDeleteSelected, rowSelection, hasExpandCol])

  const rootRef = useRef<HTMLDivElement>(null)
  const stickyOffset = typeof sticky === 'object' && sticky ? (sticky.offsetHeader ?? 0) : 0

  const resolvePopupContainer = useCallback(() => {
    return getPopupContainer?.() ?? rootRef.current ?? document.body
  }, [getPopupContainer])

  const commitColumnFilter = useCallback(
    (colKey: string, keys: Key[]) => {
      setInternalFilters((prev) => ({ ...prev, [colKey]: keys.length ? keys : null }))
      setOpenFilterKey(null)
      setFilterAnchorEl(null)
      const newMerged: TableFilters = { ...mergedFilters, [colKey]: keys.length ? keys : null }
      const filtered = applyColumnFilters(
        dataSource,
        leafColumns as unknown as ColumnType<T>[],
        newMerged as Record<string, Key[] | null | undefined>,
      )
      const after = isTreeMode
        ? filtered
        : sortRemote
          ? filtered
          : applyMultiSort(filtered, effectiveSortStates, leafColumns as unknown as ColumnType<T>[])
      const sr: SorterResult<T>[] = effectiveSortStates.map((s) => {
        const c = leafColumns.find((x) => x.key === s.columnKey)!
        const di = c.dataIndex
        const field = Array.isArray(di) ? di.join('.') : (di ?? c.key)
        return { column: c, columnKey: s.columnKey, order: s.order, field }
      })
      onChange?.(
        { current: currentPage, pageSize: currentPageSize },
        newMerged,
        sr.length <= 1 ? (sr[0] ?? {}) : sr,
        { currentDataSource: after, action: 'filter' },
      )
    },
    [
      dataSource,
      leafColumns,
      mergedFilters,
      effectiveSortStates,
      isTreeMode,
      sortRemote,
      onChange,
      currentPage,
      currentPageSize,
    ],
  )

  const clearColumnFilterState = useCallback(
    (col: ColumnType<T>) => {
      const keys: Key[] =
        col.filterResetToDefaultFilteredValue && col.defaultFilteredValue?.length
          ? [...col.defaultFilteredValue]
          : []
      commitColumnFilter(col.key, keys)
    },
    [commitColumnFilter],
  )

  const toggleRowExpand = useCallback(
    (rk: string | number, record: T, isOpen: boolean) => {
      const nextOpen = !isOpen
      expandable?.onExpand?.(nextOpen, record)
      const list = expandedKeysList
      const nextKeys = nextOpen
        ? [...list.filter((k) => String(k) !== String(rk)), rk]
        : list.filter((k) => String(k) !== String(rk))
      if (expandable?.expandedRowKeys === undefined) setInternalExpandedKeys(nextKeys)
      expandable?.onExpandedRowsChange?.(nextKeys)

      const sr: SorterResult<T>[] = effectiveSortStates.map((s) => {
        const c = leafColumns.find((x) => x.key === s.columnKey)!
        const di = c.dataIndex
        const field = Array.isArray(di) ? di.join('.') : (di ?? c.key)
        return { column: c, columnKey: s.columnKey, order: s.order, field }
      })
      onChange?.(
        { current: currentPage, pageSize: currentPageSize },
        mergedFilters,
        sr.length <= 1 ? (sr[0] ?? {}) : sr,
        { currentDataSource: rowPacks.map((p) => p.record), action: 'expand' },
      )
    },
    [
      expandable,
      expandedKeysList,
      onChange,
      currentPage,
      currentPageSize,
      mergedFilters,
      effectiveSortStates,
      leafColumns,
      rowPacks,
    ],
  )

  const TableTag = components?.table ?? 'table'
  const BodyRowTag = components?.body?.row ?? 'tr'

  // ── 루트 클래스 ────────────────────────────────
  const rootClass = ['datagrid', `datagrid--${size}`, bordered && 'bordered', className]
    .filter(Boolean)
    .join(' ')

  let _enabledCount = 0,
    _selectedEnabledCount = 0
  for (let i = 0; i < pagedData.length; i++) {
    const { record: pr, rowKey: pk } = pagedData[i]
    if (rowSelection?.getCheckboxProps?.(pr)?.disabled) continue
    _enabledCount++
    if (selectedKeys.has(pk)) _selectedEnabledCount++
  }
  const allSelected = _enabledCount > 0 && _selectedEnabledCount === _enabledCount
  const indeterminate = !allSelected && _selectedEnabledCount > 0

  const openFilterColumn = openFilterKey ? leafColumns.find((c) => c.key === openFilterKey) : undefined

  return (
    <div className={rootClass} style={style} ref={rootRef}>
      {loading && (
        <div className="datagrid__loading">
          <div className="datagrid__spinner" />
        </div>
      )}

      {hasToolbar && (
        <div className="datagrid__toolbar">
          {hasRowAdd && (
            <button type="button" className="datagrid__toolbar-btn" onClick={() => rowOperations?.onAdd?.()}>
              {rowOperations?.addLabel ?? '행 추가'}
            </button>
          )}
          {hasDeleteSelected && (
            <button
              type="button"
              className="datagrid__toolbar-btn datagrid__toolbar-btn--danger"
              disabled={deleteSelectedDisabled}
              title={
                deleteSelectedDisabled && selectedRowKeysForOps.length === 0
                  ? '삭제할 행을 선택하세요'
                  : (rowOperations?.deleteSelectedLabel ?? '선택 삭제')
              }
              aria-label={rowOperations?.deleteSelectedLabel ?? '선택 삭제'}
              onClick={() => handleDeleteSelectedClick()}
            >
              {rowOperations?.deleteSelectedLabel ?? '선택 삭제'}
            </button>
          )}
        </div>
      )}

      {title && (
        <div className="datagrid__caption datagrid__caption--top">{title(pagedData.map((p) => p.record))}</div>
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
        <TableTag
          className="datagrid__table"
          style={{ minWidth: scroll?.x === true ? undefined : scroll?.x, tableLayout }}
        >
          <colgroup>
            {hasExpandCol && <col style={{ width: expandColWidth }} />}
            {rowSelection && <col style={{ width: 40 }} />}
            {resolvedColumns.map((col) => (
              <col key={col.key} style={{ width: columnWidths[col.key] ?? col.width }} />
            ))}
            {hasRowDelete && <col style={{ width: ROW_OPS_DELETE_COL_WIDTH }} />}
          </colgroup>

          {/* 헤더 — 다중 행(그룹 헤더) 지원 */}
          {showHeader && (
            <thead className="datagrid__thead" ref={theadRef}>
              {headerRows.map((row, rowIdx) => (
                <tr key={rowIdx} {...(onHeaderRow?.(row.map((x) => x.col), rowIdx) ?? {})}>
                  {rowIdx === 0 && hasExpandCol && (
                    <th
                      className="datagrid__th datagrid__expand-col"
                      rowSpan={maxDepth > 1 ? maxDepth : undefined}
                      style={
                        {
                          '--th-sticky-top': `${(thTopOffsets[0] ?? 0) + stickyOffset}px`,
                        } as CSSProperties
                      }
                    />
                  )}
                  {rowIdx === 0 && rowSelection && (
                  <th
                    className="datagrid__th datagrid__selection-col"
                    rowSpan={maxDepth > 1 ? maxDepth : undefined}
                    style={
                      {
                        '--th-sticky-top': `${(thTopOffsets[0] ?? 0) + stickyOffset}px`,
                      } as CSSProperties
                    }
                  >
                    {(rowSelection.type ?? 'checkbox') === 'checkbox' && (
                      <input
                        type="checkbox"
                        tabIndex={-1}
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = indeterminate
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    )}
                  </th>
                )}
                {row.map(({ col, colSpan, rowSpan }) => {
                  const isLeaf = !col.children?.length
                  const sortState = effectiveSortStates.find((s) => s.columnKey === col.key)
                  const currentOrder: SortOrder = sortState ? sortState.order : null
                  const isCurrentSort = Boolean(currentOrder)
                  const leafInternal = resolvedColumns.find((c) => c.key === col.key)
                  const thClass = [
                    'datagrid__th',
                    col.align ? `align-${col.align}` : '',
                    isLeaf && col.sorter ? 'sortable' : '',
                    isLeaf && isCurrentSort && currentOrder ? 'sorted' : '',
                    isLeaf && col.fixed ? `fixed-${col.fixed}` : '',
                    !isLeaf ? 'group-header' : '',
                    isLeaf && col.resizable !== false ? 'resizable' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  const effectiveColSpan =
                    isLeaf && col.colSpan != null && col.colSpan > 1
                      ? col.colSpan
                      : colSpan > 1
                        ? colSpan
                        : undefined

                  const stickyStyle: CSSProperties = {
                    '--th-sticky-top': `${(thTopOffsets[rowIdx] ?? 0) + stickyOffset}px`,
                  } as CSSProperties
                  if (isLeaf && col.fixed === 'left') {
                    ;(stickyStyle as Record<string, unknown>)['--sticky-left'] = `${leafInternal?._left ?? 0}px`
                  }
                  if (isLeaf && col.fixed === 'right') {
                    ;(stickyStyle as Record<string, unknown>)['--sticky-right'] = `${leafInternal?._right ?? 0}px`
                  }

                  const hasFilter = Boolean(
                    isLeaf &&
                      ((col.filters?.length && col.onFilter) ||
                        col.filterDropdown ||
                        (col.filterMode === 'text' && col.onTextFilter)),
                  )
                  const filterActive =
                    hasFilter && isColumnFilterActive(col, mergedFilters[col.key] ?? null)

                  return (
                    <th
                      key={col.key}
                      className={[thClass, filterActive ? 'filter-active' : ''].filter(Boolean).join(' ')}
                      colSpan={effectiveColSpan}
                      rowSpan={rowSpan > 1 ? rowSpan : undefined}
                      style={stickyStyle}
                      onClick={
                        isLeaf
                          ? (e) => {
                              const el = e.target as HTMLElement
                              if (el.closest('.datagrid__filter-trigger')) return
                              if (el.closest('.datagrid__resize-handle')) return
                              handleSort(col, e)
                            }
                          : undefined
                      }
                    >
                      <div className="datagrid__th-inner">
                        <span className="datagrid__th-title">{col.title}</span>
                        {hasFilter && (
                          <button
                            type="button"
                            className={['datagrid__filter-trigger', filterActive ? 'datagrid__filter-trigger--active' : '']
                              .filter(Boolean)
                              .join(' ')}
                            aria-label="필터"
                            aria-pressed={filterActive}
                            onClick={(e) => {
                              e.stopPropagation()
                              setFilterAnchorEl(e.currentTarget)
                              setOpenFilterKey((k) => (k === col.key ? null : col.key))
                            }}
                          >
                            ▾
                          </button>
                        )}
                        {isLeaf && col.sorter && (
                          <SortIcon
                            order={isCurrentSort ? currentOrder : null}
                            tooltip={col.showSorterTooltip}
                          />
                        )}
                      </div>
                      {isLeaf && col.resizable !== false && (
                        <span
                          className="datagrid__resize-handle"
                          onMouseDown={(e) => handleResizeStart(e, col)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </th>
                  )
                })}
                {rowIdx === 0 && hasRowDelete && (
                  <th
                    className="datagrid__th datagrid__th--row-ops"
                    rowSpan={maxDepth > 1 ? maxDepth : undefined}
                    style={
                      {
                        '--th-sticky-top': `${(thTopOffsets[0] ?? 0) + stickyOffset}px`,
                      } as CSSProperties
                    }
                  >
                    {rowOperations?.deleteColumnTitle ?? ''}
                  </th>
                )}
              </tr>
            ))}
            </thead>
          )}

          {/* 바디 */}
          <tbody className="datagrid__tbody">
            {shouldVirtualize && offsetTop > 0 && (
              <tr style={{ height: offsetTop }}>
                <td colSpan={tableBodyColSpan} />
              </tr>
            )}

            {visibleData.length === 0 && !loading && (
              <tr>
                <td className="datagrid__empty" colSpan={tableBodyColSpan}>
                  {locale?.emptyText ?? '데이터가 없습니다'}
                </td>
              </tr>
            )}

            {visibleData.map((pack, relIdx) => {
              const { record, depth, rowKey: rk, hasTreeChildren } = pack
              const absIdx = visibleStartIndex + relIdx
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
              ]
                .filter(Boolean)
                .join(' ')

              const rowExpandable = expandable?.rowExpandable?.(record) !== false
              const isExpanded = expandedKeysSet.has(String(rk))
              const showTreeToggle = Boolean(isTreeMode && hasTreeChildren)
              const showTreeLines = Boolean(expandable?.showTreeLines && isTreeMode)

              const onExpandClick = (e?: ReactMouseEvent) => {
                e?.stopPropagation()
                if (isTreeMode && showTreeToggle) toggleRowExpand(rk, record, isExpanded)
                else if (hasExpandRender && rowExpandable) toggleRowExpand(rk, record, isExpanded)
              }

              const indentPx = (expandable?.indentSize ?? 15) * depth

              return (
                <Fragment key={rk}>
                  <BodyRowTag
                  {...rowExtraProps}
                  className={trClass}
                  onClick={(e) => {
                    setFocusedKey(rk)
                    onFocusedRowChange?.(record, absIdx)
                    if (expandable?.expandRowByClick && rowExpandable && (hasExpandRender || showTreeToggle)) {
                      toggleRowExpand(rk, record, isExpanded)
                    }
                    if (rowSelection?.clickRowToSelect) {
                      const disabled = rowSelection.getCheckboxProps?.(record)?.disabled
                      if (!disabled) handleSelectRow(record, absIdx, !isSelected)
                    }
                    rowExtraProps.onClick?.(e)
                  }}
                >
                  {hasExpandCol && (
                    <td className="datagrid__td datagrid__expand-col">
                      {(hasExpandRender && rowExpandable) || showTreeToggle ? (
                        expandable?.expandIcon ? (
                          expandable.expandIcon({
                            expanded: isExpanded,
                            onExpand: onExpandClick,
                            record,
                          })
                        ) : (
                          <button
                            type="button"
                            className="datagrid__expand-btn"
                            aria-expanded={isExpanded}
                            onClick={onExpandClick}
                          >
                            {isExpanded ? '−' : '+'}
                          </button>
                        )
                      ) : null}
                    </td>
                  )}
                  {rowSelection && (
                    <td className="datagrid__td datagrid__selection-col">
                      <input
                        type={rowSelection.type ?? 'checkbox'}
                        tabIndex={-1}
                        checked={isSelected}
                        disabled={rowSelection.getCheckboxProps?.(record)?.disabled}
                        onChange={(e) => handleSelectRow(record, absIdx, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}

                  {resolvedColumns.map((col, colIdx) => {
                    const cellProps = col.onCell?.(record, absIdx) ?? {}
                    const rawValue = getRecordValue(record, col.dataIndex, col.key)

                    const editableForRow = isCellEditable(col, record, absIdx)
                    // inline 모드: 편집 가능한 셀은 항상 에디터 노출
                    const isEditing =
                      editMode === 'inline' ? editableForRow : editCell?.rowKey === rk && editCell.colKey === col.key

                    const displayNr =
                      !isEditing && col.render
                        ? normalizeCellRenderResult(col.render(rawValue, record, absIdx))
                        : null
                    if (displayNr?.props?.colSpan === 0) return null

                    const isActiveCell = activeCellPos?.rowAbsIdx === absIdx && activeCellPos?.colIdx === colIdx
                    const validateErr = validateErrorMap.get(`${String(rk)}::${col.key}`)
                    const cellKey = `${String(rk)}::${col.key}`
                    const originalVal = originalValuesRef.current.get(cellKey)
                    const isDirty = originalVal !== undefined && String(rawValue ?? '') !== String(originalVal ?? '')

                    const tdClass = [
                      'datagrid__td',
                      col.align ? `align-${col.align}` : '',
                      col.ellipsis ? 'ellipsis' : '',
                      col.fixed ? `fixed-${col.fixed}` : '',
                      isEditing ? 'editing' : '',
                      editableForRow && !isEditing ? 'editable' : '',
                      isActiveCell && !isEditing ? 'active-cell' : '',
                      editableForRow && !isEditing && editMode === 'click' ? 'editable-click' : '',
                      editMode === 'inline' && isEditing ? 'inline-editing' : '',
                      isDirty ? 'dirty' : '',
                      showTreeLines && colIdx === 0 ? 'datagrid__td--tree-lines' : '',
                      // 편집 중인 셀은 오류 표시 제거 (inline 모드는 항상 editing이므로 제외)
                      validateErr && (!isEditing || editMode === 'inline') ? `validate-${validateErr.status}` : '',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    const treeIndentVar = `${expandable?.indentSize ?? 15}px`
                    const cellInner = (
                      <>
                        {isEditing ? (
                          col.renderEditor ? (
                            col.renderEditor(
                              rawValue,
                              record,
                              absIdx,
                              (v) => handleEditCommit(record, rk, col.key, v),
                              // inline 모드에서 onCancel은 에디터를 닫지 않음 (항상 노출)
                              editMode === 'inline' ? () => {} : () => setEditCell(null),
                            )
                          ) : editMode === 'inline' ? (
                            // inline 모드 표준 입력 — handleEditCommit을 통해 validator도 실행
                            <InlineEditInput
                              key={`${rk}-${col.key}`}
                              initialValue={rawValue}
                              originalValue={String(originalValuesRef.current.get(cellKey) ?? rawValue ?? '')}
                              onCommit={(v) => handleEditCommit(record, rk, col.key, v)}
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
                          col.shouldCellUpdate ? (
                            <GridCellInner
                              col={col as ColumnType<Record<string, unknown>>}
                              record={record as Record<string, unknown>}
                              absIdx={absIdx}
                              rawValue={rawValue}
                            />
                          ) : (
                            displayNr?.children
                          )
                        ) : (
                          (rawValue as ReactNode)
                        )}
                      </>
                    )

                    return (
                      <td
                        key={col.key}
                        data-row={absIdx}
                        data-col={colIdx}
                        tabIndex={editMode === 'inline' && isActiveCell ? -1 : undefined}
                        colSpan={displayNr?.props?.colSpan}
                        rowSpan={displayNr?.props?.rowSpan}
                        className={`${tdClass} ${cellProps.className ?? ''}`.trim()}
                        style={{
                          ...cellProps.style,
                          ...(colIdx === 0 && indentPx && !showTreeLines ? { paddingLeft: indentPx } : {}),
                          ...(col.fixed === 'left'
                            ? ({ '--sticky-left': `${col._left ?? 0}px` } as CSSProperties)
                            : {}),
                          ...(col.fixed === 'right'
                            ? ({ '--sticky-right': `${col._right ?? 0}px` } as CSSProperties)
                            : {}),
                        }}
                        onFocus={
                          editMode === 'inline'
                            ? () => {
                                setActiveCellPos((prev) =>
                                  prev?.rowAbsIdx === absIdx && prev?.colIdx === colIdx
                                    ? prev
                                    : { rowAbsIdx: absIdx, colIdx },
                                )
                                setFocusedKey((prev) => (prev === rk ? prev : rk))
                                if (editableForRow) {
                                  setEditCell((prev) =>
                                    prev?.rowKey === rk && prev?.colKey === col.key
                                      ? prev
                                      : { rowKey: rk, colKey: col.key },
                                  )
                                } else {
                                  setEditCell(null)
                                }
                              }
                            : undefined
                        }
                        onClick={
                          editMode === 'click'
                            ? (e) => {
                                e.stopPropagation()
                                setActiveCellPos({ rowAbsIdx: absIdx, colIdx })
                                setFocusedKey(rk)
                                onFocusedRowChange?.(record, absIdx)
                                if (editableForRow) setEditCell({ rowKey: rk, colKey: col.key })
                              }
                            : editMode !== 'inline'
                              ? () => {
                                  setActiveCellPos({ rowAbsIdx: absIdx, colIdx })
                                  setFocusedKey(rk)
                                }
                              : undefined
                        }
                        onDoubleClick={
                          editMode === 'dblclick'
                            ? () => handleCellActivate(rk, col.key, col, record, absIdx, colIdx)
                            : undefined
                        }
                      >
                        {showTreeLines && colIdx === 0 ? (
                          <div
                            className="datagrid__tree-cell-wrap"
                            style={{ ['--grid-tree-indent' as string]: treeIndentVar } as CSSProperties}
                          >
                            {Array.from({ length: depth }, (_, lv) => (
                              <span
                                key={lv}
                                className={
                                  lv === depth - 1
                                    ? 'datagrid__tree-line datagrid__tree-line--end'
                                    : 'datagrid__tree-line'
                                }
                                aria-hidden
                              />
                            ))}
                            <div className="datagrid__tree-cell-main">{cellInner}</div>
                          </div>
                        ) : (
                          cellInner
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
                  {hasRowDelete && (
                    <td
                      className="datagrid__td datagrid__td--row-ops"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <button
                        type="button"
                        className="datagrid__row-delete-btn"
                        title={rowOperations?.deleteLabel ?? '이 행 삭제'}
                        aria-label={rowOperations?.deleteLabel ?? '이 행 삭제'}
                        disabled={rowOperations?.getDeleteButtonProps?.(record)?.disabled}
                        onClick={() => handleRowDeleteClick(rk, record)}
                      >
                        삭제
                      </button>
                    </td>
                  )}
                </BodyRowTag>
                  {hasExpandRender && isExpanded && rowExpandable && expandable?.expandedRowRender && (
                    <tr className="datagrid__tr datagrid__tr--expanded" key={`${rk}-exp`}>
                      <td className="datagrid__td datagrid__expand-cell" colSpan={tableBodyColSpan}>
                        {expandable.expandedRowRender(record, absIdx, indentPx, isExpanded)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}

            {shouldVirtualize && offsetBottom > 0 && (
              <tr style={{ height: offsetBottom }}>
                <td colSpan={tableBodyColSpan} />
              </tr>
            )}
          </tbody>
          {summary && (
            <tfoot
              className={[
                'datagrid__tfoot',
                summaryFixed === 'bottom' ? 'datagrid__tfoot--sticky-bottom' : '',
                summaryFixed === 'top' ? 'datagrid__tfoot--sticky-top' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {summary(pagedData.map((p) => p.record))}
            </tfoot>
          )}
        </TableTag>
      </div>

      {footer && (
        <div className="datagrid__caption datagrid__caption--bottom">{footer(pagedData.map((p) => p.record))}</div>
      )}

      {openFilterColumn &&
        (openFilterColumn.filters?.length ||
          openFilterColumn.filterDropdown ||
          (openFilterColumn.filterMode === 'text' && openFilterColumn.onTextFilter)) &&
        filterAnchorEl && (
          <ColumnFilterDropdownPanel
            column={openFilterColumn as ColumnType<Record<string, unknown>>}
            selectedKeys={[...(mergedFilters[openFilterColumn.key] ?? [])]}
            anchorEl={filterAnchorEl}
            getPopupContainer={resolvePopupContainer}
            onConfirm={(keys) => commitColumnFilter(openFilterColumn.key, keys)}
            onClear={() => clearColumnFilterState(openFilterColumn)}
            onClose={() => {
              setOpenFilterKey(null)
              setFilterAnchorEl(null)
            }}
          />
        )}

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
