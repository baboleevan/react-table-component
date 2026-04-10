import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '@/preview/mockData'
import { DemoBlock } from '@/preview/components/DemoBlock'

const columns: ColumnType<Employee>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 70, fixed: 'left' },
  { key: 'name', title: '이름', dataIndex: 'name', width: 100, fixed: 'left' },
  { key: 'email', title: '이메일', dataIndex: 'email', width: 200, ellipsis: true },
  { key: 'phone', title: '연락처', dataIndex: 'phone', width: 150 },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 90 },
  { key: 'team', title: '팀', dataIndex: 'team', width: 90 },
  { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
  { key: 'level', title: '레벨', dataIndex: 'level', width: 100 },
  { key: 'salary', title: '연봉(만)', dataIndex: 'salary', width: 110, align: 'right' },
  { key: 'bonus', title: '보너스', dataIndex: 'bonus', width: 100, align: 'right' },
  { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center' },
  { key: 'gender', title: '성별', dataIndex: 'gender', width: 70, align: 'center' },
  { key: 'city', title: '도시', dataIndex: 'city', width: 90 },
  { key: 'joinDate', title: '입사일', dataIndex: 'joinDate', width: 110 },
  { key: 'contractType', title: '고용형태', dataIndex: 'contractType', width: 100 },
  { key: 'score', title: '점수', dataIndex: 'score', width: 80, align: 'center' },
  { key: 'grade', title: '등급', dataIndex: 'grade', width: 70, align: 'center' },
  { key: 'project', title: '프로젝트', dataIndex: 'project', width: 110 },
  { key: 'budget', title: '예산(만)', dataIndex: 'budget', width: 110, align: 'right' },
  { key: 'profitRate', title: '수익률(%)', dataIndex: 'profitRate', width: 110, align: 'right' },
  {
    key: 'status',
    title: '상태',
    dataIndex: 'status',
    width: 80,
    fixed: 'right',
    render: (v) => {
      const colors: Record<string, string> = { 재직: '#52c41a', 휴직: '#faad14', 수습: '#1677ff', 파견: '#722ed1' }
      return <span style={{ color: colors[v as string] ?? '#000', fontWeight: 500 }}>{v as string}</span>
    },
  },
  { key: 'memo', title: '메모', dataIndex: 'memo', width: 150, ellipsis: true, fixed: 'right' },
]

const CODE = `const columns: ColumnType<Employee>[] = [
  { key: 'id',     title: 'ID',   dataIndex: 'id',     width: 70,  fixed: 'left' },
  { key: 'name',   title: '이름', dataIndex: 'name',   width: 100, fixed: 'left' },
  // ... 18개 중간 컬럼 ...
  { key: 'status', title: '상태', dataIndex: 'status', width: 80,  fixed: 'right' },
  { key: 'memo',   title: '메모', dataIndex: 'memo',   width: 150, fixed: 'right' },
]

<DataGrid
  dataSource={EMPLOYEE_DATA}   // 10,000건
  columns={columns}            // 22컬럼 (좌 2 고정, 우 2 고정)
  rowKey="id"
  scroll={{ x: 2400 }}
/>`

export function FixedColumnsDemo() {
  return (
    <div className="demo-page">
      <h1 className="demo-page__title">고정 컬럼 (Fixed Columns)</h1>
      <p className="demo-page__desc">
        10,000건 × 22컬럼. ID·이름은 좌측 고정, 상태·메모는 우측 고정으로 가로 스크롤 시에도 항상 표시됩니다.
      </p>

      <DemoBlock
        title="좌우 고정 컬럼 (10,000건 × 22컬럼)"
        description="좌 2개(ID·이름) / 우 2개(상태·메모) 고정. 가로 스크롤로 확인하세요."
        code={CODE}
      >
        <div style={{ height: 520 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            scroll={{ x: 2400 }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: [50, 100, 200],
              showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
            }}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
