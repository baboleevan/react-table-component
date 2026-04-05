import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

// editable 컬럼만 편집 가능하게 설정
const makeColumns = (editable: boolean): ColumnType<Employee>[] => [
  { key: 'id',           title: 'ID',        dataIndex: 'id',           width: 70,  fixed: 'left' },
  { key: 'name',         title: '이름',      dataIndex: 'name',         width: 100, editable },
  { key: 'email',        title: '이메일',    dataIndex: 'email',        width: 200, editable, ellipsis: true },
  { key: 'phone',        title: '연락처',    dataIndex: 'phone',        width: 150, editable },
  { key: 'dept',         title: '부서',      dataIndex: 'dept',         width: 90,  editable },
  { key: 'team',         title: '팀',        dataIndex: 'team',         width: 90,  editable },
  { key: 'position',     title: '직급',      dataIndex: 'position',     width: 90 },
  { key: 'level',        title: '레벨',      dataIndex: 'level',        width: 100 },
  { key: 'salary',       title: '연봉(만)',  dataIndex: 'salary',       width: 110, align: 'right', editable },
  { key: 'bonus',        title: '보너스',    dataIndex: 'bonus',        width: 100, align: 'right', editable },
  { key: 'age',          title: '나이',      dataIndex: 'age',          width: 70,  align: 'center' },
  { key: 'gender',       title: '성별',      dataIndex: 'gender',       width: 70,  align: 'center' },
  { key: 'city',         title: '도시',      dataIndex: 'city',         width: 90,  editable },
  { key: 'joinDate',     title: '입사일',    dataIndex: 'joinDate',     width: 110 },
  { key: 'contractType', title: '고용형태',  dataIndex: 'contractType', width: 100 },
  { key: 'status',       title: '상태',      dataIndex: 'status',       width: 80 },
  { key: 'score',        title: '점수',      dataIndex: 'score',        width: 80,  align: 'center', editable },
  { key: 'grade',        title: '등급',      dataIndex: 'grade',        width: 70,  align: 'center', editable },
  { key: 'manager',      title: '매니저',    dataIndex: 'manager',      width: 100 },
  { key: 'project',      title: '프로젝트',  dataIndex: 'project',      width: 110, editable },
  { key: 'budget',       title: '예산(만)',  dataIndex: 'budget',       width: 110, align: 'right', editable },
  { key: 'revenue',      title: '매출(만)',  dataIndex: 'revenue',      width: 110, align: 'right' },
  { key: 'cost',         title: '비용(만)',  dataIndex: 'cost',         width: 110, align: 'right' },
  { key: 'profitRate',   title: '수익률(%)', dataIndex: 'profitRate',   width: 110, align: 'right' },
  { key: 'memo',         title: '메모',      dataIndex: 'memo',         width: 180, editable, ellipsis: true, fixed: 'right' },
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

function EditableTable({ editMode }: { editMode: 'dblclick' | 'click' }) {
  const [data, setData] = useState<Employee[]>(EMPLOYEE_DATA)
  const [editCount, setEditCount] = useState(0)

  const handleCellEdit = (rowKey: string | number, colKey: string, newValue: unknown) => {
    setData((prev) =>
      prev.map((r) => (r.id === rowKey ? { ...r, [colKey]: newValue } : r)),
    )
    setEditCount((n) => n + 1)
  }

  return (
    <>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(0,0,0,.45)' }}>
        총 편집 횟수: <strong>{editCount}</strong>회
        &nbsp;·&nbsp;
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

export function EditableDemo() {
  return (
    <div className="demo-page">
      <h1 className="demo-page__title">편집 가능 셀 (Editable)</h1>
      <p className="demo-page__desc">
        10,000건 × 25컬럼에서 인라인 셀 편집 성능을 확인합니다.
        EditCell은 React.memo로 격리되어 다른 셀에 영향을 주지 않습니다.
      </p>

      <DemoBlock
        title="더블클릭 편집 (editMode=&quot;dblclick&quot;)"
        description="기본값. 셀을 더블클릭해야 편집 입력창이 나타납니다."
        code={DBLCLICK_CODE}
      >
        <EditableTable editMode="dblclick" />
      </DemoBlock>

      <DemoBlock
        title="즉시 편집 (editMode=&quot;click&quot;)"
        description="클릭 한 번으로 즉시 편집 모드 진입. editable 셀 호버 시 점선 테두리로 안내됩니다."
        code={CLICK_CODE}
      >
        <EditableTable editMode="click" />
      </DemoBlock>
    </div>
  )
}
