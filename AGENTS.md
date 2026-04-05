# AGENTS.md — react-table-component

AI 코딩 에이전트(GitHub Copilot, Cursor, Windsurf, OpenAI Codex 등)가 이 프로젝트에서 작업할 때 따라야 하는 가이드입니다.

---

## 프로젝트 한 줄 요약

> Ant Design Table을 대체하는 React 19 + Vite + TypeScript + SCSS 기반 DataGrid 컴포넌트.
> 10만 건 이상 데이터의 인라인 편집도 부드럽게 동작해야 합니다.

---

## 에이전트 행동 규칙

### 반드시 지켜야 할 것

1. **TypeScript strict mode** — `any` 금지. `unknown` + 타입 가드를 사용합니다.
2. **SCSS only** — 동적 값(sticky offset, CSS 커스텀 프로퍼티 주입)이 아닌 한 `style` prop에 스타일을 작성하지 않습니다.
3. **BEM 2단계** — 클래스 네이밍은 `.block`, `.block__element`, `.block--modifier`까지만. 3단계 이상 금지.
4. **외부 UI 라이브러리 금지** — Ant Design, MUI, Chakra 등 추가 설치 금지.
5. **`npm run build` 통과** — 작업 완료 후 반드시 빌드를 실행해 타입 오류·컴파일 오류가 없는지 확인합니다.

### 하지 말아야 할 것

- `darken()`, `lighten()` 등 deprecated Sass 전역 색상 함수 사용
- `useEffect`로 파생 상태를 계산하는 패턴 (대신 `useMemo` 사용)
- `EditCell`을 controlled component(`value` prop)로 변경 — uncontrolled + `defaultValue` 패턴이 성능상 올바릅니다
- Preview 앱(`src/preview/`)을 컴포넌트 라이브러리 코드(`src/components/`)에서 import
- `console.log` 디버그 코드를 커밋에 포함

---

## 작업 유형별 지침

### A. DataGrid 기능 추가/수정

1. **타입 먼저**: `src/components/DataGrid/types.ts`에 새 prop/인터페이스를 추가합니다.
2. **구현**: `DataGrid.tsx`에 로직을 작성합니다.
   - 상태는 최소화: controlled props가 있으면 internal state를 병행하지 않습니다.
   - 비용이 큰 연산은 `useMemo`로 감쌉니다.
3. **스타일**: `DataGrid.scss`에 추가합니다. 새 색상이 필요하면 `_variables.scss`에 `!default` 변수를 먼저 만들고, `.datagrid` 블록에 CSS 커스텀 프로퍼티로 expose합니다.
4. **데모**: `src/preview/examples/`에 `XxxDemo.tsx`를 추가합니다. `DemoBlock`으로 감싸고 `code` prop에 실제 사용 예시 코드 문자열을 작성합니다.
5. **라우팅 등록**: `Sidebar.tsx`의 `MENU` 배열과 `App.tsx`의 `<Routes>`에 추가합니다.
6. **빌드 확인**: `npm run build` 를 실행합니다.

### B. 스타일/테마 변경

- **전역 변경**: `src/styles/_variables.scss`의 `!default` 변수를 수정합니다.
- **인스턴스별 변경**: `DataGrid`의 `style` prop에 CSS 커스텀 프로퍼티를 전달하는 방법을 문서화합니다.
- **새 색상 변수 추가 시** `_variables.scss` → `DataGrid.scss` (CSS 변수 선언) 순서를 반드시 지킵니다.

### C. 성능 최적화

- 렌더 횟수 문제는 `React DevTools Profiler`로 먼저 진단 후 수정합니다.
- 가상화 로직은 `src/components/DataGrid/useVirtualRows.ts`에 격리합니다. 외부 가상화 라이브러리를 추가하기 전에 기존 훅으로 해결 가능한지 먼저 검토합니다.
- 셀 렌더 최적화가 필요하면 행 단위 `React.memo` 분리를 고려합니다.

### D. Preview 앱 추가/수정

- Preview 앱은 컴포넌트의 **사용자 관점 문서**입니다. 실제 사용법처럼 작성합니다.
- `DemoBlock`의 `code` prop에는 실제 복붙 가능한 예제 코드를 문자열로 전달합니다.
- Preview 전용 상태(예: `selectedKeys`)는 각 Demo 파일 안에서만 관리합니다.

---

## 파일별 역할 요약

| 파일 | 역할 |
|------|------|
| `src/components/DataGrid/types.ts` | 모든 public 타입/인터페이스 정의 |
| `src/components/DataGrid/DataGrid.tsx` | 메인 컴포넌트 구현 |
| `src/components/DataGrid/DataGrid.scss` | 컴포넌트 스타일 (BEM) |
| `src/components/DataGrid/useVirtualRows.ts` | 행 가상화 로직 |
| `src/components/DataGrid/index.ts` | 외부 export 진입점 |
| `src/styles/_variables.scss` | SCSS 디자인 토큰 |
| `src/styles/global.scss` | 전역 reset |
| `src/preview/App.tsx` | Preview 라우팅 |
| `src/preview/components/Sidebar.tsx` | 사이드바 내비게이션 |
| `src/preview/components/DemoBlock.tsx` | 데모 + 코드 토글 래퍼 |
| `src/preview/pages/OverviewPage.tsx` | 컴포넌트 목록 페이지 |
| `src/preview/examples/*.tsx` | 각 기능 데모 페이지 |

---

## 타입 패턴

```typescript
// ✅ 올바른 pagination 타입 처리
const isPaginationDisabled = pagination === false
const paginationConfig = pagination !== false ? pagination ?? null : null

// ✅ 올바른 rowKey 처리
function getRowKey<T>(record: T, rowKey: DataGridProps<T>['rowKey'], index: number) {
  if (typeof rowKey === 'function') return rowKey(record)
  if (typeof rowKey === 'string') return (record as Record<string, unknown>)[rowKey] as string | number
  return index
}

// ✅ CSS 커스텀 프로퍼티 타입 캐스팅
style={{ '--grid-header-bg': '#001529' } as React.CSSProperties}
```

---

## SCSS 패턴

```scss
// ✅ 변수 → CSS 커스텀 프로퍼티 expose 패턴
.datagrid {
  --grid-header-bg: #{$grid-header-bg};  // SCSS 변수를 CSS var로 노출
}

// ✅ 컴포넌트 단위 테마 변경 (사용 측)
.my-dark-grid {
  --grid-header-bg: #001529;
  --grid-header-color: rgba(255, 255, 255, 0.85);
}

// ❌ deprecated Sass 함수
&:hover { background: darken(#fafafa, 3%); }  // 금지

// ✅ 대안
&:hover { background: #f0f0f0; }  // 하드코딩
// 또는
@use 'sass:color';
&:hover { background: color.adjust(#fafafa, $lightness: -3%); }
```

---

## 빌드 체크리스트 (작업 완료 전 확인)

- [ ] `npm run build` 통과 (타입 오류 0, Vite 빌드 성공)
- [ ] `npm run lint` 경고 없음
- [ ] 새 기능이면 Preview 데모 페이지 추가 완료
- [ ] SCSS deprecated 함수 미사용 확인
- [ ] `console.log` 제거 완료
