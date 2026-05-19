import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { createRef } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType, DataGridHandle } from '@/components/DataGrid'

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

  it('does not toggle clickRowToSelect when clicking an inline editor control', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const editableCol: ColumnType<Row> = {
      key: 'name',
      title: '이름',
      dataIndex: 'name',
      editable: true,
      renderEditor: (value, _r, _i, onCommit) => (
        <input
          className="test-editor"
          defaultValue={String(value ?? '')}
          onChange={(e) => onCommit(e.target.value)}
        />
      ),
    }
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[{ key: 'id', title: 'ID', dataIndex: 'id', width: 70 }, editableCol]}
        dataSource={[
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]}
        editMode="inline"
        rowSelection={{ type: 'checkbox', selectedRowKeys: [], onChange, clickRowToSelect: true }}
      />,
    )

    const editor = screen.getAllByRole('textbox')[0]!
    await user.click(editor)
    expect(onChange).not.toHaveBeenCalled()

    await user.click(screen.getByText('2'))
    expect(onChange).toHaveBeenCalled()
  })

  it('disables row selection when getCheckboxProps returns disabled', async () => {
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
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: [],
          onChange,
          getCheckboxProps: (record) => ({ disabled: record.id === 2 }),
        }}
      />,
    )

    const checks = screen.getAllByRole('checkbox')
    expect(checks[2]).toBeDisabled()
    await user.click(checks[2]!)
    expect(onChange).not.toHaveBeenCalled()

    await user.click(checks[1]!)
    expect(onChange).toHaveBeenCalled()
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

  it('applies external cell style from cellStyleResolver', () => {
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={[
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]}
        cellStyleResolver={({ rowKey, columnKey }) =>
          rowKey === 2 && columnKey === 'name'
            ? { style: { backgroundColor: '#222222', color: '#f5f5f5' } }
            : undefined
        }
      />,
    )

    const targetCell = screen.getByText('B').closest('td')
    expect(targetCell).toHaveStyle({ backgroundColor: '#222222', color: '#f5f5f5' })
  })

  it('applies declarative rowStyleMap for row and specific column', () => {
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={[
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]}
        rowStyleMap={{
          '2': {
            row: { style: { backgroundColor: '#101010', color: '#ffffff' } },
            cells: { name: { style: { color: '#22c55e' } } },
          },
        }}
      />,
    )

    const targetCell = screen.getByText('B').closest('td')
    expect(targetCell).toHaveStyle({ backgroundColor: '#101010', color: '#22c55e' })
  })

  it('updates cell style through gridRef imperative API', () => {
    const gridRef = createRef<DataGridHandle<Row>>()
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={[
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]}
        gridRef={gridRef}
      />,
    )

    act(() => {
      gridRef.current?.setCellStyle(2, 'name', { style: { backgroundColor: '#ff0000', color: '#ffffff' } })
    })

    const targetCell = screen.getByText('B').closest('td')
    expect(targetCell).toHaveStyle({ backgroundColor: '#ff0000', color: '#ffffff' })
  })

  it('merges inline styles: column onCell overrides cellStyleResolver', () => {
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[
          {
            ...nameCol,
            onCell: () => ({ style: { backgroundColor: 'rgb(0, 0, 255)' } }),
          },
        ]}
        dataSource={[{ id: 1, name: 'A' }]}
        cellStyleResolver={() => ({ style: { backgroundColor: 'rgb(255, 0, 0)' } })}
      />,
    )

    const cell = screen.getByText('A').closest('td')
    expect(cell).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' })
  })

  it('undoStyles and redoStyles toggle imperative cell style', () => {
    const gridRef = createRef<DataGridHandle<Row>>()
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={[
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]}
        gridRef={gridRef}
      />,
    )

    act(() => {
      gridRef.current?.setCellStyle(2, 'name', { style: { backgroundColor: 'rgb(255, 0, 0)' } })
    })
    expect(screen.getByText('B').closest('td')).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' })

    act(() => {
      gridRef.current?.undoStyles()
    })
    expect(screen.getByText('B').closest('td')).not.toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' })

    act(() => {
      gridRef.current?.redoStyles()
    })
    expect(screen.getByText('B').closest('td')).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' })
  })

  it('setRangeStyle with columnKeys * applies to all leaf columns', () => {
    type TwoCol = { id: number; a: string; b: string }
    const gridRef = createRef<DataGridHandle<TwoCol>>()
    const cols: ColumnType<TwoCol>[] = [
      { key: 'a', title: 'A', dataIndex: 'a' },
      { key: 'b', title: 'B', dataIndex: 'b' },
    ]
    render(
      <DataGrid<TwoCol>
        rowKey="id"
        columns={cols}
        dataSource={[{ id: 1, a: 'x', b: 'y' }]}
        gridRef={gridRef}
      />,
    )

    act(() => {
      gridRef.current?.setRangeStyle({
        rowKeys: [1],
        columnKeys: '*',
        config: { style: { backgroundColor: 'rgb(0, 128, 0)' } },
      })
    })

    expect(screen.getByText('x').closest('td')).toHaveStyle({ backgroundColor: 'rgb(0, 128, 0)' })
    expect(screen.getByText('y').closest('td')).toHaveStyle({ backgroundColor: 'rgb(0, 128, 0)' })
  })

  it('applies tone class from rowStyleMap', () => {
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={[{ id: 1, name: 'A' }]}
        rowStyleMap={{ '1': { cells: { name: { tone: 'error' } } } }}
      />,
    )

    const cell = screen.getByText('A').closest('td')
    expect(cell?.className).toContain('datagrid__td--tone-error')
  })

  it('sets aria-sort on sortable header', () => {
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[{ ...nameCol, sorter: true }]}
        dataSource={[{ id: 1, name: 'A' }]}
      />,
    )
    const th = screen.getByRole('columnheader', { name: /이름/i })
    expect(th).toHaveAttribute('aria-sort', 'none')
  })

  it('fixes row selection column to the left and offsets data fixed columns', () => {
    type Row3 = { id: number; a: string; b: string }
    const cols: ColumnType<Row3>[] = [
      { key: 'a', title: 'A', dataIndex: 'a', fixed: 'left', width: 80 },
      { key: 'b', title: 'B', dataIndex: 'b', width: 200 },
    ]
    const onChange = vi.fn()

    render(
      <DataGrid<Row3>
        rowKey="id"
        columns={cols}
        dataSource={[{ id: 1, a: 'x', b: 'y' }]}
        scroll={{ x: 400 }}
        rowSelection={{ type: 'checkbox', selectedRowKeys: [], onChange, fixed: 'left' }}
      />,
    )

    const rowCheckbox = screen.getAllByRole('checkbox')[1]!
    expect(rowCheckbox.closest('td')).toHaveClass('fixed-left')
    expect(screen.getByText('x').closest('td')).toHaveStyle({ '--sticky-left': '40px' })
  })

  it('marks the last left fixed column so its boundary border remains visible', () => {
    type ThreeCol = { id: number; a: string; b: string; c: string }
    const cols: ColumnType<ThreeCol>[] = [
      { key: 'a', title: 'A', dataIndex: 'a', fixed: 'left', width: 80 },
      { key: 'b', title: 'B', dataIndex: 'b', fixed: 'left', width: 80 },
      { key: 'c', title: 'C', dataIndex: 'c', width: 80 },
    ]

    render(<DataGrid<ThreeCol> rowKey="id" columns={cols} dataSource={[{ id: 1, a: 'x', b: 'y', c: 'z' }]} />)

    expect(screen.getByText('x').closest('td')).not.toHaveClass('fixed-left-last')
    expect(screen.getByText('y').closest('td')).toHaveClass('fixed-left-last')
    expect(screen.getByText('z').closest('td')).toHaveClass('after-fixed-left')
    expect(screen.getByRole('columnheader', { name: 'B' })).toHaveClass('fixed-left-last')
    expect(screen.getByRole('columnheader', { name: 'C' })).toHaveClass('after-fixed-left')
  })

  it('copyToClipboard copies page as TSV', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    const gridRef = createRef<DataGridHandle<Row>>()
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={[
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ]}
        gridRef={gridRef}
      />,
    )

    await act(async () => {
      await gridRef.current?.copyToClipboard({ scope: 'page' })
    })

    expect(writeText).toHaveBeenCalled()
    const payload = writeText.mock.calls[0]![0] as string
    expect(payload).toContain('이름')
    expect(payload).toContain('A')
    expect(payload).toContain('B')

    vi.unstubAllGlobals()
  })

  it('exportAsCsv uses blob URL', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const gridRef = createRef<DataGridHandle<Row>>()
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={[{ id: 1, name: 'X' }]}
        gridRef={gridRef}
      />,
    )

    act(() => {
      gridRef.current?.exportAsCsv({ filename: 'rows.csv', includeBom: false })
    })

    expect(createObjectURL).toHaveBeenCalled()

    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })

  it('slices full dataSource when controlled pagination total matches data length', () => {
    const rows: Row[] = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }))
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={rows}
        pagination={{ current: 1, pageSize: 10, total: rows.length }}
      />,
    )
    expect(screen.getByText('Row 1')).toBeInTheDocument()
    expect(screen.getByText('Row 10')).toBeInTheDocument()
    expect(screen.queryByText('Row 11')).not.toBeInTheDocument()
  })

  it('renders the last page of a 10,000-row client-paginated grid', () => {
    const rows: Row[] = Array.from({ length: 10_000 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }))
    render(
      <DataGrid<Row>
        rowKey="id"
        columns={[nameCol]}
        dataSource={rows}
        pagination={{ current: 200, pageSize: 50, total: rows.length }}
      />,
    )
    expect(screen.getByText('Row 9951')).toBeInTheDocument()
    expect(screen.getByText('Row 10000')).toBeInTheDocument()
    expect(screen.queryByText('Row 9950')).not.toBeInTheDocument()
  })

  it('scrollToRowKey changes page in uncontrolled pagination', async () => {
    type PageRow = { id: number; name: string }
    const gridRef = createRef<DataGridHandle<PageRow>>()
    const rows: PageRow[] = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }))
    const cols: ColumnType<PageRow>[] = [{ key: 'name', title: '이름', dataIndex: 'name' }]

    render(
      <DataGrid<PageRow>
        rowKey="id"
        columns={cols}
        dataSource={rows}
        pagination={{ pageSize: 8 }}
        gridRef={gridRef}
      />,
    )

    expect(screen.getByText('Row 1')).toBeInTheDocument()
    expect(screen.queryByText('Row 20')).not.toBeInTheDocument()

    act(() => {
      gridRef.current?.scrollToRowKey(20)
    })

    await waitFor(() => {
      expect(screen.getByText('Row 20')).toBeInTheDocument()
    })
    expect(screen.queryByText('Row 1')).not.toBeInTheDocument()
  })
})
