# TODO — Ant Design Table 호환 미구현 기능

> 이 문서는 Ant Design Table API 대비 DataGrid에 아직 구현되지 않은 기능 목록입니다.
> 각 항목을 체크박스로 관리하며, 구현 완료 시 `[x]`로 표시합니다.
>
> **2026-04 업데이트**: 대부분의 핵심 항목을 구현했습니다. 예제: 프리뷰 메뉴 **「Ant Design Table 호환 (필터·확장·합계 등)」** (`/components/antd-table-features`).
> `**onChange` 시그니처**는 Ant Design과 같이 `(pagination, filters, sorter, extra)` 순서로 변경되었습니다.

---

## 1. 필터링 (Column)

- `filters` — 필터 옵션 배열 `{ text, value, children? }[]`
- `onFilter` — 필터 함수 `(value, record) => boolean`
- `filteredValue` — 제어 모드 필터 값
- `filterDropdown` — 커스텀 필터 드롭다운 렌더러
- `filterMode` — `'menu' | 'tree'` 필터 UI 모드
- `filterSearch` — 필터 목록 내 검색 활성화
- `filterMultiple` — 다중 필터 선택 허용 (기본값: true)
- `filterResetToDefaultFilteredValue` — 리셋 시 기본 필터값 적용
- `defaultFilteredValue` — 초기 필터 값
- `onChange` 콜백에 `filters` 파라미터 추가

---

## 2. 행 확장 / 트리 데이터 (Table)

- `expandable.expandedRowRender` — 확장 행 렌더러
- `expandable.rowExpandable` — 확장 가능 여부 판별 함수
- `expandable.expandedRowKeys` — 제어 모드 확장 키
- `expandable.defaultExpandedRowKeys` — 초기 확장 키
- `expandable.onExpand` — 확장 토글 콜백
- `expandable.onExpandedRowsChange` — 확장 키 변경 콜백
- `expandable.expandIcon` — 커스텀 확장 아이콘
- `expandable.expandRowByClick` — 행 클릭으로 확장
- `expandable.indentSize` — 트리 들여쓰기 크기 (기본값: 15)
- `expandable.childrenColumnName` — 트리 데이터 자식 필드명 (기본값: 'children')

---

## 3. 합계 행 (Table)

- `summary` — 합계 행 렌더 함수 `(data) => ReactNode`
- `Table.Summary` / `Table.Summary.Row` / `Table.Summary.Cell` 컴포넌트 (`TableSummary`, `TableSummaryRow`, `TableSummaryCell` 및 `export const Table = { Summary }`)
- `summary` 행 상단/하단 고정 (`summaryFixed: 'top' | 'bottom'`, 스크롤 컨테이너 기준 sticky)

---

## 4. 테이블 제목/푸터 (Table)

- `title` — 테이블 상단 제목 렌더러 `(data) => ReactNode`
- `footer` — 테이블 하단 푸터 렌더러 `(data) => ReactNode`

---

## 5. 헤더 제어 (Table)

- `showHeader` — 헤더 표시 여부 (기본값: true)
- `onHeaderRow` — 헤더 행 이벤트 핸들러

---

## 6. 정렬 보완 (Column)

- `defaultSortOrder` — 초기 정렬 순서 (`'ascend' | 'descend'`)
- `showSorterTooltip` — 정렬 아이콘 툴팁 표시 (`title` 속성)
- `sorter.multiple` — 다중 컬럼 정렬 우선순위 (`Shift`+헤더 클릭으로 복수 정렬; `sorter: { compare, multiple }`)

---

## 7. 컬럼 표시 제어 (Column)

- `hidden` — 컬럼 숨기기
- `responsive` — 반응형 브레이크포인트 (`['xxl', 'xl', 'lg', 'md', 'sm', 'xs']`)

---

## 8. dataIndex 중첩 경로 (Column)

- `dataIndex`를 배열로 지정하여 중첩 객체 접근 (`['address', 'city']`)

---

## 9. 셀 병합 (Column)

- `colSpan` — 헤더 셀 병합 (리프 컬럼; 그룹 헤더와 조합 시 레이아웃은 단순 케이스 위주)
- `render` 반환값에서 `{ children, props: { colSpan, rowSpan } }` 지원

---

## 10. 커스텀 렌더링 (Table)

- `components` — 테이블 요소 오버라이드 전부 (`table`은 지원, `body.row` 지원; `header`/`body`의 wrapper·cell 등은 미구현)

---

## 11. 기타

- `tableLayout` — CSS table-layout (`'auto' | 'fixed'`)
- `getPopupContainer` — 필터 드롭다운 렌더 컨테이너
- `shouldCellUpdate` — 셀 리렌더 최적화 함수
- `sticky` — Ant Design 수준(윈도우 스크롤 + `getContainer`)은 미구현. `sticky.offsetHeader`는 기존 헤더 sticky에 더해진 픽셀 보정으로만 동작.

---

## 알려진 제한

- **가상화**: 트리 모드·행 확장 컬럼이 있으면 가상화를 끕니다.
- `**onChange`**: 네 번째 인자 `extra.action`에 `'expand'`가 포함됩니다.
- **그룹 헤더 + `col.colSpan`**: 복잡한 병합 조합은 검증이 부족할 수 있습니다.