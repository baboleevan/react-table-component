import { Link } from 'react-router-dom'

const CARDS = [
  {
    path: '/components/basic',
    title: '기본 사용법',
    desc: '컬럼 정의, 데이터 바인딩, 렌더러 커스터마이징',
    tag: 'Basic',
  },
  {
    path: '/components/pagination',
    title: '페이지네이션',
    desc: '클라이언트 및 서버사이드 페이지네이션',
    tag: 'Pagination',
  },
  {
    path: '/components/selection',
    title: '행 선택',
    desc: 'Checkbox / Radio 행 선택, 전체선택',
    tag: 'Selection',
  },
  {
    path: '/components/editable',
    title: '편집 가능 셀',
    desc: '더블클릭으로 셀 인라인 편집, 커스텀 에디터',
    tag: 'Editable',
  },
  {
    path: '/components/sorting',
    title: '정렬',
    desc: '단일 컬럼 정렬, 커스텀 비교함수',
    tag: 'Sorting',
  },
  {
    path: '/components/server-sort',
    title: '서버 정렬',
    desc: 'sortRemote + API 요청으로 정렬 상태·데이터 동기화',
    tag: 'Remote',
  },
  {
    path: '/components/fixed-columns',
    title: '고정 컬럼',
    desc: '좌우 sticky 컬럼, 가로 스크롤',
    tag: 'Fixed',
  },
  {
    path: '/components/virtual',
    title: '가상화 렌더링',
    desc: '10만 건 데이터를 DOM 최소화로 렌더',
    tag: 'Virtual',
  },
  {
    path: '/components/styling',
    title: '스타일 커스터마이징',
    desc: 'SCSS 변수 및 CSS 커스텀 프로퍼티 오버라이드',
    tag: 'Styling',
  },
  {
    path: '/components/antd-table-features',
    title: 'Ant Design Table 호환',
    desc: '필터·확장·트리·합계·title/footer·responsive 등',
    tag: 'AntD API',
  },
  {
    path: '/components/flat-tree',
    title: '플랫 트리 (depth)',
    desc: '플랫 dataSource + depth 필드로 트리 UI·접기/펼치기',
    tag: 'Tree',
  },
  {
    path: '/components/striped',
    title: '줄무늬 (striped)',
    desc: 'striped prop으로 홀수 행 배경, CSS 변수로 색 조정',
    tag: 'Style',
  },
  {
    path: '/components/cell-style-resolver',
    title: '셀 색상 제어',
    desc: '외부에서 row/column 기준으로 특정 셀 배경색·글자색 변경',
    tag: 'Cell Style',
  },
]

export function OverviewPage() {
  return (
    <div className="preview-overview">
      <div className="preview-overview__hero">
        <h1>DataGrid 컴포넌트</h1>
        <p>React + Vite + TypeScript + SCSS 기반의 고성능 데이터 테이블 컴포넌트</p>
      </div>
      <div className="preview-overview__grid">
        {CARDS.map(({ path, title, desc, tag }) => (
          <Link key={path} to={path} className="preview-overview__card">
            <h3>{title}</h3>
            <p>{desc}</p>
            <span className="preview-overview__card__tag">{tag}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
