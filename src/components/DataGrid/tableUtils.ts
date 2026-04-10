import type { ReactNode } from 'react'
import type { ColumnType } from '@/components/DataGrid/types'

export type GridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

/** Ant Design Table과 동일한 반응형 브레이크포인트 (min-width, px) */
export const GRID_BREAKPOINT_MIN: Record<GridBreakpoint, number> = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
}

const BP_ORDER: (keyof typeof GRID_BREAKPOINT_MIN)[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs']

export function getCurrentBreakpoint(width: number): GridBreakpoint {
  for (const bp of BP_ORDER) {
    if (width >= GRID_BREAKPOINT_MIN[bp]) return bp
  }
  return 'xs'
}

/** `dataIndex`가 문자열 또는 중첩 경로 배열일 때 값 조회 */
export function getRecordValue<T>(
  record: T,
  dataIndex?: string | (string | number)[],
  key?: string,
): unknown {
  if (dataIndex === undefined || dataIndex === null) {
    const field = key
    if (!field) return undefined
    return (record as Record<string, unknown>)[field]
  }
  if (typeof dataIndex === 'string') {
    return (record as Record<string, unknown>)[dataIndex]
  }
  let cur: unknown = record
  for (const part of dataIndex) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[String(part)]
  }
  return cur
}

export type RenderCellResult = { children: ReactNode; props?: { colSpan?: number; rowSpan?: number } }

/** Ant Design `render` 반환 형태 `{ children, props?: { colSpan, rowSpan } }` — `props` 생략 가능 */
export function normalizeCellRenderResult(result: unknown): RenderCellResult {
  if (
    result !== null &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    !('type' in result) &&
    'children' in result
  ) {
    const r = result as { children: ReactNode; props?: { colSpan?: number; rowSpan?: number } }
    return { children: r.children, props: r.props }
  }
  return { children: result as ReactNode }
}


/** 컬럼이 현재 브레이크포인트에서 표시되는지 (responsive: 해당 구간 이상에서만 표시) */
export function isColumnVisibleAtBreakpoint<T>(col: ColumnType<T>): boolean {
  if (col.hidden) return false
  const r = col.responsive
  if (!r?.length) return true
  const w = typeof window !== 'undefined' ? window.innerWidth : GRID_BREAKPOINT_MIN.xxl
  return r.some((bp) => w >= GRID_BREAKPOINT_MIN[bp])
}

export function filterColumnsTree<T>(cols: ColumnType<T>[]): ColumnType<T>[] {
  const out: ColumnType<T>[] = []
  for (const col of cols) {
    if (col.children?.length) {
      const kids = filterColumnsTree(col.children)
      if (kids.length > 0) out.push({ ...col, children: kids })
      continue
    }
    if (isColumnVisibleAtBreakpoint(col)) out.push(col)
  }
  return out
}

export function getSorterCompare<T>(col: ColumnType<T>): ((a: T, b: T) => number) | null {
  const s = col.sorter
  if (!s || s === true) return null
  if (typeof s === 'function') return s
  if (typeof s === 'object' && 'compare' in s && typeof s.compare === 'function') return s.compare
  return null
}

export function getSorterMultiple<T>(col: ColumnType<T> | undefined): number | undefined {
  if (!col) return undefined
  const s = col.sorter
  if (s && typeof s === 'object' && 'multiple' in s && typeof s.multiple === 'number') return s.multiple
  return undefined
}
