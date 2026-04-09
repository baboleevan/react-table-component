import type { Key } from 'react'
import type { ColumnType } from './types'
import { getRecordValue, getSorterCompare, getSorterMultiple } from './tableUtils'

/** 단일 행이 현재 컬럼 필터 상태를 모두 통과하는지 */
export function recordMatchesColumnFilters<T>(
  record: T,
  leafColumns: ColumnType<T>[],
  filters: Record<string, Key[] | null | undefined>,
): boolean {
  for (const col of leafColumns) {
    const selected = filters[col.key]
    if (!selected?.length) continue

    if (col.filterMode === 'text' && col.onTextFilter) {
      const q = String(selected[0] ?? '').trim()
      if (!q) continue
      if (!col.onTextFilter(q, record)) return false
      continue
    }

    if (!col.filters?.length || !col.onFilter) continue
    const ok = selected.some((val) => col.onFilter!(val, record))
    if (!ok) return false
  }
  return true
}

export function applyColumnFilters<T>(
  data: T[],
  leafColumns: ColumnType<T>[],
  filters: Record<string, Key[] | null | undefined>,
): T[] {
  return data.filter((record) => recordMatchesColumnFilters(record, leafColumns, filters))
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
  /** 들여쓰기 단계 (0 = 최상위) */
  depth: number
  rowKey: string | number
  /** 트리 토글(▶/▼) 표시 여부 */
  hasTreeChildren?: boolean
}

export function flattenTreeRows<T>(
  list: T[],
  childrenColumnName: string,
  expandedKeys: ReadonlySet<string>,
  getRowKey: (record: T) => string | number,
): FlatTreeRow<T>[] {
  const keyStr = (k: string | number) => String(k)
  const out: FlatTreeRow<T>[] = []
  const walk = (rows: T[], depth: number) => {
    for (const row of rows) {
      const k = getRowKey(row)
      const children = (row as Record<string, unknown>)[childrenColumnName] as T[] | undefined
      const hasKids = Boolean(children?.length)
      out.push({ record: row, depth, rowKey: k, hasTreeChildren: hasKids })
      if (children?.length && expandedKeys.has(keyStr(k))) walk(children, depth + 1)
    }
  }
  walk(list, 0)
  return out
}

/**
 * `depth` 필드만 있는 **전위 순회(부모→자식) 플랫 배열**을 트리로 해석합니다.
 * 다음 행의 depth가 현재보다 정확히 1 크면 직계 자식으로 간주합니다.
 */
export function flattenFlatDepthTreeRows<T>(
  list: T[],
  depthField: string,
  expandedKeys: ReadonlySet<string>,
  getRowKey: (record: T) => string | number,
): FlatTreeRow<T>[] {
  const keyStr = (k: string | number) => String(k)
  const depthOf = (r: T) => {
    const v = (r as Record<string, unknown>)[depthField]
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  const n = list.length
  if (n === 0) return []

  const parents: (number | null)[] = new Array(n).fill(null)
  const stack: number[] = []
  for (let i = 0; i < n; i++) {
    const d = depthOf(list[i])
    while (stack.length > 0 && depthOf(list[stack[stack.length - 1]!]!) >= d) {
      stack.pop()
    }
    parents[i] = stack.length > 0 ? stack[stack.length - 1]! : null
    stack.push(i)
  }

  const hasDirectChild = (i: number) =>
    i + 1 < n && depthOf(list[i + 1]) === depthOf(list[i]) + 1

  const minDepth = Math.min(...list.map(depthOf))
  const out: FlatTreeRow<T>[] = []

  for (let i = 0; i < n; i++) {
    let p = parents[i]
    let hidden = false
    while (p !== null) {
      if (!expandedKeys.has(keyStr(getRowKey(list[p])))) {
        hidden = true
        break
      }
      p = parents[p]
    }
    if (hidden) continue

    const record = list[i]
    out.push({
      record,
      depth: Math.max(0, depthOf(record) - minDepth),
      rowKey: getRowKey(record),
      hasTreeChildren: hasDirectChild(i),
    })
  }

  return out
}
