import type { CSSProperties, ReactNode, RefObject } from 'react'

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
}

// ──────────────────────────────────────────────
// 컬럼 정의 (Ant Design Table과 유사한 인터페이스)
// ──────────────────────────────────────────────
export type SortOrder = 'ascend' | 'descend' | null

export interface ColumnType<T = Record<string, unknown>> {
  /** 고유 키; React key 및 데이터 매핑에 사용 */
  key: string
  /** 헤더에 표시할 타이틀 */
  title?: ReactNode
  /** 데이터 레코드의 필드명 (기본값: key) */
  dataIndex?: string
  /** 컬럼 픽셀 너비 */
  width?: number | string
  /** 최소 픽셀 너비 */
  minWidth?: number
  /** 컬럼 정렬 */
  align?: 'left' | 'center' | 'right'
  /** 고정 컬럼 위치 */
  fixed?: 'left' | 'right'
  /** 커스텀 셀 렌더러 — (value, record, rowIndex)를 받습니다 */
  render?: (value: unknown, record: T, index: number) => ReactNode
  /** 헤더 셀 인라인 스타일 */
  onHeaderCell?: (column: ColumnType<T>) => { style?: CSSProperties; className?: string }
  /** 바디 셀 인라인 스타일 */
  onCell?: (record: T, index: number) => { style?: CSSProperties; className?: string }
  /** 정렬 가능한 컬럼 */
  sorter?: boolean | ((a: T, b: T) => number)
  /** 제어 정렬 순서 */
  sortOrder?: SortOrder
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
   * 커스텀 에디터 렌더러.
   * 기본 텍스트 입력 대신 임의의 입력 컴포넌트
   * (Select, Checkbox, Radio, DatePicker 등)를 렌더링할 때 사용합니다.
   *
   * @param value     현재 셀 값
   * @param record    전체 행 레코드
   * @param rowIndex  절대 행 인덱스
   * @param onCommit  새 값을 전달하여 커밋하고 에디터를 닫습니다
   * @param onCancel  편집을 취소하고 에디터를 닫습니다
   */
  renderEditor?: (
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
export interface RowSelectionConfig<T = Record<string, unknown>> {
  type?: 'checkbox' | 'radio'
  selectedRowKeys?: (string | number)[]
  onChange?: (selectedRowKeys: (string | number)[], selectedRows: T[]) => void
  getCheckboxProps?: (record: T) => { disabled?: boolean }
  onSelect?: (record: T, selected: boolean, selectedRows: T[]) => void
  onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void
  /**
   * 행 전체를 클릭했을 때 체크박스/라디오 선택을 토글합니다.
   * true로 설정하면 체크박스/라디오 셀 뿐 아니라 행 어디를 클릭해도 선택이 바뀝니다.
   * @default false
   */
  clickRowToSelect?: boolean
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
  action: 'paginate' | 'sort' | 'filter'
}

// ──────────────────────────────────────────────
// DataGrid 메인 props
// ──────────────────────────────────────────────
export interface DataGridProps<T = Record<string, unknown>> {
  /** 데이터 레코드 배열 */
  dataSource?: T[]
  /** 컬럼 정의 배열 */
  columns?: ColumnType<T>[]
  /** 행 키 필드명 또는 getter 함수 */
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
  /** 줄무늬 행 */
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
  /** 정렬/필터/페이지 변경 콜백 */
  onChange?: (pagination: PaginationConfig, sorter: SorterResult<T>, extra: TableCurrentDataSource<T>) => void
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
