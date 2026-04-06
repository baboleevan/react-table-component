import type { CSSProperties, HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

export interface TableSummaryProps {
  fixed?: 'top' | 'bottom'
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

function TableSummaryRoot({ children }: TableSummaryProps) {
  return <>{children}</>
}

export interface TableSummaryRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children?: ReactNode
}

export function TableSummaryRow({ className = '', ...rest }: TableSummaryRowProps) {
  return <tr className={`datagrid__summary-tr ${className}`.trim()} {...rest} />
}

export interface TableSummaryCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  index?: number
  align?: 'left' | 'right' | 'center'
  colSpan?: number
  rowSpan?: number
  children?: ReactNode
}

export function TableSummaryCell(props: TableSummaryCellProps) {
  const { align, className = '', style, index, ...rest } = props
  void index
  const alignClass = align ? `align-${align}` : ''
  return (
    <td className={`datagrid__summary-td ${alignClass} ${className}`.trim()} style={style} {...rest} />
  )
}

/** Ant Design `Table.Summary` 와 유사 — `Row` / `Cell`을 한 객체로 export해 번들/HMR에서도 안정적입니다. */
// eslint-disable-next-line react-refresh/only-export-components -- Row/Cell 복합 API용 단일 네임스페이스
export const TableSummary = Object.assign(TableSummaryRoot, {
  Row: TableSummaryRow,
  Cell: TableSummaryCell,
})

export function TableSummaryHeaderCell(
  props: TableSummaryCellProps & ThHTMLAttributes<HTMLTableCellElement>,
) {
  const { align, className = '', style, index, ...rest } = props
  void index
  const alignClass = align ? `align-${align}` : ''
  return (
    <th className={`datagrid__summary-th ${alignClass} ${className}`.trim()} style={style} {...rest} />
  )
}
