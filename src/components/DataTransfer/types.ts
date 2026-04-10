import type { CSSProperties } from 'react'
import type { ColumnType } from '@/components/DataGrid'

// ──────────────────────────────────────────────
// DataTransfer props
// ──────────────────────────────────────────────
export interface DataTransferProps<T = Record<string, unknown>> {
  /**
   * 전체 데이터 소스.
   * 왼쪽(소스) + 오른쪽(대상) 데이터를 합친 배열입니다.
   */
  dataSource: T[]

  /**
   * 오른쪽(대상) 패널에 위치할 항목의 key 배열 (제어 컴포넌트).
   * targetKeys 에 속하지 않는 나머지는 왼쪽(소스) 패널에 표시됩니다.
   */
  targetKeys: (string | number)[]

  /**
   * 항목이 이동될 때 호출됩니다.
   * @param nextTargetKeys 이동 후의 오른쪽 패널 key 배열
   * @param direction      이동 방향 ('right' | 'left')
   * @param moveKeys       실제로 이동된 key 배열
   */
  onChange: (nextTargetKeys: (string | number)[], direction: 'right' | 'left', moveKeys: (string | number)[]) => void

  /** 컬럼 정의 */
  columns: ColumnType<T>[]

  /** 행 고유 키 필드명 또는 getter 함수 */
  rowKey: string | ((record: T) => string | number)

  /** 각 패널 제목 [왼쪽, 오른쪽]. 기본값: ['소스', '대상'] */
  titles?: [string, string]

  /** 검색 입력창 표시 여부 */
  showSearch?: boolean

  /** 각 패널 리스트 영역 높이 (px 또는 CSS 문자열). 기본값: 400 */
  height?: number | string

  /** 각 패널 컨테이너에 적용할 인라인 스타일 */
  listStyle?: CSSProperties

  /** 루트 요소 추가 className */
  className?: string

  /** 로케일 오버라이드 */
  locale?: {
    itemUnit?: string
    notFoundContent?: string
    searchPlaceholder?: string
  }

  /** 정렬 가능 여부 (각 패널 내 DataGrid) */
  showSort?: boolean
}
