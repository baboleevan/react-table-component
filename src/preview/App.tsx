import { useEffect, useState, startTransition } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from '@/preview/components/Sidebar'
import { OverviewPage } from '@/preview/pages/OverviewPage'
import { BasicDemo } from '@/preview/examples/BasicDemo'
import { PaginationDemo } from '@/preview/examples/PaginationDemo'
import { SelectionDemo } from '@/preview/examples/SelectionDemo'
import { EditableDemo } from '@/preview/examples/EditableDemo'
import { RowAddDeleteDemo } from '@/preview/examples/RowAddDeleteDemo'
import { SortingDemo } from '@/preview/examples/SortingDemo'
import { FixedColumnsDemo } from '@/preview/examples/FixedColumnsDemo'
import { VirtualDemo } from '@/preview/examples/VirtualDemo'
import { StylingDemo } from '@/preview/examples/StylingDemo'
import { ApiSaveDemo } from '@/preview/examples/ApiSaveDemo'
import { CustomEditorDemo } from '@/preview/examples/CustomEditorDemo'
import { GroupHeaderResizeDemo } from '@/preview/examples/GroupHeaderResizeDemo'
import { AllFeaturesDemo } from '@/preview/examples/AllFeaturesDemo'
import { ServerPaginationDemo } from '@/preview/examples/ServerPaginationDemo'
import { InfiniteScrollDemo } from '@/preview/examples/InfiniteScrollDemo'
import { InlineEditDemo } from '@/preview/examples/InlineEditDemo'
import { ValidationDemo } from '@/preview/examples/ValidationDemo'
import { FocusedRowDemo } from '@/preview/examples/FocusedRowDemo'
import { TransferDemo } from '@/preview/examples/TransferDemo'
import { ClickRowSelectDemo } from '@/preview/examples/ClickRowSelectDemo'
import { AntdFeaturesDemo } from '@/preview/examples/AntdFeaturesDemo'
import { FlatTreeDemo } from '@/preview/examples/FlatTreeDemo'
import { StripedDemo } from '@/preview/examples/StripedDemo'
import '@/preview/preview.scss'

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    startTransition(() => {
      setIsSidebarOpen(false)
    })
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
