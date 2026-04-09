import { useState, useEffect, useRef, useMemo, type Key, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ColumnFilterItem, ColumnType } from './types'

function filterItemsBySearch(items: ColumnFilterItem[], q: string): ColumnFilterItem[] {
  if (!q.trim()) return items
  const lower = q.toLowerCase()
  const walk = (list: ColumnFilterItem[]): ColumnFilterItem[] => {
    const res: ColumnFilterItem[] = []
    for (const it of list) {
      const textStr = typeof it.text === 'string' ? it.text : ''
      const match = textStr.toLowerCase().includes(lower)
      const kids = it.children ? walk(it.children) : undefined
      if (match || (kids && kids.length)) res.push({ ...it, children: kids })
    }
    return res
  }
  return walk(items)
}

export interface ColumnFilterDropdownPanelProps<T> {
  column: ColumnType<T>
  selectedKeys: Key[]
  onConfirm: (keys: Key[]) => void
  /** `defaultFilteredValue` 또는 빈 배열로 부모 상태 초기화 */
  onClear: () => void
  onClose: () => void
  getPopupContainer: () => HTMLElement
  /** 필터 버튼 DOM (위치 계산용) */
  anchorEl: HTMLElement | null
}

export function ColumnFilterDropdownPanel<T>({
  column,
  selectedKeys,
  onConfirm,
  onClear,
  onClose,
  getPopupContainer,
  anchorEl,
}: ColumnFilterDropdownPanelProps<T>) {
  const [local, setLocal] = useState<Key[]>(selectedKeys)
  const [search, setSearch] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocal(selectedKeys)
  }, [selectedKeys])

  const items = useMemo(() => {
    const base = column.filters ?? []
    return column.filterSearch ? filterItemsBySearch(base, search) : base
  }, [column.filters, column.filterSearch, search])

  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!anchorEl) return
    const r = anchorEl.getBoundingClientRect()
    const root = getPopupContainer()
    const rr = root.getBoundingClientRect()
    setPos({ top: r.bottom - rr.top + root.scrollTop + 4, left: r.left - rr.left + root.scrollLeft })
  }, [anchorEl, getPopupContainer])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const p = panelRef.current
      if (p?.contains(e.target as Node) || anchorEl?.contains(e.target as Node)) return
      onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose, anchorEl])

  const multiple = column.filterMultiple !== false
  const mode = column.filterMode ?? 'menu'

  const toggle = (v: Key) => {
    if (multiple) {
      setLocal((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
    } else {
      setLocal((prev) => (prev.includes(v) ? [] : [v]))
    }
  }

  const renderTree = (nodes: ColumnFilterItem[], depth = 0): ReactNode => {
    return (
      <ul className={`datagrid-filter-tree datagrid-filter-tree--depth-${depth}`}>
        {nodes.map((node) => (
          <li key={String(node.value)}>
            <label className="datagrid-filter-tree__item">
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={multiple ? undefined : `flt-${column.key}`}
                checked={local.includes(node.value)}
                onChange={() => toggle(node.value)}
              />
              <span>{node.text}</span>
            </label>
            {node.children?.length ? renderTree(node.children, depth + 1) : null}
          </li>
        ))}
      </ul>
    )
  }

  const textValue = String(local[0] ?? '')

  const confirmTextFilter = () => {
    const trimmed = textValue.trim()
    onConfirm(trimmed ? [trimmed] : [])
    onClose()
  }

  const dropdownCustom = column.filterDropdown?.({
    column,
    selectedKeys: local,
    setSelectedKeys: setLocal,
    confirm: () => {
      onConfirm(local)
      onClose()
    },
    clearFilters: () => {
      onClear()
      onClose()
    },
    visible: true,
  })

  const content =
    dropdownCustom ??
    (column.filterMode === 'text' ? (
      <div className="datagrid-filter-panel datagrid-filter-panel--text">
        <input
          className="datagrid-filter-search"
          placeholder={column.filterPlaceholder ?? '검색'}
          value={textValue}
          onChange={(e) => setLocal(e.target.value ? [e.target.value] : [])}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              confirmTextFilter()
            }
          }}
        />
        <div className="datagrid-filter-actions">
          <button type="button" className="datagrid-filter-btn" onClick={() => onClose()}>
            닫기
          </button>
          <button type="button" className="datagrid-filter-btn" onClick={() => onClear()}>
            초기화
          </button>
          <button type="button" className="datagrid-filter-btn datagrid-filter-btn--primary" onClick={confirmTextFilter}>
            확인
          </button>
        </div>
      </div>
    ) : (
      <div className="datagrid-filter-panel">
        {column.filterSearch && (
          <input
            className="datagrid-filter-search"
            placeholder="검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
        {mode === 'tree' ? (
          renderTree(items)
        ) : (
          <ul className="datagrid-filter-menu">
            {items.map((f) => (
              <li key={String(f.value)}>
                <label className="datagrid-filter-menu__item">
                  <input
                    type={multiple ? 'checkbox' : 'radio'}
                    name={multiple ? undefined : `flt-${column.key}`}
                    checked={local.includes(f.value)}
                    onChange={() => toggle(f.value)}
                  />
                  <span>{f.text}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="datagrid-filter-actions">
          <button type="button" className="datagrid-filter-btn" onClick={() => onClose()}>
            닫기
          </button>
          <button type="button" className="datagrid-filter-btn" onClick={() => onClear()}>
            초기화
          </button>
          <button
            type="button"
            className="datagrid-filter-btn datagrid-filter-btn--primary"
            onClick={() => {
              onConfirm(local)
              onClose()
            }}
          >
            확인
          </button>
        </div>
      </div>
    ))

  return createPortal(
    <div
      ref={panelRef}
      className="datagrid-filter-dropdown"
      style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 1050 }}
      role="dialog"
      aria-label={`${column.key} 필터`}
    >
      {content}
    </div>,
    getPopupContainer(),
  )
}

