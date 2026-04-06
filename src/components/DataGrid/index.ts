export { DataGrid, default } from './DataGrid'
export { TableSummary, TableSummaryRow, TableSummaryCell, TableSummaryHeaderCell } from './TableSummary'
import { TableSummary } from './TableSummary'

/** Ant Design `Table.Summary` 와 유사한 네임스페이스 */
export const Table = {
  Summary: TableSummary,
} as const

export type {
  DataGridProps,
  ColumnType,
  RowOperationsConfig,
  RowSelectionConfig,
  PaginationConfig,
  ScrollConfig,
  SortOrder,
  SorterResult,
  TableCurrentDataSource,
  TableFilters,
  ExpandableConfig,
  TableComponents,
  StickyConfig,
  ColumnSorter,
  ColumnFilterItem,
  ColumnFilterMode,
  ColumnFilterDropdownProps,
  ColumnRenderValue,
  RenderCellObject,
  // 검증 관련
  DataGridHandle,
  ValidateError,
  ValidateResult,
  ValidateStatus,
  ValidatorFn,
} from './types'
