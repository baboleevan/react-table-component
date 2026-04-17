import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { DataGrid } from '@/components/DataGrid/DataGrid'
import type { ColumnType, DataGridHandle, DataGridRowStyleMap } from '@/components/DataGrid/types'

type DemoRow = { id: number; name: string; dept: string }

const columns: ColumnType<DemoRow>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 72 },
  { key: 'name', title: '이름', dataIndex: 'name', width: 140, editable: true },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 120 },
]

const sampleRows: DemoRow[] = [
  { id: 1, name: '김철수', dept: '개발' },
  { id: 2, name: '이영희', dept: '디자인' },
  { id: 3, name: '박민수', dept: '개발' },
]

const meta = {
  title: 'DataGrid/DataGrid',
  component: DataGrid<DemoRow>,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataGrid<DemoRow>>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    rowKey: 'id',
    columns,
    dataSource: [],
    style: { height: 280 },
  },
}

export const Basic: Story = {
  args: {
    rowKey: 'id',
    columns,
    dataSource: sampleRows,
    pagination: { pageSize: 10 },
    style: { height: 320 },
  },
}

export const Loading: Story = {
  args: {
    rowKey: 'id',
    columns,
    dataSource: [],
    loading: true,
    style: { height: 280 },
  },
}

function SelectionPlayground() {
  const [keys, setKeys] = useState<(string | number)[]>([])
  return (
    <DataGrid<DemoRow>
      rowKey="id"
      columns={columns}
      dataSource={sampleRows}
      pagination={false}
      style={{ height: 320 }}
      rowSelection={{
        type: 'checkbox',
        selectedRowKeys: keys,
        onChange: (k) => setKeys(k),
      }}
    />
  )
}

export const RowSelection: Story = {
  render: () => <SelectionPlayground />,
}

export const CellStyleResolver: Story = {
  args: {
    rowKey: 'id',
    columns,
    dataSource: sampleRows,
    pagination: false,
    style: { height: 320 },
    cellStyleResolver: ({ rowKey, columnKey }) => {
      if (rowKey === 2 && columnKey === 'dept') {
        return { style: { backgroundColor: '#fff7d6', color: '#8a5a00', fontWeight: 600 } }
      }
      return undefined
    },
  },
}

function FullStyleApiPlayground() {
  const gridRef = useRef<DataGridHandle<DemoRow>>(null)
  const [rows] = useState<DemoRow[]>(
    Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      name: `직원 ${i + 1}`,
      dept: i % 3 === 0 ? '개발' : i % 3 === 1 ? '디자인' : '기획',
    })),
  )
  const [rowStyleMap, setRowStyleMap] = useState<DataGridRowStyleMap>({
    '2': {
      row: { tone: 'info' },
      cells: { name: { style: { fontWeight: 700 } } },
    },
    '5': {
      cells: { dept: { tone: 'warning' } },
    },
  })

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={() =>
            setRowStyleMap((prev) => ({
              ...prev,
              '3': { row: { style: { backgroundColor: '#fff7d6', color: '#8a5a00' } } },
            }))
          }
        >
          선언형: 3행 전체 강조
        </button>
        <button
          type="button"
          onClick={() =>
            gridRef.current?.setCellStyle(8, 'dept', {
              style: { backgroundColor: '#fff1f0', color: '#a8071a', fontWeight: 700 },
            })
          }
        >
          명령형: 8행 dept 셀
        </button>
        <button
          type="button"
          onClick={() =>
            gridRef.current?.setRangeStyle({
              rowKeys: [10, 11],
              columnKeys: '*',
              config: { tone: 'success' },
            })
          }
        >
          범위: 10~11행 전체 컬럼
        </button>
        <button type="button" onClick={() => gridRef.current?.undoStyles()}>
          Undo
        </button>
        <button type="button" onClick={() => gridRef.current?.redoStyles()}>
          Redo
        </button>
        <button type="button" onClick={() => gridRef.current?.scrollToRowKey(20)}>
          20행으로 이동(페이지 자동 전환)
        </button>
        <button type="button" onClick={() => void gridRef.current?.copyToClipboard({ scope: 'page' })}>
          페이지 TSV 복사
        </button>
        <button type="button" onClick={() => gridRef.current?.exportAsCsv({ filename: 'storybook-grid.csv' })}>
          CSV 저장
        </button>
      </div>
      <DataGrid<DemoRow>
        gridRef={gridRef}
        rowKey="id"
        columns={[{ ...columns[0], sorter: true }, columns[1], columns[2]]}
        dataSource={rows}
        rowStyleMap={rowStyleMap}
        printBackground
        persistColumnWidthsKey="storybook-datagrid-full-style-api"
        pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: [8, 16] }}
        style={{ height: 380 }}
      />
    </div>
  )
}

export const FullStyleApi: Story = {
  render: () => <FullStyleApiPlayground />,
}

function ClipboardAndCsvPlayground() {
  const gridRef = useRef<DataGridHandle<DemoRow>>(null)
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" onClick={() => void gridRef.current?.copyToClipboard({ scope: 'page' })}>
          현재 페이지 TSV 복사
        </button>
        <button type="button" onClick={() => gridRef.current?.exportAsCsv({ filename: 'storybook-grid.csv' })}>
          현재 페이지 CSV 저장
        </button>
      </div>
      <DataGrid<DemoRow>
        gridRef={gridRef}
        rowKey="id"
        columns={columns}
        dataSource={Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `사원 ${i + 1}`, dept: '개발' }))}
        pagination={{ pageSize: 5, showSizeChanger: true, pageSizeOptions: [5, 10] }}
        style={{ height: 320 }}
      />
    </div>
  )
}

export const ClipboardAndCsv: Story = {
  render: () => <ClipboardAndCsvPlayground />,
}

function PersistColumnWidthsPlayground() {
  return (
    <DataGrid<DemoRow>
      rowKey="id"
      columns={[
        { key: 'id', title: 'ID', dataIndex: 'id', width: 72 },
        { key: 'name', title: '이름(드래그로 너비 변경)', dataIndex: 'name', width: 160 },
        { key: 'dept', title: '부서', dataIndex: 'dept', width: 120 },
      ]}
      dataSource={Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name: `사용자 ${i + 1}`,
        dept: i % 2 === 0 ? '개발' : '디자인',
      }))}
      persistColumnWidthsKey="storybook-persist-column-widths"
      pagination={{ pageSize: 6 }}
      style={{ height: 320 }}
    />
  )
}

export const PersistColumnWidths: Story = {
  render: () => <PersistColumnWidthsPlayground />,
}

function ScrollToRowKeyPlayground() {
  const gridRef = useRef<DataGridHandle<DemoRow>>(null)
  const rows = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: `직원 ${i + 1}`,
    dept: i % 3 === 0 ? '개발' : i % 3 === 1 ? '디자인' : '기획',
  }))
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => gridRef.current?.scrollToRowKey(20)}>
          20행으로 이동(페이지 자동 전환)
        </button>
        <button type="button" onClick={() => gridRef.current?.scrollToRowKey(3)}>
          3행으로 이동
        </button>
      </div>
      <DataGrid<DemoRow>
        gridRef={gridRef}
        rowKey="id"
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: [8, 16] }}
        style={{ height: 320 }}
      />
    </div>
  )
}

export const ScrollToRowKey: Story = {
  render: () => <ScrollToRowKeyPlayground />,
}
