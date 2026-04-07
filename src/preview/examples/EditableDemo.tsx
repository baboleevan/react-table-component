import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

type RowStatus = 'C' | 'U' | 'D' | 'R'
interface EditableRow extends Employee {
  rowStatus: RowStatus
}

// editable 컬럼만 편집 가능하게 설정
const makeColumns = (editable: boolean): ColumnType<Employee>[] => [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 70, fixed: 'left' },
  { key: 'name', title: '이름', dataIndex: 'name', width: 100, editable },
  { key: 'email', title: '이메일', dataIndex: 'email', width: 200, editable, ellipsis: true },
  { key: 'phone', title: '연락처', dataIndex: 'phone', width: 150, editable },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 90, editable },
  { key: 'team', title: '팀', dataIndex: 'team', width: 90, editable },
  { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
  { key: 'level', title: '레벨', dataIndex: 'level', width: 100 },
  { key: 'salary', title: '연봉(만)', dataIndex: 'salary', width: 110, align: 'right', editable },
  { key: 'bonus', title: '보너스', dataIndex: 'bonus', width: 100, align: 'right', editable },
  { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center' },
  { key: 'gender', title: '성별', dataIndex: 'gender', width: 70, align: 'center' },
  { key: 'city', title: '도시', dataIndex: 'city', width: 90, editable },
  { key: 'joinDate', title: '입사일', dataIndex: 'joinDate', width: 110 },
  { key: 'contractType', title: '고용형태', dataIndex: 'contractType', width: 100 },
  { key: 'status', title: '상태', dataIndex: 'status', width: 80 },
  { key: 'score', title: '점수', dataIndex: 'score', width: 80, align: 'center', editable },
  { key: 'grade', title: '등급', dataIndex: 'grade', width: 70, align: 'center', editable },
  { key: 'manager', title: '매니저', dataIndex: 'manager', width: 100 },
  { key: 'project', title: '프로젝트', dataIndex: 'project', width: 110, editable },
  { key: 'budget', title: '예산(만)', dataIndex: 'budget', width: 110, align: 'right', editable },
  { key: 'revenue', title: '매출(만)', dataIndex: 'revenue', width: 110, align: 'right' },
  { key: 'cost', title: '비용(만)', dataIndex: 'cost', width: 110, align: 'right' },
  { key: 'profitRate', title: '수익률(%)', dataIndex: 'profitRate', width: 110, align: 'right' },
  { key: 'memo', title: '메모', dataIndex: 'memo', width: 180, editable, ellipsis: true, fixed: 'right' },
]

const DBLCLICK_CODE = `// editMode="dblclick" (기본값) — 셀을 더블클릭해야 편집 모드 진입
<DataGrid<Employee>
  dataSource={data}
  columns={columns}   // editable: true 컬럼 포함
  rowKey="id"
  editMode="dblclick"
  onCellEdit={(rowKey, colKey, newValue) => {
    setData(prev =>
      prev.map(r => r.id === rowKey ? { ...r, [colKey]: newValue } : r)
    )
  }}
/>`

const CLICK_CODE = `// editMode="click" — 클릭 즉시 편집 모드 진입
// editable 컬럼에 호버 시 점선 테두리로 편집 가능함을 안내합니다
<DataGrid<Employee>
  dataSource={data}
  columns={columns}
  rowKey="id"
  editMode="click"
  onCellEdit={(rowKey, colKey, newValue) => {
    setData(prev =>
      prev.map(r => r.id === rowKey ? { ...r, [colKey]: newValue } : r)
    )
  }}
/>`

const ROW_STATUS_CODE = `// rowStatus 값으로 행 단위 편집 허용/차단
// C: 생성, U: 변경, D: 삭제, R: 읽기전용(편집불가)
type RowStatus = 'C' | 'U' | 'D' | 'R'
interface EditableRow extends Employee {
  rowStatus: RowStatus
}

const columns: ColumnType<EditableRow>[] = [
  { key: 'name', dataIndex: 'name', title: '이름', editable: true,
    editableWhen: (record) => record.rowStatus !== 'R' },
  { key: 'salary', dataIndex: 'salary', title: '연봉', editable: true, align: 'right',
    editableWhen: (record) => record.rowStatus !== 'R' },
]

<DataGrid<EditableRow>
  dataSource={rows}
  columns={columns}
  rowKey="id"
  editMode="click"
/>`

function EditableTable({ editMode }: { editMode: 'dblclick' | 'click' }) {
  const [data, setData] = useState<Employee[]>(EMPLOYEE_DATA)
  const [editCount, setEditCount] = useState(0)

  const handleCellEdit = (rowKey: string | number, colKey: string, newValue: unknown) => {
    setData((prev) => prev.map((r) => (r.id === rowKey ? { ...r, [colKey]: newValue } : r)))
    setEditCount((n) => n + 1)
  }

  return (
    <>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(0,0,0,.45)' }}>
        총 편집 횟수: <strong>{editCount}</strong>회 &nbsp;·&nbsp;
        {editMode === 'dblclick'
          ? '💡 editable 컬럼 셀을 더블클릭하세요'
          : '💡 editable 컬럼 셀을 클릭하면 즉시 편집됩니다 (호버 시 점선 테두리)'}
      </p>
      <div style={{ height: 520 }}>
        <DataGrid<Employee>
          dataSource={data}
          columns={makeColumns(true)}
          rowKey="id"
          editMode={editMode}
          onCellEdit={handleCellEdit}
          scroll={{ x: 2500 }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            pageSizeOptions: [50, 100, 200],
            showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
          }}
        />
      </div>
    </>
  )
}

