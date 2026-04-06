import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import './preview.scss'

export function App() {
  return (
    <BrowserRouter>
      <div className="preview-app">
        <Sidebar />
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
