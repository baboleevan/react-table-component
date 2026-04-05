# DataGrid 버그 분석 보고서

분석 일자: 2026-04-05

## 분석 대상

- `src/components/DataGrid/DataGrid.tsx`
- `src/components/DataGrid/useVirtualRows.ts`
- `src/components/DataGrid/DataGrid.scss`
- `src/preview/examples/BasicDemo.tsx`

---

## Critical — 핵심 기능 오동작

### BUG-01: handleSelectAll이 disabled 행을 무시 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `handleSelectAll`, `allSelected`, `indeterminate`
**증상**: `getCheckboxProps`로 `disabled: true`를 반환하는 행도 전체 선택/해제 시 토글됨.
**영향**: Ant Design Table 호환성 위반. disabled 행의 선택 상태가 의도치 않게 변경됨.
**수정**: disabled 행은 select all/deselect all에서 제외하고 기존 선택 상태 유지. allSelected/indeterminate 계산도 disabled 행 제외.

### BUG-02: Enter 키로 편집 완료 시 validator 미실행 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `handleContainerKeyDown` Enter 분기
**증상**: Tab 키는 `commitAndMove`를 통해 validator가 정상 실행되지만, Enter 키는 validator를 실행하지 않고 에디터를 닫음.
**영향**: Enter로 편집을 완료하면 검증이 누락됨.
**수정**: Enter 키 핸들러에 validator 호출 추가.

### BUG-03: validator가 편집 전 record(stale data)를 수신 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `commitAndMove`, `handleContainerKeyDown`, `handleEditCommit`
**증상**: `onCellEdit` 호출 후 validator를 실행하지만, `record`는 편집 전 데이터. state 업데이트는 아직 미반영.
**영향**: 교차 컬럼 검증(`record.otherField` 참조)이 stale 데이터로 실행됨.
**수정**: validator에 전달하기 전 편집된 필드를 반영한 `updatedRecord`를 구성.

---

## High — 동작 불일치

### BUG-04: commitAndMove(Tab)에서 onFocusedRowChange 미호출 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `commitAndMove`
**증상**: Tab 키로 셀 이동 시 `setFocusedKey`는 호출되지만 `onFocusedRowChange` 콜백은 호출되지 않음.
**영향**: Tab 네비게이션으로 행이 변경되어도 외부 리스너가 변경을 감지하지 못함.
**수정**: `commitAndMove` 내에서 `onFocusedRowChange` 호출 추가.

### BUG-05: editMode='click'에서 onFocusedRowChange 절대 미호출 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `<td>` onClick (click 모드 분기)
**증상**: click 모드의 td onClick에서 `e.stopPropagation()`이 무조건 호출되어, tr의 onClick(`onFocusedRowChange` 포함)이 실행되지 않음. 편집 불가 셀 포함.
**영향**: click 편집 모드에서 `onFocusedRowChange`가 전혀 작동하지 않음.
**수정**: click 모드 td onClick 내에서 `onFocusedRowChange` 직접 호출.

### BUG-06: scrollToRow가 sticky 헤더 높이를 미고려 — ✅ 수정완료

**파일**: `useVirtualRows.ts` — `scrollToRow`
**증상**: 아래쪽으로 스크롤하여 행을 표시할 때, sticky 헤더 높이를 고려하지 않아 대상 행이 뷰포트 하단에서 헤더 높이만큼 잘림.
**영향**: 키보드 ↓ 또는 Tab으로 행 이동 시 대상 행이 완전히 보이지 않을 수 있음.
**수정**: `scrollToRow`에서 헤더 높이를 측정하여 보정.

### BUG-07: handleSort onChange에 정렬 적용 전 데이터 전달 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `handleSort`
**증상**: `onChange` 콜백의 `currentDataSource`에 새 정렬이 적용되지 않은 이전 상태의 데이터가 전달됨.
**영향**: 정렬 변경 이벤트 핸들러에서 정확한 데이터를 얻을 수 없음.
**수정**: 새 정렬 상태로 데이터를 미리 계산하여 `onChange`에 전달.

---

## Medium — 엣지 케이스

### BUG-08: 기본 정렬 비교에서 null/undefined 불안정 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `sortedData` useMemo
**증상**: `va! < vb!` 비교에서 null/undefined 값이 있으면 non-null assertion으로 예측 불가능한 정렬 결과.
**영향**: null 값이 포함된 컬럼 정렬 시 순서가 불안정.
**수정**: null/undefined를 명시적으로 처리하여 항상 끝으로 정렬.

### BUG-09: InlineEditInput Escape 시 불필요한 onCellEdit/validator 실행 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `InlineEditInput`
**증상**: Escape로 편집 취소 시 값을 리셋하지만, `.blur()` 호출로 인해 `onCommit` → `onCellEdit` + `runValidator`가 원래 값으로 실행됨.
**영향**: 취소 의도인데 불필요한 콜백과 검증이 실행됨.
**수정**: Escape 플래그를 통해 blur 시 commit을 건너뜀.

### BUG-10: onRow의 className이 내부 className에 덮어씌워짐 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `<tr>` 렌더링
**증상**: `{...rowExtraProps}` 스프레드 후 `className={trClass}`가 명시적으로 설정되어, `onRow`에서 반환한 className이 유실됨.
**영향**: `onRow`로 커스텀 클래스를 추가할 수 없음.
**수정**: `rowExtraProps.className`을 `trClass` 구성 시 병합.

### BUG-11: BasicDemo pageSizeOptions에 기본 pageSize 미포함 — ✅ 수정완료

**파일**: `BasicDemo.tsx`
**증상**: `pageSize: 20`인데 `pageSizeOptions: [50, 100, 200]`에 20이 없어, 페이지 크기를 변경하면 20으로 복귀 불가.
**영향**: 데모 사용성 문제.
**수정**: `pageSizeOptions`에 20 추가.

### BUG-12: gridRef useEffect에 cleanup 없음 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `gridRef` useEffect
**증상**: 컴포넌트 언마운트 시 `gridRef.current`가 stale handle을 계속 참조.
**영향**: 언마운트된 컴포넌트의 handle로 메서드 호출 시 예상치 못한 동작 가능.
**수정**: useEffect cleanup에서 `gridRef.current = null` 설정.

---

## Low — 코드 품질

### BUG-13: runValidator 내 미사용 errorKey 변수 — ✅ 수정완료

**파일**: `DataGrid.tsx` — `runValidator`
**증상**: `errorKey` 변수를 선언 후 사용하지 않고 `void errorKey`로 경고만 억제.
**영향**: 불필요한 코드.
**수정**: 변수 및 void 문 제거.

### BUG-14: SCSS 주석 오타 — ✅ 수정완료

**파일**: `DataGrid.scss` L14
**증상**: `"노출135"` — "135"가 주석 끝에 붙음.
**수정**: `"노출"`로 수정.

### BUG-15: 미사용 CSS 규칙 (pagination-ellipsis) — ✅ 수정완료

**파일**: `DataGrid.scss`
**증상**: `&__pagination-ellipsis` 규칙이 `display: none`으로 정의되어 있으나 JSX에서 사용되지 않음.
**수정**: 불필요한 CSS 규칙 제거.
