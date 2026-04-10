import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid/DataGrid'
import type { ColumnType } from '@/components/DataGrid/types'

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
