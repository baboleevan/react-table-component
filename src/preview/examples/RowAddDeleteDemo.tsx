import { useCallback, useRef, useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { DemoBlock } from '../components/DemoBlock'

interface DemoRow {
  id: number
  name: string
  email: string
}

const initialRows: DemoRow[] = [
  { id: 1, name: '김민준', email: 'minjun@example.com' },
  { id: 2, name: '이서연', email: 'seoyeon@example.com' },
  { id: 3, name: '박도윤', email: 'doyun@example.com' },
]

const columns: ColumnType<DemoRow>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 72, align: 'center' },
  { key: 'name', title: '이름', dataIndex: 'name', width: 120, editable: true },
  { key: 'email', title: '이메일', dataIndex: 'email', width: 220, editable: true, ellipsis: true },
]

const CODE_BASIC = `const [data, setData] = useState<DemoRow[]>(initialRows)
const nextIdRef = useRef(100)

<DataGrid<DemoRow>
  dataSource={data}
  columns={columns}
  rowKey="id"
  bordered
  onCellEdit={(rowKey, colKey, newValue) => {
    setData((prev) =>
      prev.map((r) => (String(r.id) === String(rowKey) ? { ...r, [colKey]: newValue } : r)),
    )
  }}
  rowOperations={{
    showAdd: true,
    onAdd: () => {
      const id = nextIdRef.current++
      setData((prev) => [...prev, { id, name: '', email: '' }])
    },
    showDelete: true,
    onDelete: (rowKey) => {
      setData((prev) => prev.filter((r) => String(r.id) !== String(rowKey)))
    },
    deleteColumnTitle: '삭제',
    getDeleteButtonProps: (record) => ({ disabled: record.id === 1 }),
  }}
/>`

const CODE_SELECTION = `const [data, setData] = useState<DemoRow[]>(initialRows)
const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([])
const nextIdRef = useRef(100)

const removeRowsByKeys = (keys: (string | number)[]) => {
  const keySet = new Set(keys.map((k) => String(k)))
  setData((prev) => prev.filter((r) => !keySet.has(String(r.id))))
  setSelectedKeys((prev) => prev.filter((k) => !keySet.has(String(k))))
}

<DataGrid<DemoRow>
  dataSource={data}
  columns={columns}
  rowKey="id"
  bordered
  rowSelection={{
    selectedRowKeys: selectedKeys,
    onChange: (keys) => setSelectedKeys(keys),
  }}
  onCellEdit={(rowKey, colKey, newValue) => {
    setData((prev) =>
      prev.map((r) => (String(r.id) === String(rowKey) ? { ...r, [colKey]: newValue } : r)),
    )
  }}
  rowOperations={{
    showAdd: true,
    onAdd: () => {
      const id = nextIdRef.current++
      setData((prev) => [...prev, { id, name: '', email: '' }])
    },
    showDelete: true,
    onDelete: (rowKey) => removeRowsByKeys([rowKey]),
    showDeleteSelected: true,
    onDeleteSelected: (keys) => removeRowsByKeys(keys),
    deleteColumnTitle: '삭제',
    deleteSelectedLabel: '선택 삭제',
  }}
/>`

export function RowAddDeleteDemo() {
  const [data, setData] = useState<DemoRow[]>(initialRows)
  const nextIdRef = useRef(100)

  const [dataSel, setDataSel] = useState<DemoRow[]>(() => [...initialRows])
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([])
  const nextIdSelRef = useRef(200)

  const handleCellEdit = useCallback(
    (rowKey: string | number, colKey: string, newValue: unknown) => {
      setData((prev) =>
        prev.map((r) => (String(r.id) === String(rowKey) ? { ...r, [colKey]: newValue } : r)),
      )
    },
    [],
  )

  const handleAdd = useCallback(() => {
    const id = nextIdRef.current++
    setData((prev) => [...prev, { id, name: '', email: '' }])
  }, [])

  const handleDelete = useCallback((rowKey: string | number) => {
    setData((prev) => prev.filter((r) => String(r.id) !== String(rowKey)))
  }, [])

  const removeRowsByKeys = useCallback((keys: (string | number)[]) => {
    const keySet = new Set(keys.map((k) => String(k)))
    setDataSel((prev) => prev.filter((r) => !keySet.has(String(r.id))))
    setSelectedKeys((prev) => prev.filter((k) => !keySet.has(String(k))))
  }, [])

  const handleCellEditSel = useCallback(
    (rowKey: string | number, colKey: string, newValue: unknown) => {
      setDataSel((prev) =>
        prev.map((r) => (String(r.id) === String(rowKey) ? { ...r, [colKey]: newValue } : r)),
      )
    },
    [],
  )

  const handleAddSel = useCallback(() => {
    const id = nextIdSelRef.current++
    setDataSel((prev) => [...prev, { id, name: '', email: '' }])
  }, [])

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">행 추가 / 삭제</h1>
      <p className="demo-page__desc">
        <code>rowOperations</code>로 상단 &quot;행 추가&quot; 버튼과 행별 &quot;삭제&quot; 컬럼을 켤 수 있습니다.{' '}
        <code>dataSource</code>는 항상 부모 상태로 제어합니다. 아래 두 번째 예제는 <code>rowSelection</code>과
        함께 <strong>선택 삭제</strong>(<code>showDeleteSelected</code> + <code>onDeleteSelected</code>)를
        사용합니다.
      </p>

      <DemoBlock
        title="rowOperations — 추가 / 단일 행 삭제"
        description="이름·이메일 셀은 더블클릭 후 편집할 수 있습니다. ID 1행은 행 삭제 버튼이 비활성화됩니다."
        code={CODE_BASIC}
      >
        <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(0,0,0,.45)' }}>
          현재 행 수: <strong>{data.length}</strong>
        </p>
        <div style={{ height: 420 }}>
          <DataGrid<DemoRow>
            dataSource={data}
            columns={columns}
            rowKey="id"
            bordered
            onCellEdit={handleCellEdit}
            rowOperations={{
              showAdd: true,
              onAdd: handleAdd,
              showDelete: true,
              onDelete: handleDelete,
              deleteColumnTitle: '삭제',
              getDeleteButtonProps: (record) => ({ disabled: record.id === 1 }),
            }}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="rowSelection + 선택 삭제 + 행 추가 / 단일 삭제"
        description="체크박스로 선택 후 툴바의「선택 삭제」로 일괄 제거합니다. 단일 행 삭제 시에도 선택 키가 정리됩니다."
        code={CODE_SELECTION}
      >
        <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(0,0,0,.45)' }}>
          행 수: <strong>{dataSel.length}</strong>
          &nbsp;·&nbsp; 선택됨: <strong>{selectedKeys.length}</strong>개
        </p>
        <div style={{ height: 480 }}>
          <DataGrid<DemoRow>
            dataSource={dataSel}
            columns={columns}
            rowKey="id"
            bordered
            rowSelection={{
              selectedRowKeys: selectedKeys,
              onChange: (keys) => setSelectedKeys(keys),
            }}
            onCellEdit={handleCellEditSel}
            rowOperations={{
              showAdd: true,
              onAdd: handleAddSel,
              showDelete: true,
              onDelete: (rowKey) => removeRowsByKeys([rowKey]),
              showDeleteSelected: true,
              onDeleteSelected: (keys) => removeRowsByKeys(keys),
              deleteColumnTitle: '삭제',
              deleteSelectedLabel: '선택 삭제',
            }}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
