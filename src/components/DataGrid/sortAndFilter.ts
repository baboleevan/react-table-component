import type { Key } from 'react'
import type { ColumnType } from './types'
import { getRecordValue, getSorterCompare, getSorterMultiple } from './tableUtils'

export function applyColumnFilters<T>(
  data: T[],
  leafColumns: ColumnType<T>[],
  filters: Record<string, Key[] | null | undefined>,
): T[] {
  return data.filter((record) => {
    for (const col of leafColumns) {
      const selected = filters[col.key]
      if (!selected?.length || !col.filters?.length || !col.onFilter) continue
      const ok = selected.some((val) => col.onFilter!(val, record))
      if (!ok) return false
    }
    return true
  })
}

export function applyMultiSort<T>(
  data: T[],
  sortStates: { columnKey: string; order: 'ascend' | 'descend' }[],
  leafColumns: ColumnType<T>[],
): T[] {
  if (sortStates.length === 0) return data
  const orderedStates = [...sortStates].sort((a, b) => {
    const ca = leafColumns.find((c) => c.key === a.columnKey)
    const cb = leafColumns.find((c) => c.key === b.columnKey)
    return (getSorterMultiple(ca) ?? 100) - (getSorterMultiple(cb) ?? 100)
  })
  return [...data].sort((a, b) => {
    for (const s of orderedStates) {
      const col = leafColumns.find((c) => c.key === s.columnKey)
      if (!col?.sorter) continue
      let cmp = 0
      if (col.sorter === true) {
        const va = getRecordValue(a, col.dataIndex, col.key)
        const vb = getRecordValue(b, col.dataIndex, col.key)
        if (va === vb) cmp = 0
        else if (va == null) cmp = 1
        else if (vb == null) cmp = -1
        else cmp = va < vb ? -1 : 1
      } else {
        const fn = getSorterCompare(col)
        if (!fn) continue
        cmp = fn(a, b)
      }
      if (cmp !== 0) return s.order === 'ascend' ? cmp : -cmp
    }
    return 0
  })
}

export interface FlatTreeRow<T> {
  record: T
  depth: number
  rowKey: string | number
}

export function flattenTreeRows<T>(
  list: T[],
  childrenColumnName: string,
  expandedKeys: Set<string | number>,
  getRowKey: (record: T) => string | number,
): FlatTreeRow<T>[] {
  const out: FlatTreeRow<T>[] = []
  const walk = (rows: T[], depth: number) => {
    for (const row of rows) {
      const k = getRowKey(row)
      out.push({ record: row, depth, rowKey: k })
      const children = (row as Record<string, unknown>)[childrenColumnName] as T[] | undefined
      if (children?.length && expandedKeys.has(k)) walk(children, depth + 1)
    }
  }
  walk(list, 0)
  return out
}
