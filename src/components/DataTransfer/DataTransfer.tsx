import { useState, useMemo, useCallback, useRef } from 'react'
import { DataGrid } from '../DataGrid'
import { getRecordValue } from '../DataGrid/tableUtils'
import type { DataTransferProps } from './types'
import './DataTransfer.scss'

// ──────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────
function resolveKey<T>(record: T, rowKey: DataTransferProps<T>['rowKey'], index: number): string | number {
  if (typeof rowKey === 'function') return rowKey(record)
  return ((record as Record<string, unknown>)[rowKey] as string | number) ?? index
}

// ──────────────────────────────────────────────
// DataTransfer
// ──────────────────────────────────────────────
export function DataTransfer<T = Record<string, unknown>>({
  dataSource,
  targetKeys,
  onChange,
  columns,
  rowKey,
  titles = ['소스', '대상'],
  showSearch = false,
  height = 400,
  listStyle,
  className,
  locale,
}: DataTransferProps<T>) {
  // ── 각 패널의 선택 state ────────────────────
  const [leftSelected, setLeftSelected] = useState<(string | number)[]>([])
  const [rightSelected, setRightSelected] = useState<(string | number)[]>([])

  // ── 검색어 ──────────────────────────────────
  const [leftSearch, setLeftSearch] = useState('')
  const [rightSearch, setRightSearch] = useState('')

  // ── 키보드 단축키용 ref ──────────────────────
  const containerRef = useRef<HTMLDivElement>(null)

  // ── targetKeys → Set (O(1) 조회) ────────────
  const targetKeySet = useMemo(() => new Set(targetKeys), [targetKeys])

  // ── 패널별 데이터 분리 + 검색 필터 ─────────
  const leftData = useMemo(() => {
    const base = dataSource.filter((r, i) => !targetKeySet.has(resolveKey(r, rowKey, i)))
    if (!leftSearch.trim()) return base
    const q = leftSearch.toLowerCase()
    return base.filter((r) =>
      columns.some((col) => {
        return String(getRecordValue(r, col.dataIndex, col.key) ?? '')
          .toLowerCase()
          .includes(q)
      }),
    )
  }, [dataSource, targetKeySet, rowKey, leftSearch, columns])

  const rightData = useMemo(() => {
    const base = dataSource.filter((r, i) => targetKeySet.has(resolveKey(r, rowKey, i)))
    if (!rightSearch.trim()) return base
    const q = rightSearch.toLowerCase()
    return base.filter((r) =>
      columns.some((col) => {
        return String(getRecordValue(r, col.dataIndex, col.key) ?? '')
          .toLowerCase()
          .includes(q)
      }),
    )
  }, [dataSource, targetKeySet, rowKey, rightSearch, columns])

  // ── 이동 핸들러 ─────────────────────────────
  const moveToRight = useCallback(() => {
    if (leftSelected.length === 0) return
    const moveKeys = [...leftSelected]
    onChange([...targetKeys, ...moveKeys], 'right', moveKeys)
    setLeftSelected([])
  }, [leftSelected, targetKeys, onChange])

  const moveToLeft = useCallback(() => {
    if (rightSelected.length === 0) return
    const moveKeys = [...rightSelected]
    const moveSet = new Set(moveKeys)
    onChange(
      targetKeys.filter((k) => !moveSet.has(k)),
      'left',
      moveKeys,
    )
    setRightSelected([])
  }, [rightSelected, targetKeys, onChange])

  // ── 키보드 방향키 지원 ───────────────────────
  // → : 왼쪽 선택 항목을 오른쪽으로 이동
  // ← : 오른쪽 선택 항목을 왼쪽으로 이동
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // 입력 필드 내부에서는 방향키를 가로채지 않음
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'ArrowRight' && leftSelected.length > 0) {
        e.preventDefault()
        moveToRight()
      } else if (e.key === 'ArrowLeft' && rightSelected.length > 0) {
        e.preventDefault()
        moveToLeft()
      }
    },
    [leftSelected.length, rightSelected.length, moveToRight, moveToLeft],
  )

  const itemUnit = locale?.itemUnit ?? '개'
  const notFoundContent = locale?.notFoundContent ?? '데이터 없음'
  const searchPlaceholder = locale?.searchPlaceholder ?? '검색...'

  const panelHeight = typeof height === 'number' ? `${height}px` : height

  // ── 패널 렌더 헬퍼 ──────────────────────────
  function renderPanel(
    side: 'left' | 'right',
    title: string,
    data: T[],
    selected: (string | number)[],
    setSelected: (keys: (string | number)[]) => void,
    search: string,
    setSearch: (v: string) => void,
  ) {
    return (
      <div className="datatransfer__panel" style={listStyle}>
        {/* 헤더 */}
        <div className="datatransfer__panel-header">
          <label className="datatransfer__panel-check">
            <input
              type="checkbox"
              checked={data.length > 0 && selected.length === data.length}
              ref={(el) => {
                if (el) el.indeterminate = selected.length > 0 && selected.length < data.length
              }}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelected(data.map((r, i) => resolveKey(r, rowKey, i)))
                } else {
                  setSelected([])
                }
              }}
              disabled={data.length === 0}
            />
          </label>
          <span className="datatransfer__panel-title">{title}</span>
          <span className="datatransfer__panel-count">
            {selected.length > 0 ? `${selected.length}/` : ''}
            {data.length}
            {itemUnit}
          </span>
        </div>

        {/* 검색 */}
        {showSearch && (
          <div className="datatransfer__search">
            <input
              type="text"
              className="datatransfer__search-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* 리스트 */}
        <div className="datatransfer__panel-body" style={{ height: panelHeight }}>
          {data.length === 0 ? (
            <div className="datatransfer__empty">{notFoundContent}</div>
          ) : (
            <DataGrid<T>
              dataSource={data}
              columns={columns}
              rowKey={rowKey}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selected,
                onChange: (keys) => setSelected(keys),
              }}
              pagination={false}
              virtual={data.length > 100}
              size="small"
              onFocusedRowChange={(record, idx) => {
                // 포커스 이동 시 해당 행을 선택 상태로 함께 토글 (선택 없으면 단일 선택)
                const k = resolveKey(record, rowKey, idx)
                if (!selected.includes(k)) {
                  // 포커스만 이동 — 선택 상태는 건드리지 않음 (체크박스 UX 유지)
                  void k
                }
              }}
            />
          )}
        </div>

        {/* 선택 요약 */}
        <div className="datatransfer__panel-footer">
          {selected.length > 0 ? (
            <span className="datatransfer__panel-footer--selected">
              {selected.length}개 선택됨 &nbsp;
              <button className="datatransfer__clear-btn" onClick={() => setSelected([])}>
                선택 해제
              </button>
            </span>
          ) : (
            <span className="datatransfer__panel-footer--empty">
              {side === 'left' ? '→ 키 또는 버튼으로 이동' : '← 키 또는 버튼으로 이동'}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={['datatransfer', className].filter(Boolean).join(' ')}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 왼쪽 패널 */}
      {renderPanel('left', titles[0], leftData, leftSelected, setLeftSelected, leftSearch, setLeftSearch)}

      {/* 중앙 조작 버튼 */}
      <div className="datatransfer__operation">
        <button
          className="datatransfer__op-btn datatransfer__op-btn--right"
          onClick={moveToRight}
          disabled={leftSelected.length === 0}
          title={`선택한 ${leftSelected.length}개 항목을 오른쪽으로 이동 (→)`}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
          </svg>
          {leftSelected.length > 0 && <span className="datatransfer__op-badge">{leftSelected.length}</span>}
        </button>
        <button
          className="datatransfer__op-btn datatransfer__op-btn--left"
          onClick={moveToLeft}
          disabled={rightSelected.length === 0}
          title={`선택한 ${rightSelected.length}개 항목을 왼쪽으로 이동 (←)`}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
          </svg>
          {rightSelected.length > 0 && <span className="datatransfer__op-badge">{rightSelected.length}</span>}
        </button>
      </div>

      {/* 오른쪽 패널 */}
      {renderPanel('right', titles[1], rightData, rightSelected, setRightSelected, rightSearch, setRightSearch)}
    </div>
  )
}
