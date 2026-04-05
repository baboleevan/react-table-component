import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

const columns: ColumnType<Employee>[] = [
  { key: 'id',           title: 'ID',        dataIndex: 'id',           width: 70,  fixed: 'left' },
  { key: 'name',         title: '이름',      dataIndex: 'name',         width: 100, fixed: 'left', editable: true },
  { key: 'email',        title: '이메일',    dataIndex: 'email',        width: 200, editable: true, ellipsis: true },
  { key: 'phone',        title: '연락처',    dataIndex: 'phone',        width: 150, editable: true },
  { key: 'dept',         title: '부서',      dataIndex: 'dept',         width: 90,  editable: true },
  { key: 'team',         title: '팀',        dataIndex: 'team',         width: 90 },
  { key: 'position',     title: '직급',      dataIndex: 'position',     width: 90 },
  { key: 'level',        title: '레벨',      dataIndex: 'level',        width: 100 },
  { key: 'salary',       title: '연봉(만)',  dataIndex: 'salary',       width: 110, align: 'right', editable: true },
  { key: 'bonus',        title: '보너스',    dataIndex: 'bonus',        width: 100, align: 'right', editable: true },
  { key: 'age',          title: '나이',      dataIndex: 'age',          width: 70,  align: 'center' },
  { key: 'gender',       title: '성별',      dataIndex: 'gender',       width: 70,  align: 'center' },
  { key: 'city',         title: '도시',      dataIndex: 'city',         width: 90,  editable: true },
  { key: 'joinDate',     title: '입사일',    dataIndex: 'joinDate',     width: 110 },
  { key: 'contractType', title: '고용형태',  dataIndex: 'contractType', width: 100 },
  { key: 'status',       title: '상태',      dataIndex: 'status',       width: 80,
    render: (v) => {
      const colors: Record<string, string> = { 재직: '#52c41a', 휴직: '#faad14', 수습: '#1677ff', 파견: '#722ed1' }
      return <span style={{ color: colors[v as string] ?? '#000', fontWeight: 500 }}>{v as string}</span>
    },
  },
  { key: 'score',        title: '점수',      dataIndex: 'score',        width: 80,  align: 'center', editable: true },
  { key: 'grade',        title: '등급',      dataIndex: 'grade',        width: 70,  align: 'center', editable: true },
  { key: 'project',      title: '프로젝트',  dataIndex: 'project',      width: 110, editable: true },
  { key: 'budget',       title: '예산(만)',  dataIndex: 'budget',       width: 110, align: 'right', editable: true },
  { key: 'revenue',      title: '매출(만)',  dataIndex: 'revenue',      width: 110, align: 'right' },
  { key: 'cost',         title: '비용(만)',  dataIndex: 'cost',         width: 110, align: 'right' },
  { key: 'profitRate',   title: '수익률(%)', dataIndex: 'profitRate',   width: 110, align: 'right' },
  { key: 'memo',         title: '메모',      dataIndex: 'memo',         width: 180, editable: true, ellipsis: true },
  { key: 'manager',      title: '매니저',    dataIndex: 'manager',      width: 100, fixed: 'right' },
]

const CODE = `// pagination={false} + 10,000건 → 가상화 자동 활성화
// DOM에는 화면에 보이는 행(+ overscan)만 존재합니다
<DataGrid<Employee>
  dataSource={EMPLOYEE_DATA}   // 10,000건
  columns={columns}            // 25컬럼 (editable 포함)
  rowKey="id"
  rowHeight={46}
  pagination={false}
  scroll={{ x: 2400 }}
  onCellEdit={(rowKey, colKey, newValue) => {
    setData(prev =>
      prev.map(r => r.id === rowKey ? { ...r, [colKey]: newValue } : r)
    )
  }}
/>`

export function VirtualDemo() {
  const [data, setData] = useState<Employee[]>(EMPLOYEE_DATA)
  const [editLog, setEditLog] = useState<string[]>([])

  const handleCellEdit = (rowKey: string | number, colKey: string, newValue: unknown) => {
    setData((prev) =>
      prev.map((r) => (r.id === rowKey ? { ...r, [colKey]: newValue } : r)),
    )
    setEditLog((prev) => [
      `[id=${rowKey}] ${colKey} → "${newValue}"`,
      ...prev.slice(0, 4),
    ])
  }

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">가상화 렌더링 (Virtual Scroll)</h1>
      <p className="demo-page__desc">
        10,000건 × 25컬럼을 페이지네이션 없이 한 번에 렌더링합니다.
        행 가상화로 DOM에는 보이는 행만 존재하며, editable 셀 편집도 빠르게 동작합니다.
      </p>

      <DemoBlock
        title="가상화 + 편집 (10,000건 × 25컬럼, 페이지네이션 없음)"
        description="스크롤하며 편집 성능을 확인하세요. editMode=&quot;dblclick&quot;"
        code={CODE}
      >
        {editLog.length > 0 && (
          <div style={{ marginBottom: 8, padding: '6px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, fontSize: 12, color: '#389e0d' }}>
            최근 편집: {editLog[0]}
          </div>
        )}
        <div style={{ height: 560 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={columns}
            rowKey="id"
            rowHeight={46}
            pagination={false}
            scroll={{ x: 2400 }}
            onCellEdit={handleCellEdit}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
