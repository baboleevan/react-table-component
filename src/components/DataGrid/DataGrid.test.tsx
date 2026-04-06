import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'

type Row = { id: number; name: string }

const nameCol: ColumnType<Row> = { key: 'name', title: '이름', dataIndex: 'name' }

describe('DataGrid', () => {
  it('shows default empty text when dataSource is empty', () => {
    render(<DataGrid<Row> rowKey="id" columns={[nameCol]} dataSource={[]} />)
    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument()
  })

  it('shows custom empty text from locale', () => {
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={[]}
        locale={{ emptyText: 'No rows' }}
      />,
    )
    expect(screen.getByText('No rows')).toBeInTheDocument()
  })

  it('calls rowSelection.onChange when a data row checkbox is toggled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={[
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]}
        rowSelection={{ type: 'checkbox', selectedRowKeys: [], onChange }}
      />,
    )

    const checks = screen.getAllByRole('checkbox')
    // [0] = select-all in header, [1] = first data row
    expect(checks.length).toBeGreaterThanOrEqual(2)
    await user.click(checks[1]!)
    expect(onChange).toHaveBeenCalled()
    const [keys] = onChange.mock.calls[0]!
    expect(keys).toContain(1)
  })

  it('invokes onChange when a sortable header is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[{ ...nameCol, sorter: true }]}
        dataSource={[
          { id: 1, name: 'Z' },
          { id: 2, name: 'A' },
        ]}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('columnheader', { name: /이름/i }))
    expect(onChange).toHaveBeenCalled()
  })
})
