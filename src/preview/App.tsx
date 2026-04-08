import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { OverviewPage } from './pages/OverviewPage'
import { BasicDemo } from './examples/BasicDemo'
import { PaginationDemo } from './examples/PaginationDemo'
import { SelectionDemo } from './examples/SelectionDemo'
import { EditableDemo } from './examples/EditableDemo'
import { RowAddDeleteDemo } from './examples/RowAddDeleteDemo'
import { SortingDemo } from './examples/SortingDemo'
import { FixedColumnsDemo } from './examples/FixedColumnsDemo'
import { VirtualDemo } from './examples/VirtualDemo'
import { StylingDemo } from './examples/StylingDemo'
import { ApiSaveDemo } from './examples/ApiSaveDemo'
import { CustomEditorDemo } from './examples/CustomEditorDemo'
import { GroupHeaderResizeDemo } from './examples/GroupHeaderResizeDemo'
import { AllFeaturesDemo } from './examples/AllFeaturesDemo'
import { ServerPaginationDemo } from './examples/ServerPaginationDemo'
import { InfiniteScrollDemo } from './examples/InfiniteScrollDemo'
import { InlineEditDemo } from './examples/InlineEditDemo'
import { ValidationDemo } from './examples/ValidationDemo'
import { FocusedRowDemo } from './examples/FocusedRowDemo'
import { TransferDemo } from './examples/TransferDemo'
import { ClickRowSelectDemo } from './examples/ClickRowSelectDemo'
import { AntdFeaturesDemo } from './examples/AntdFeaturesDemo'
import { FlatTreeDemo } from './examples/FlatTreeDemo'
import { StripedDemo } from './examples/StripedDemo'
import './preview.scss'

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isSidebarOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isSidebarOpen])

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className={`preview-app${isSidebarOpen ? ' sidebar-open' : ''}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <button
        type="button"
        className="preview-mobile-menu-button"
        aria-label="메뉴 열기"
        aria-expanded={isSidebarOpen}
        onClick={toggleSidebar}
      >
        메뉴
      </button>
      <button
        type="button"
        className={`preview-sidebar-backdrop${isSidebarOpen ? ' visible' : ''}`}
        aria-label="메뉴 닫기"
        onClick={closeSidebar}
      />
      <main className="preview-main">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/components/basic" element={<BasicDemo />} />
          <Route path="/components/pagination" element={<PaginationDemo />} />
          <Route path="/components/selection" element={<SelectionDemo />} />
          <Route path="/components/editable" element={<EditableDemo />} />
          <Route path="/components/row-add-delete" element={<RowAddDeleteDemo />} />
          <Route path="/components/sorting" element={<SortingDemo />} />
          <Route path="/components/fixed-columns" element={<FixedColumnsDemo />} />
          <Route path="/components/virtual" element={<VirtualDemo />} />
          <Route path="/components/styling" element={<StylingDemo />} />
          <Route path="/components/custom-editor" element={<CustomEditorDemo />} />
          <Route path="/components/group-header-resize" element={<GroupHeaderResizeDemo />} />
          <Route path="/components/api-save" element={<ApiSaveDemo />} />
          <Route path="/components/all-features" element={<AllFeaturesDemo />} />
          <Route path="/components/server-pagination" element={<ServerPaginationDemo />} />
          <Route path="/components/infinite-scroll" element={<InfiniteScrollDemo />} />
          <Route path="/components/inline-edit" element={<InlineEditDemo />} />
          <Route path="/components/validation" element={<ValidationDemo />} />
          <Route path="/components/focused-row" element={<FocusedRowDemo />} />
          <Route path="/components/transfer" element={<TransferDemo />} />
          <Route path="/components/click-row-select" element={<ClickRowSelectDemo />} />
          <Route path="/components/antd-table-features" element={<AntdFeaturesDemo />} />
          <Route path="/components/flat-tree" element={<FlatTreeDemo />} />
          <Route path="/components/striped" element={<StripedDemo />} />
        </Routes>
      </main>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
