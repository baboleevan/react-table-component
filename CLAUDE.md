# CLAUDE.md — react-table-component

이 파일은 Claude Code(AI 어시스턴트)가 이 프로젝트에서 작업할 때 따라야 하는 가이드입니다.

---

## 프로젝트 개요

Ant Design `Table` 컴포넌트를 대체하는 **고성능 React DataGrid** 컴포넌트 라이브러리입니다.

| 항목 | 내용 |
|------|------|
| 프레임워크 | React 19, Vite 8 |
| 언어 | TypeScript (strict mode) |
| 스타일 | SCSS (sass) |
| 라우터 | react-router-dom v7 (Preview 앱 전용) |
| Node | v22 (nvm 사용) |

---

## 디렉토리 구조

```
src/
├── components/
│   └── DataGrid/           ← 핵심 컴포넌트
│       ├── DataGrid.tsx    ← 메인 컴포넌트
│       ├── DataGrid.scss   ← 컴포넌트 스타일 (SCSS)
│       ├── types.ts        ← props/타입 정의
│       ├── useVirtualRows.ts ← 행 가상화 훅
│       └── index.ts        ← public export
├── styles/
│   ├── _variables.scss     ← SCSS 디자인 토큰 (전역 커스터마이징 진입점)
│   └── global.scss         ← 전역 reset/base
├── preview/                ← 컴포넌트 데모 앱 (배포 대상 아님)
│   ├── App.tsx             ← 라우팅 루트
│   ├── components/         ← Sidebar, DemoBlock 등 프리뷰 전용 컴포넌트
│   ├── pages/              ← OverviewPage 등
│   └── examples/           ← 각 기능별 데모 페이지
└── main.tsx                ← Vite 진입점
```

### Path aliases

| 별칭 | 경로 |
|------|------|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@styles/*` | `src/styles/*` |
| `@preview/*` | `src/preview/*` |

---

## 개발 명령어

```bash
# nvm으로 Node 22 활성화 필수
source ~/.nvm/nvm.sh && nvm use 22

npm run dev      # 개발 서버 (localhost:5173)
npm run build    # 타입 체크 + Vite 빌드
npm run lint     # ESLint
```

---

## 컴포넌트 핵심 설계 원칙

### 1. Props는 Ant Design Table과 유사하게 유지

`DataGridProps<T>` (`src/components/DataGrid/types.ts`)는 Ant Design의 `TableProps`와 유사한 인터페이스를 제공합니다. 레거시 코드 마이그레이션 시 최소한의 변경으로 교체 가능해야 합니다.

주요 props:
- `dataSource` — 데이터 배열
- `columns` — `ColumnType<T>[]` 컬럼 정의
- `rowKey` — 행 고유 키 (string 필드명 또는 getter 함수)
- `pagination` — `PaginationConfig | false`
- `rowSelection` — `RowSelectionConfig<T>`
- `scroll` — `{ x?, y? }`
- `onCellEdit` — 셀 편집 완료 콜백 `(rowKey, columnKey, newValue, record) => void`

### 2. 성능: 대용량 데이터 (1만 건+)

- **행 가상화**: `dataSource.length > 100`이면 자동으로 `useVirtualRows` 훅이 활성화됩니다. `virtual={true/false}`로 명시적 제어도 가능합니다.
- **EditCell 격리**: 편집 셀 컴포넌트(`EditCell`)는 `React.memo`로 감싸져 있어 편집 중 다른 행/셀의 리렌더를 유발하지 않습니다.
- **`useMemo` 활용**: `sortedData`, `pagedData`, `resolvedColumns` 등 비용이 큰 계산은 모두 memoize합니다.
- 불필요한 `useEffect`를 추가하지 마세요. 파생 상태는 `useMemo`로 처리합니다.

### 3. 스타일링 규칙

- **SCSS만 사용**: inline style은 동적 값(CSS 커스텀 프로퍼티 주입, sticky offset)에만 허용합니다.
- **BEM 네이밍**: `.datagrid`, `.datagrid__th`, `.datagrid__tr--focused` 등 2단계까지만.
- **CSS 셀렉터 최대 깊이 3**: `.datagrid .datagrid__tr .datagrid__td` 이상의 중첩은 허용하지 않습니다.
- **디자인 토큰**: 색상·여백은 `src/styles/_variables.scss`의 `!default` 변수로 정의하고, 동시에 CSS 커스텀 프로퍼티로 expose합니다.
- **런타임 테마 변경**: `style` prop으로 CSS 커스텀 프로퍼티를 전달하면 인스턴스별 테마 변경이 가능합니다.

```scss
// ✅ 올바른 패턴
.datagrid__th.sorted { color: #1677ff; }

// ❌ 금지: 깊은 중첩
.datagrid__thead .datagrid__tr .datagrid__th.sorted { ... }
```

### 4. 타입 안전성

- `DataGrid<T>` 는 제네릭 컴포넌트입니다. `T`는 데이터 레코드 타입입니다.
- `ColumnType<T>.render`, `ColumnType<T>.sorter` 등 콜백은 `T`에 바인딩됩니다.
- `strict: true` 모드. `any` 사용 금지. `unknown`으로 수신 후 타입 가드를 사용하세요.

### 5. Preview 앱 (src/preview/)

- 컴포넌트 라이브러리의 배포 산출물이 아니라 **개발/문서화 전용** 앱입니다.
- 새 기능 추가 시 반드시 `src/preview/examples/`에 데모 페이지를 함께 작성합니다.
- `DemoBlock` 컴포넌트를 사용하여 "프리뷰 + 소스코드 토글" 형식으로 작성합니다.
- `Sidebar`의 `MENU` 배열에 라우트를 등록하고, `App.tsx`의 `<Routes>`에도 추가합니다.

---

## 금지 사항

- `any` 타입 사용
- CSS-in-JS 라이브러리 도입 (emotion, styled-components 등)
- Ant Design, Material UI 등 외부 UI 라이브러리 의존
- `darken()`, `lighten()` 등 deprecated Sass 전역 함수 사용 → `color.adjust()` 또는 하드코딩 사용
- 컴포넌트 외부에서 import할 수 없는 내부 타입을 `DataGridProps`에 포함시키는 행위
- Preview 앱의 코드를 컴포넌트 라이브러리 코드에 역으로 의존시키는 행위

---

## 새 기능 추가 체크리스트

1. `src/components/DataGrid/types.ts`에 타입/props 추가
2. `DataGrid.tsx`에 로직 구현
3. `DataGrid.scss`에 스타일 추가 (변수 우선)
4. `src/preview/examples/`에 데모 페이지 작성
5. `Sidebar.tsx` MENU 및 `App.tsx` Routes 등록
6. `npm run build` 통과 확인

---

## 자주 하는 실수 방지

| 실수 | 올바른 방법 |
|------|-------------|
| `pagination !== false` 비교 시 TS 오류 | `pagination !== false ? pagination ?? null : null` |
| `darken()` 사용 시 경고 | `color.adjust($color, $lightness: -3%)` 또는 hex 직접 사용 |
| vite alias `@components/...` import | `tsconfig.app.json`의 `paths`와 `vite.config.ts`의 `alias` 양쪽 모두 등록 |
| EditCell 리렌더 과다 | `React.memo` + `defaultValue` 패턴 유지, `value` controlled로 전환 금지 |
