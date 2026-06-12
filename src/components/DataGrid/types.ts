import type {
  CSSProperties,
  ComponentType,
  HTMLAttributes,
  Key,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  RefObject,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'

// ──────────────────────────────────────────────
// 검증(Validation) 타입
// ──────────────────────────────────────────────

/** 셀 검증 상태 */
export type ValidateStatus = 'success' | 'error' | 'warning' | 'validating'

/** 검증 결과 — null/undefined 반환 시 success로 처리 */
export interface ValidateResult {
  status: ValidateStatus
  message?: string
}

/**
 * 검증 함수 타입 — 동기/비동기 모두 지원
 * @param value      현재 셀 값
 * @param record     전체 행 레코드
 * @param rowKey     행 고유 키
 * @param dataSource 전체 데이터 배열 (교차 컬럼/행 비교 시 활용)
 * @returns ValidateResult 또는 null(success)
 */
export type ValidatorFn<T = Record<string, unknown>> = (
  value: unknown,
  record: T,
  rowKey: string | number,
  dataSource: T[],
) => ValidateResult | null | undefined | Promise<ValidateResult | null | undefined>

/** 오류 항목 — getErrors()가 반환하는 구조 */
export interface ValidateError {
  rowKey: string | number
  columnKey: string
  status: ValidateStatus
  message?: string
}

/**
 * DataGrid 명령형 핸들 — gridRef prop으로 전달하여 외부에서 검증 및 데이터 조회를 제어합니다
 *
 * @example
 * const gridRef = useRef<DataGridHandle<MyRow>>(null)
 * <DataGrid<MyRow> gridRef={gridRef} ... />
 * await gridRef.current?.validate()
 * const row = gridRef.current?.getRow('row-1')
 */
export interface DataGridHandle<T = Record<string, unknown>> {
  /** dataSource 전체에 대해 validator 실행. 에러가 없으면 true 반환 */
  validate: () => Promise<boolean>
  /** 현재 오류 목록 반환 */
  getErrors: () => ValidateError[]
  /** 모든 오류 초기화 */
  clearErrors: () => void
  /**
   * 특정 행 레코드 반환.
   * @param rowKey rowKey prop으로 지정한 키 값
   */
  getRow: (rowKey: string | number) => T | undefined
  /**
   * 특정 셀 값 반환.
   * @param rowKey    행 고유 키
   * @param columnKey 컬럼 key 문자열
   */
  getCell: (rowKey: string | number, columnKey: string) => unknown
  /** dataSource 전체 배열 반환 */
  getData: () => T[]
  /** 특정 셀 스타일 설정/갱신 */
  setCellStyle: (rowKey: string | number, columnKey: string, config: DataGridCellStyleConfig) => void
  /** 특정 행 전체 셀 스타일 설정/갱신 */
  setRowStyle: (rowKey: string | number, config: DataGridCellStyleConfig) => void
  /** 특정 셀 스타일 제거 */
  clearCellStyle: (rowKey: string | number, columnKey: string) => void
  /** 특정 행 전체 스타일 제거 */
  clearRowStyle: (rowKey: string | number) => void
  /** 명령형으로 설정한 모든 스타일 제거 */
  clearAllStyles: () => void
  /** 여러 행·열에 동일 스타일을 한 번에 적용 (columnKeys: '*'면 해당 행의 모든 데이터 컬럼) */
  setRangeStyle: (params: DataGridRangeStyleParams) => void
  /** 직전 명령형 스타일 변경 취소 (최대 50단계) */
  undoStyles: () => void
  /** undoStyles로 되돌린 변경 다시 적용 */
  redoStyles: () => void
  /**
   * 현재 페이지(또는 전체) 데이터에서 rowKey에 해당하는 행으로 세로 스크롤을 맞춥니다.
   * 가상화 모드에서만 스크롤 이동이 의미 있습니다.
   */
  scrollToRowKey: (rowKey: string | number) => void
  /**
   * 현재 그리드 데이터를 클립보드에 TSV로 복사합니다.
   * `scope: 'auto'`일 때: 선택 행 → 활성 셀 행 → 현재 페이지 순으로 결정합니다.
   */
  copyToClipboard: (options?: DataGridCopyOptions) => Promise<void>
  /** 현재 그리드 데이터를 CSV 파일로 내려받습니다 (기본 UTF-8 BOM, Excel 한글 호환). */
  exportAsCsv: (options?: DataGridExportCsvOptions) => void
}

/** `copyToClipboard` / `exportAsCsv` 범위 */
export type DataGridExportScope = 'auto' | 'selected' | 'activeRow' | 'page'

export interface DataGridCopyOptions {
  scope?: DataGridExportScope
}

export interface DataGridExportCsvOptions {
  /** 다운로드 파일명 (기본: export.csv) */
  filename?: string
  /** 필드 구분자 (기본: ,) */
  delimiter?: string
  scope?: DataGridExportScope
  /** false면 UTF-8 BOM 생략 */
  includeBom?: boolean
}

export interface CellStyleResolverParams<T = Record<string, unknown>> {
  record: T
  rowKey: string | number
  rowIndex: number
  column: ColumnType<T>
  columnKey: string
  columnIndex: number
  value: unknown
}

/** 셀 톤 — SCSS 프리셋 + 일관된 대비 (a11y 보조) */
export type DataGridCellTone = 'neutral' | 'success' | 'warning' | 'error' | 'info'

export interface DataGridCellStyleConfig {
  style?: CSSProperties
  className?: string
  /** 토큰형 톤 클래스 (`datagrid__td--tone-*`). `neutral`은 클래스를 붙이지 않습니다. */
  tone?: DataGridCellTone
}

/** `gridRef.setRangeStyle` 인자 */
export interface DataGridRangeStyleParams {
  rowKeys: (string | number)[]
  /** 데이터 컬럼 key 배열. '*'이면 현재 그리드의 모든 리프 컬럼에 적용 */
  columnKeys: string[] | '*'
  config: DataGridCellStyleConfig
}

export interface DataGridRowStyleConfig {
  row?: DataGridCellStyleConfig
  cells?: Record<string, DataGridCellStyleConfig | undefined>
}

export type DataGridRowStyleMap = Record<string, DataGridRowStyleConfig | undefined>

// ──────────────────────────────────────────────
// 컬럼 정의 (Ant Design Table과 유사한 인터페이스)
// ──────────────────────────────────────────────
export type SortOrder = 'ascend' | 'descend' | null

/** 필터 드롭다운 옵션 */
export interface ColumnFilterItem {
  text: ReactNode
  value: Key
  children?: ColumnFilterItem[]
}

export type ColumnFilterMode = 'menu' | 'tree' | 'text'

/** 컬럼 정렬기 — 함수 또는 `{ compare, multiple }` (multiple: 우선순위, 숫자가 작을수록 먼저 적용) */
export type ColumnSorter<T> =
  | boolean
  | ((a: T, b: T) => number)
  | { compare?: (a: T, b: T) => number; multiple?: number }

/** Ant Design `render` 반환 — 셀 병합용 객체 형태 */
export type ColumnRenderValue = ReactNode | RenderCellObject

export interface RenderCellObject {
  children: ReactNode
  props?: { colSpan?: number; rowSpan?: number }
}

export interface ColumnType<T = Record<string, unknown>> {
  /** 고유 키; React key 및 데이터 매핑에 사용 */
  key: string
  /** 헤더에 표시할 타이틀 */
  title?: ReactNode
  /** 데이터 레코드의 필드명 또는 중첩 경로 (기본값: key) */
  dataIndex?: string | (string | number)[]
  /** 컬럼 픽셀 너비 */
  width?: number | string
  /** 최소 픽셀 너비 */
  minWidth?: number
  /** 컬럼 정렬 */
  align?: 'left' | 'center' | 'right'
  /** 고정 컬럼 위치 */
  fixed?: 'left' | 'right'
  /** 커스텀 셀 렌더러 — (value, record, rowIndex)를 받습니다 */
  render?: (value: unknown, record: T, index: number) => ColumnRenderValue
  /** 헤더 셀 인라인 스타일 */
  onHeaderCell?: (column: ColumnType<T>) => { style?: CSSProperties; className?: string }
  /**
   * 바디 셀 인라인 스타일.
   * `components.body.cell` 사용 시 추가 필드(`record`, `rowIndex` 등)를 반환하면
   * 커스텀 셀 컴포넌트의 props로 그대로 전달됩니다.
   */
  onCell?: (record: T, index: number) => { style?: CSSProperties; className?: string } & Record<string, unknown>
  /** 정렬 가능한 컬럼 */
  sorter?: ColumnSorter<T>
  /** 제어 정렬 순서 */
  sortOrder?: SortOrder
  /** 비제어 초기 정렬 */
  defaultSortOrder?: SortOrder
  /** 정렬 아이콘에 title(툴팁) 표시 — `true`면 기본 문구 */
  showSorterTooltip?: boolean | { title?: ReactNode }
  /** 필터 옵션 */
  filters?: ColumnFilterItem[]
  /** 필터 함수 — 선택된 value마다 행이 하나라도 통과하면 표시(OR) */
  onFilter?: (value: Key, record: T) => boolean
  /** 제어 필터 값 */
  filteredValue?: Key[] | null
  /** 초기 필터 값 */
  defaultFilteredValue?: Key[] | null
  /** 커스텀 필터 패널 */
  filterDropdown?: (props: ColumnFilterDropdownProps<T>) => ReactNode
  /** 필터 UI 모드 — `text`는 `filters` 없이 입력창만으로 검색 필터 */
  filterMode?: ColumnFilterMode
  /**
   * `filterMode: 'text'`일 때 사용합니다. `filters`/`onFilter` 없이 검색 문자열로 행을 통과시킵니다.
   * `filteredValue`/`defaultFilteredValue`의 첫 번째 항목이 검색어로 저장됩니다.
   */
  onTextFilter?: (searchText: string, record: T) => boolean
  /** `filterMode: 'text'` 전용 입력 placeholder */
  filterPlaceholder?: string
  /** 필터 목록 내 검색 */
  filterSearch?: boolean
  /** 다중 필터 선택 (기본 true) */
  filterMultiple?: boolean
  /** 리셋 시 `defaultFilteredValue`로 되돌림 */
  filterResetToDefaultFilteredValue?: boolean
  /** 컬럼 숨김 */
  hidden?: boolean
  /** 이 브레이크포인트 이상에서만 표시 (min-width 기준, 복수 지정 시 하나라도 만족하면 표시) */
  responsive?: ('xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs')[]
  /** 헤더 셀 colSpan (리프 컬럼) */
  colSpan?: number
  /** 셀 리렌더 생략 — false면 이전과 동일한 출력으로 간주 */
  shouldCellUpdate?: (record: T, prevRecord: T) => boolean
  /** 그룹 헤더 자식 컬럼 */
  children?: ColumnType<T>[]
  /** 최대 픽셀 너비 (리사이즈 상한) */
  maxWidth?: number
  /** 컬럼 리사이즈 가능 여부 */
  resizable?: boolean
  /** 말줄임표 오버플로우 */
  ellipsis?: boolean
  /** 편집 가능한 컬럼 */
  editable?: boolean
  /**
   * 행 단위 편집 가능 조건.
   * `editable: true`인 컬럼에서만 평가되며, false를 반환하면 해당 행 셀은 읽기 전용으로 렌더됩니다.
   */
  editableWhen?: (record: T, rowIndex: number) => boolean
  /**
   * 커스텀 에디터 렌더러.
   * 기본 텍스트 입력 대신 임의의 입력 컴포넌트
   * (Select, Checkbox, Radio, DatePicker 등)를 렌더링할 때 사용합니다.
   *
   * @param originalValue 편집 시작 시 원본 값
   * @param value     현재 셀 값
   * @param record    전체 행 레코드
   * @param rowIndex  절대 행 인덱스
   * @param onCommit  새 값을 전달하여 커밋하고 에디터를 닫습니다
   * @param onCancel  편집을 취소하고 에디터를 닫습니다
   */
  renderEditor?: (
    originalValue: unknown,
    value: unknown,
    record: T,
    rowIndex: number,
    onCommit: (newValue: unknown) => void,
    onCancel: () => void,
  ) => ReactNode
  /**
   * 셀 값 검증 함수. 동기·비동기 모두 지원합니다.
   * null/undefined를 반환하면 success로 처리됩니다.
   */
  validator?: ValidatorFn<T>
  /**
   * 검증 실행 시점.
   * - 'onBlur' (기본값): 편집 완료(blur/commit) 시 자동 실행
   * - 'manual': gridRef.current.validate() 호출 시에만 실행
   */
  validateTrigger?: 'onBlur' | 'manual'
}

/** 외부 입력용 컬럼 타입 (`key`는 생략 가능; 내부에서 자동 생성) */
export type ColumnInputType<T = Record<string, unknown>> = Omit<ColumnType<T>, 'key' | 'children'> & {
  key?: string
  children?: ColumnInputType<T>[]
}

/** `filterDropdown` 렌더 prop 인자 */
export interface ColumnFilterDropdownProps<T = Record<string, unknown>> {
  prefixCls?: string
  setSelectedKeys: (keys: Key[]) => void
  selectedKeys: Key[]
  confirm: (options?: { closeDropdown?: boolean }) => void
  clearFilters?: (options?: { closeDropdown?: boolean; confirm?: boolean }) => void
  visible: boolean
  column: ColumnType<T>
}

// ──────────────────────────────────────────────
// 행 추가 / 삭제 (dataSource는 부모가 제어 — 콜백으로 반영)
// ──────────────────────────────────────────────
export interface RowOperationsConfig<T = Record<string, unknown>> {
  /**
   * 테이블 상단에 행 추가 버튼 표시.
   * `onAdd`가 함께 전달될 때만 버튼이 렌더됩니다.
   */
  showAdd?: boolean
  /**
   * 행 추가 클릭 시 호출 — 부모가 `dataSource`에 새 레코드를 넣습니다.
   * (고유 `rowKey` 필드는 부모에서 부여하는 것이 안전합니다.)
   */
  onAdd?: () => void
  /**
   * 각 데이터 행 오른쪽에 삭제 버튼 컬럼 표시.
   * `onDelete`가 함께 전달될 때만 컬럼이 렌더됩니다.
   */
  showDelete?: boolean
  /**
   * 해당 행의 삭제 버튼 클릭 시 호출 — 부모가 `dataSource`에서 레코드를 제거합니다.
   */
  onDelete?: (rowKey: string | number, record: T) => void
  /** 행별 삭제 버튼 비활성화 등 */
  getDeleteButtonProps?: (record: T) => { disabled?: boolean }
  /** 상단 추가 버튼 레이블 */
  addLabel?: string
  /** 삭제 버튼 `title` / `aria-label` (기본: "이 행 삭제") */
  deleteLabel?: string
  /** 삭제 컬럼 헤더 (기본: 빈 칸) */
  deleteColumnTitle?: ReactNode
  /**
   * `rowSelection`과 함께 사용 — 툴바에「선택 삭제」버튼 표시.
   * `onDeleteSelected`·`rowSelection`이 함께 있을 때만 렌더됩니다.
   */
  showDeleteSelected?: boolean
  /**
   * 선택 삭제 클릭 시 호출 — 부모가 `dataSource`에서 해당 행들을 제거하고
   * `selectedRowKeys`를 갱신합니다(보통 `onChange([], [])` 또는 남은 키만 전달).
   */
  onDeleteSelected?: (selectedRowKeys: (string | number)[], selectedRows: T[]) => void
  /** 선택 삭제 버튼 레이블 (기본: "선택 삭제") */
  deleteSelectedLabel?: string
  /**
   * 선택 삭제 버튼 `disabled` 오버라이드.
   * 미지정 시 선택된 행이 없으면 비활성화됩니다.
   */
  getDeleteSelectedButtonProps?: () => { disabled?: boolean }
}

// ──────────────────────────────────────────────
// 행 선택
// ──────────────────────────────────────────────
export interface RowSelectionCheckboxProps {
  /** true이면 해당 행의 체크박스/라디오를 비활성화하고 선택할 수 없습니다 */
  disabled?: boolean
}

export interface RowSelectionConfig<T = Record<string, unknown>> {
  type?: 'checkbox' | 'radio'
  selectedRowKeys?: (string | number)[]
  onChange?: (selectedRowKeys: (string | number)[], selectedRows: T[]) => void
  /**
   * 행별 체크박스/라디오 속성. `disabled: true`이면 선택 불가(전체 선택·행 클릭 선택에도 제외).
   *
   * @example
   * getCheckboxProps: (record) => ({ disabled: record.status === '휴직' })
   */
  getCheckboxProps?: (record: T) => RowSelectionCheckboxProps
  onSelect?: (record: T, selected: boolean, selectedRows: T[]) => void
  onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void
  /**
   * 행 전체를 클릭했을 때 체크박스/라디오 선택을 토글합니다.
   * true로 설정하면 체크박스/라디오 셀 뿐 아니라 행 어디를 클릭해도 선택이 바뀝니다.
   * @default false
   */
  clickRowToSelect?: boolean
  /**
   * 선택 열 고정. `'left'`이면 가로 스크롤 시 확장 열 다음에 선택 열이 고정됩니다.
   * `fixed: 'left'` 데이터 컬럼의 sticky 오프셋에 선택 열 너비가 자동 반영됩니다.
   */
  fixed?: 'left'
}

// ──────────────────────────────────────────────
// 페이지네이션
// ──────────────────────────────────────────────
export interface PaginationConfig {
  current?: number
  pageSize?: number
  total?: number
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  pageSizeOptions?: number[]
  /** 페이지 버튼 최대 표시 개수 (기본값: 5) */
  pageButtonCount?: number
  onChange?: (page: number, pageSize: number) => void
  showTotal?: (total: number, range: [number, number]) => ReactNode
}

// ──────────────────────────────────────────────
// 스크롤
// ──────────────────────────────────────────────
export interface ScrollConfig {
  x?: number | string | true
  y?: number | string
}

// ──────────────────────────────────────────────
// 정렬 상태
// ──────────────────────────────────────────────
export interface SorterResult<T> {
  column?: ColumnType<T>
  columnKey?: string
  order?: SortOrder
  field?: string
}

// ──────────────────────────────────────────────
// 변경 정보 (AntD onChange 콜백과 유사한 구조)
// ──────────────────────────────────────────────
export interface TableCurrentDataSource<T> {
  currentDataSource: T[]
  action: 'paginate' | 'sort' | 'filter' | 'expand'
}

/** Ant Design Table과 동일한 `onChange` 두 번째 인자 */
export type TableFilters = Record<string, Key[] | null>

export interface ExpandableConfig<T = Record<string, unknown>> {
  expandedRowRender?: (record: T, index: number, indent: number, expanded: boolean) => ReactNode
  rowExpandable?: (record: T) => boolean
  expandedRowKeys?: (string | number)[]
  defaultExpandedRowKeys?: (string | number)[]
  onExpand?: (expanded: boolean, record: T) => void
  onExpandedRowsChange?: (keys: (string | number)[]) => void
  expandIcon?: (props: { expanded: boolean; onExpand: (e?: ReactMouseEvent) => void; record: T }) => ReactNode
  /** 행 클릭 시 확장 토글 (`rowSelection.clickRowToSelect`와 함께 쓰면 이벤트 순서에 유의) */
  expandRowByClick?: boolean
  /** 트리 들여쓰기 (px) */
  indentSize?: number
  /** 트리 자식 필드명 — 중첩 `children` 배열 기반 트리 */
  childrenColumnName?: string
  /**
   * 플랫 `dataSource` + `depth` 필드로 트리 표현 (전위 순회: 부모 다음에 자식 행이 옴).
   * 지정 시 `childrenColumnName` 없이도 트리 모드가 됩니다.
   */
  treeDataFromFlatList?: {
    /** 깊이 필드명 (기본 `depth`). 1=루트, 2=자식… 권장 */
    depthField?: string
  }
  /** true면 첫 데이터 컬럼에 depth 단계만큼 세로 점선(트리 가이드)을 그립니다. */
  showTreeLines?: boolean
  /** 확장/트리 토글 컬럼을 좌측에 고정합니다. */
  fixed?: 'left'
}

export interface TableComponents {
  table?: ComponentType<HTMLAttributes<HTMLTableElement>>
  header?: {
    wrapper?: ComponentType<HTMLAttributes<HTMLTableSectionElement>>
    row?: ComponentType<HTMLAttributes<HTMLTableRowElement>>
    cell?: ComponentType<ThHTMLAttributes<HTMLTableCellElement>>
  }
  body?: {
    wrapper?: ComponentType<HTMLAttributes<HTMLTableSectionElement>>
    row?: ComponentType<HTMLAttributes<HTMLTableRowElement>>
    /**
     * 바디 셀 교체 — `onCell`이 반환한 추가 props도 함께 전달됩니다.
     * 커스텀 셀의 추가 prop(`record`, `rowIndex` 등)은 **옵셔널**로 선언하세요.
     * 예: `interface MyCellProps extends TdHTMLAttributes<HTMLTableCellElement> { record?: Row }`
     */
    cell?: ComponentType<TdHTMLAttributes<HTMLTableCellElement>>
  }
}

export interface StickyConfig {
  offsetHeader?: number
  offsetScroll?: number
  getContainer?: () => HTMLElement
}

// ──────────────────────────────────────────────
// DataGrid 메인 props
// ──────────────────────────────────────────────
export interface DataGridProps<T = Record<string, unknown>> {
  /** 데이터 레코드 배열 */
  dataSource?: T[]
  /**
   * dirty 기준값(원본 스냅샷) 초기화 트리거.
   * 값이 변경되면 내부 dirty baseline을 현재 `dataSource` 기준으로 재설정합니다.
   * (예: API 재조회 완료 시 `setDirtyResetKey((k) => k + 1)`)
   */
  dirtyResetKey?: string | number
  /**
   * 스크롤 위치(상/좌) 초기화 트리거.
   * 값이 변경되면 스크롤 컨테이너를 좌상단(0,0)으로 이동합니다.
   * (예: 화면 재진입/탭 전환/재조회 완료 시 `setScrollResetKey((k) => k + 1)`)
   */
  scrollResetKey?: string | number
  /** 컬럼 정의 배열 */
  columns?: ColumnInputType<T>[]
  /**
   * 행 키 필드명 또는 getter 함수.
   * 미지정 시 내부에서 `id`를 우선 사용하고, 없으면 자동 생성 키로 fallback 합니다.
   */
  rowKey?: string | ((record: T) => string | number)
  /** 로딩 상태 */
  loading?: boolean
  /** 페이지네이션 설정; false로 비활성화 */
  pagination?: PaginationConfig | false
  /** 행 선택 설정 */
  rowSelection?: RowSelectionConfig<T>
  /** 행 추가(툴바) / 행별 삭제 컬럼 — `dataSource` 변경은 부모에서 처리 */
  rowOperations?: RowOperationsConfig<T>
  /** 스크롤 설정 */
  scroll?: ScrollConfig
  /** 셀 테두리 표시 */
  bordered?: boolean
  /**
   * true이면 홀수 인덱스 행(0-based: 1,3,5…)에 `--grid-row-stripe-bg` 배경을 적용합니다.
   * 색은 `.datagrid`에 CSS 변수로 덮어쓸 수 있습니다.
   */
  striped?: boolean
  /** 테이블 크기 */
  size?: 'small' | 'middle' | 'large'
  /** 추가 className */
  className?: string
  /** 루트 요소 인라인 스타일 */
  style?: CSSProperties
  /** 로케일 오버라이드 */
  locale?: { emptyText?: ReactNode }
  /** 행 클래스명 */
  rowClassName?: string | ((record: T, index: number) => string)
  /** 행 이벤트 핸들러 */
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>
  /**
   * 외부에서 특정 셀 스타일을 동적으로 제어합니다.
   * row/column/value 정보를 기반으로 className 또는 style을 반환할 수 있습니다.
   *
   * **인라인 `style` 병합 우선순위(낮음 → 높음)**
   * `cellStyleResolver` → 컬럼 `onCell` → `rowStyleMap.row` → `rowStyleMap.cells[col]` →
   * `gridRef` 명령형(`setCellStyle` / `setRowStyle` / `setRangeStyle`)
   * 레이아웃용 값(들여쓰기, sticky 변수)은 그 위에 다시 덮어씁니다.
   */
  cellStyleResolver?: (params: CellStyleResolverParams<T>) => DataGridCellStyleConfig | undefined
  /**
   * rowKey 기반 셀/행 스타일 오버라이드(선언형).
   * 병합 우선순위는 `cellStyleResolver` 설명과 동일하며, 명령형 API보다는 낮습니다.
   */
  rowStyleMap?: DataGridRowStyleMap
  /**
   * 인쇄 시 배경·글자색이 브라우저에서 생략되지 않도록 `print-color-adjust: exact`를 켭니다.
   * @default false
   */
  printBackground?: boolean
  /**
   * 지정 시 컬럼 리사이즈 너비를 `localStorage`에 저장·복원합니다.
   * 키: `datagrid:colwidths:${persistColumnWidthsKey}`
   */
  persistColumnWidthsKey?: string
  /** 테이블 상단 제목 */
  title?: (currentPageData: T[]) => ReactNode
  /** 테이블 하단 푸터 */
  footer?: (currentPageData: T[]) => ReactNode
  /** 헤더 행 표시 (기본 true) */
  showHeader?: boolean
  /** 헤더 `<tr>`에 붙일 props (그룹 헤더면 행 인덱스 0..n-1) */
  onHeaderRow?: (columns: ColumnType<T>[], rowIndex: number) => React.HTMLAttributes<HTMLTableRowElement>
  /** 행 확장 / 트리 */
  expandable?: ExpandableConfig<T>
  /** 합계 행 — `TableSummary.Row` / `Cell` 사용 */
  summary?: (pageData: T[]) => ReactNode
  /** 합계 `tfoot` sticky 위치 */
  summaryFixed?: 'top' | 'bottom'
  /** 테이블·헤더·바디 요소 교체 */
  components?: TableComponents
  /** CSS `table-layout` */
  tableLayout?: 'auto' | 'fixed'
  /** 필터 드롭다운 등 포털 부모 (기본: document.body) */
  getPopupContainer?: () => HTMLElement
  /** 헤더 sticky 보조 — `offsetHeader`는 기존 sticky th에 `--th-sticky-top` 보정으로 반영 */
  sticky?: boolean | StickyConfig
  /**
   * true면 정렬은 서버(또는 상위)에서만 적용합니다.
   * - `dataSource` 순서를 그대로 표시합니다(클라이언트 `applyMultiSort` 비활성).
   * - 헤더 정렬 표시는 컬럼의 `sortOrder`(`ascend` | `descend`)로 제어합니다.
   * - `onChange`의 `sorter`를 받아 API 호출 후, 정렬된 데이터와 컬럼 `sortOrder`를 갱신하세요.
   */
  sortRemote?: boolean
  /**
   * 정렬·필터·페이지 변경 콜백 (Ant Design Table 순서: pagination, filters, sorter, extra)
   */
  onChange?: (
    pagination: PaginationConfig,
    filters: TableFilters,
    sorter: SorterResult<T> | SorterResult<T>[],
    extra: TableCurrentDataSource<T>,
  ) => void
  /** 셀 편집 커밋 콜백 */
  onCellEdit?: (rowKey: string | number, columnKey: string, newValue: unknown, record: T) => void
  /**
   * 포커스된 행이 변경될 때 호출됩니다.
   * 클릭과 키보드(↑↓) 이동 모두에서 발생합니다.
   *
   * @example
   * const [focusedRow, setFocusedRow] = useState<MyRow | null>(null)
   * <DataGrid onFocusedRowChange={(record) => setFocusedRow(record)} />
   */
  onFocusedRowChange?: (record: T, index: number) => void
  /**
   * 편집 가능한 컬럼의 편집 활성화 모드.
   * - 'dblclick' (기본값): 더블클릭으로 편집 진입
   * - 'click': 단일 클릭으로 즉시 편집 진입
   * - 'inline': 에디터(input/select/radio 등)가 항상 노출된 폼 형태
   */
  editMode?: 'dblclick' | 'click' | 'inline'
  /** 대용량 데이터셋용 가상화 행 높이 (px) */
  rowHeight?: number
  /** 행 가상화 활성화 (dataSource.length > 100 시 자동 활성화) */
  virtual?: boolean
  /** 내부 스크롤 컨테이너의 스크롤 이벤트 (무한 스크롤에 유용) */
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  /**
   * DataGrid 명령형 핸들 — validate / getErrors / clearErrors 메서드에 접근합니다.
   * @example
   * const gridRef = useRef<DataGridHandle>(null)
   * <DataGrid gridRef={gridRef} />
   * await gridRef.current?.validate()
   */
  gridRef?: RefObject<DataGridHandle<T>>
  /** 검증 상태가 변경될 때 호출 (오류 목록 전달) */
  onValidateChange?: (errors: ValidateError[]) => void
}

// ──────────────────────────────────────────────
// 내부 타입
// ──────────────────────────────────────────────
export interface InternalColumnType<T> extends ColumnType<T> {
  _left?: number
  _right?: number
  _colSpan?: number
  _rowSpan?: number
}