function RowStatusEditableTable() {
  const [data, setData] = useState<EditableRow[]>(
    EMPLOYEE_DATA.slice(0, 40).map((r, idx) => ({
      ...r,
      rowStatus: (['C', 'U', 'D', 'R'] as const)[idx % 4],
    })),
  )

  const columns: ColumnType<EditableRow>[] = [
    {
      key: 'rowStatus',
      title: 'rowStatus',
      dataIndex: 'rowStatus',
      width: 110,
      align: 'center',
      render: (v) => (
        <span style={{ color: v === 'R' ? '#cf1322' : '#389e0d', fontWeight: 600 }}>{String(v)}</span>
      ),
    },
    { key: 'id', title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    {
      key: 'name',
      title: '이름',
      dataIndex: 'name',
      width: 120,
      editable: true,
      editableWhen: (record) => record.rowStatus !== 'R',
      render: (v, r) =>
        r.rowStatus === 'R' ? <span style={{ color: '#8c8c8c' }}>{String(v)}</span> : (v as string),
    },
    {
      key: 'dept',
      title: '부서',
      dataIndex: 'dept',
      width: 100,
      editable: true,
      editableWhen: (record) => record.rowStatus !== 'R',
      render: (v, r) =>
        r.rowStatus === 'R' ? <span style={{ color: '#8c8c8c' }}>{String(v)}</span> : (v as string),
    },
    {
      key: 'salary',
      title: '연봉(만)',
      dataIndex: 'salary',
      width: 110,
      align: 'right',
      editable: true,
      editableWhen: (record) => record.rowStatus !== 'R',
      render: (v, r) =>
        r.rowStatus === 'R' ? <span style={{ color: '#8c8c8c' }}>{String(v ?? '')}</span> : (v as number),
    },
    {
      key: 'memo',
      title: '메모',
      dataIndex: 'memo',
      width: 200,
      editable: true,
      editableWhen: (record) => record.rowStatus !== 'R',
      ellipsis: true,
      render: (v, r) =>
        r.rowStatus === 'R' ? <span style={{ color: '#8c8c8c' }}>{String(v)}</span> : (v as string),
    },
  ]

  return (
    <div style={{ height: 420 }}>
      <DataGrid<EditableRow>
        dataSource={data}
        columns={columns}
        rowKey="id"
        editMode="click"
        onCellEdit={(rowKey, colKey, newValue) => {
          setData((prev) => prev.map((r) => (r.id === rowKey ? { ...r, [colKey]: newValue } : r)))
        }}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 12, showSizeChanger: true }}
      />
    </div>
  )
}

export function EditableDemo() {
  return (
    <div className="demo-page">
      <h1 className="demo-page__title">편집 가능 셀 (Editable)</h1>
      <p className="demo-page__desc">
        10,000건 × 25컬럼에서 인라인 셀 편집 성능을 확인합니다. EditCell은 React.memo로 격리되어 다른 셀에 영향을 주지
        않습니다.
      </p>

      <DemoBlock
        title='더블클릭 편집 (editMode="dblclick")'
        description="기본값. 셀을 더블클릭해야 편집 입력창이 나타납니다."
        code={DBLCLICK_CODE}
      >
        <EditableTable editMode="dblclick" />
      </DemoBlock>

      <DemoBlock
        title='즉시 편집 (editMode="click")'
        description="클릭 한 번으로 즉시 편집 모드 진입. editable 셀 호버 시 점선 테두리로 안내됩니다."
        code={CLICK_CODE}
      >
        <EditableTable editMode="click" />
      </DemoBlock>

      <DemoBlock
        title="행 상태(rowStatus) 기반 편집 제어"
        description="rowStatus가 R(읽기전용)인 행은 편집 불가입니다. C/U/D 행은 편집 가능합니다."
        code={ROW_STATUS_CODE}
      >
        <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(0,0,0,.55)' }}>
          💡 C=생성, U=변경, D=삭제, R=읽기전용. R 행은 입력창으로 진입하지 않으며 텍스트(회색)로만 표시됩니다.
        </p>
        <RowStatusEditableTable />
      </DemoBlock>
    </div>
  )
}
