import { NavLink, useNavigate } from 'react-router-dom'

const MENU = [
  {
    section: 'DataGrid',
    items: [
      { path: '/components/basic', label: '기본 사용법' },
      { path: '/components/pagination', label: '페이지네이션' },
      { path: '/components/selection', label: '행 선택 (Row Selection)' },
      { path: '/components/editable', label: '편집 가능 셀 (Editable)' },
      { path: '/components/row-add-delete', label: '행 추가 / 삭제 (Row operations)' },
      { path: '/components/inline-edit', label: '인라인 편집 (항상 노출)' },
      { path: '/components/sorting', label: '정렬 (Sorting)' },
      { path: '/components/fixed-columns', label: '고정 컬럼 (Fixed)' },
      { path: '/components/virtual', label: '가상화 (10만 행)' },
      { path: '/components/styling', label: '스타일 커스터마이징' },
      { path: '/components/custom-editor', label: '커스텀 에디터' },
      { path: '/components/group-header-resize', label: '그룹 헤더 & 헤더 리사이즈' },
      { path: '/components/api-save', label: 'API 저장 (편집 → 전송)' },
      { path: '/components/all-features', label: '전체 기능 통합 (10만 행)' },
      { path: '/components/server-pagination', label: '서버 페이지네이션' },
      { path: '/components/server-sort', label: '서버 정렬 (sortRemote)' },
      { path: '/components/infinite-scroll', label: '무한 스크롤' },
      { path: '/components/validation', label: '셀 검증 (Validation)' },
      { path: '/components/focused-row', label: '포커스된 행 추적 (onFocusedRowChange)' },
      { path: '/components/transfer', label: '데이터 이전 (DataTransfer)' },
      { path: '/components/click-row-select', label: '행 클릭 선택 (clickRowToSelect)' },
      { path: '/components/antd-table-features', label: 'Ant Design Table 호환 (필터·확장·합계 등)' },
      { path: '/components/flat-tree', label: '플랫 트리 (depth + 폴딩)' },
      { path: '/components/striped', label: '줄무늬 (striped)' },
      { path: '/components/cell-style-resolver', label: '셀 색상 제어 (cellStyleResolver)' },
    ],
  },
]

type SidebarProps = {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate()
  return (
    <nav className={`preview-sidebar${isOpen ? ' is-open' : ''}`}>
      <div
        className="preview-sidebar__logo"
        onClick={() => {
          navigate('/')
          onClose?.()
        }}
      >
        ⚡ DataGrid
      </div>
      {MENU.map(({ section, items }) => (
        <div key={section}>
          <div className="preview-sidebar__section-title">{section}</div>
          {items.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `preview-sidebar__link${isActive ? ' active' : ''}`}
              onClick={() => onClose?.()}
            >
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
