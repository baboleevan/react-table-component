import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

const columns: ColumnType<Employee>[] = [
  { key: 'id',           title: 'ID',       dataIndex: 'id',           width: 70,  fixed: 'left' },
  { key: 'name',         title: '이름',     dataIndex: 'name',         width: 100, fixed: 'left' },
  { key: 'email',        title: '이메일',   dataIndex: 'email',        width: 200, ellipsis: true },
  { key: 'phone',        title: '연락처',   dataIndex: 'phone',        width: 150 },
  { key: 'dept',         title: '부서',     dataIndex: 'dept',         width: 90 },
  { key: 'team',         title: '팀',       dataIndex: 'team',         width: 90 },
  { key: 'position',     title: '직급',     dataIndex: 'position',     width: 90 },
  { key: 'level',        title: '레벨',     dataIndex: 'level',        width: 100 },
  { key: 'salary',       title: '연봉(만)', dataIndex: 'salary',       width: 110, align: 'right' },
  { key: 'bonus',        title: '보너스',   dataIndex: 'bonus',        width: 100, align: 'right' },
  { key: 'age',          title: '나이',     dataIndex: 'age',          width: 70,  align: 'center' },
  { key: 'gender',       title: '성별',     dataIndex: 'gender',       width: 70,  align: 'center' },
  { key: 'city',         title: '도시',     dataIndex: 'city',         width: 90 },
  { key: 'country',      title: '국가',     dataIndex: 'country',      width: 100 },
  { key: 'joinDate',     title: '입사일',   dataIndex: 'joinDate',     width: 110 },
  { key: 'contractType', title: '고용형태', dataIndex: 'contractType', width: 100 },
  { key: 'status',       title: '상태',     dataIndex: 'status',       width: 80,
    render: (v) => {
      const colors: Record<string, string> = { 재직: '#52c41a', 휴직: '#faad14', 수습: '#1677ff', 파견: '#722ed1' }
      return <span style={{ color: colors[v as string] ?? '#000', fontWeight: 500 }}>{v as string}</span>
    },
  },
  { key: 'score',        title: '점수',     dataIndex: 'score',        width: 80,  align: 'center' },
  { key: 'grade',        title: '등급',     dataIndex: 'grade',        width: 70,  align: 'center' },
  { key: 'manager',      title: '매니저',   dataIndex: 'manager',      width: 100 },
  { key: 'project',      title: '프로젝트', dataIndex: 'project',      width: 110 },
  { key: 'budget',       title: '예산(만)', dataIndex: 'budget',       width: 110, align: 'right' },
  { key: 'revenue',      title: '매출(만)', dataIndex: 'revenue',      width: 110, align: 'right' },
  { key: 'cost',         title: '비용(만)', dataIndex: 'cost',         width: 110, align: 'right' },
  { key: 'profitRate',   title: '수익률(%)', dataIndex: 'profitRate',  width: 110, align: 'right' },
  { key: 'memo',         title: '메모',     dataIndex: 'memo',         width: 150, ellipsis: true, fixed: 'right' },
]

const CODE = `import { EMPLOYEE_DATA } from '../mockData' // 10,000건 × 26컬럼

<DataGrid<Employee>
  dataSource={EMPLOYEE_DATA}
  columns={columns}           // 26개 컬럼
  rowKey="id"
  scroll={{ x: 2600 }}
  pagination={{
    pageSize: 50,
    showSizeChanger: true,
    showTotal: (total, [s, e]) => \`\${s}-\${e} / \${total}건\`,
  }}
/>`

export function BasicDemo() {
  return (
    <div className="demo-page">
      <h1 className="demo-page__title">기본 사용법</h1>
      <p className="demo-page__desc">
        26개 컬럼 × 10,000건 데이터. 행 가상화가 자동 적용되어 스크롤이 부드럽습니다.
      </p>

      <DemoBlock
        title="기본 테이블 (26컬럼 × 10,000행)"
        description="가상화 자동 활성화 — DOM에는 보이는 행만 렌더링됩니다"
        code={CODE}
      >
        <div style={{ height: 900 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            scroll={{ x: 2600 }}
            pagination={{
              pageSize: 20,
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
