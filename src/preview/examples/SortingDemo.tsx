import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

const columns: ColumnType<Employee>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 70 },
  { key: 'name', title: '이름', dataIndex: 'name', width: 100, sorter: true },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 90, sorter: true },
  { key: 'team', title: '팀', dataIndex: 'team', width: 90, sorter: true },
  { key: 'position', title: '직급', dataIndex: 'position', width: 90, sorter: true },
  { key: 'level', title: '레벨', dataIndex: 'level', width: 100, sorter: true },
  {
    key: 'salary',
    title: '연봉(만)',
    dataIndex: 'salary',
    width: 110,
    align: 'right',
    sorter: (a, b) => a.salary - b.salary,
  },
  {
    key: 'bonus',
    title: '보너스',
    dataIndex: 'bonus',
    width: 100,
    align: 'right',
    sorter: (a, b) => a.bonus - b.bonus,
  },
  { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center', sorter: (a, b) => a.age - b.age },
  { key: 'city', title: '도시', dataIndex: 'city', width: 90, sorter: true },
  { key: 'joinDate', title: '입사일', dataIndex: 'joinDate', width: 110, sorter: true },
  { key: 'status', title: '상태', dataIndex: 'status', width: 80, sorter: true },
  { key: 'score', title: '점수', dataIndex: 'score', width: 80, align: 'center', sorter: (a, b) => a.score - b.score },
  { key: 'grade', title: '등급', dataIndex: 'grade', width: 70, align: 'center', sorter: true },
  { key: 'manager', title: '매니저', dataIndex: 'manager', width: 100, sorter: true },
  { key: 'project', title: '프로젝트', dataIndex: 'project', width: 110, sorter: true },
  {
    key: 'budget',
    title: '예산(만)',
    dataIndex: 'budget',
    width: 110,
    align: 'right',
    sorter: (a, b) => a.budget - b.budget,
  },
  {
    key: 'revenue',
    title: '매출(만)',
    dataIndex: 'revenue',
    width: 110,
    align: 'right',
    sorter: (a, b) => a.revenue - b.revenue,
  },
  { key: 'cost', title: '비용(만)', dataIndex: 'cost', width: 110, align: 'right', sorter: (a, b) => a.cost - b.cost },
  {
    key: 'profitRate',
    title: '수익률(%)',
    dataIndex: 'profitRate',
    width: 110,
    align: 'right',
    sorter: (a, b) => a.profitRate - b.profitRate,
  },
]

const CODE = `// sorter: true → 문자열 기본 정렬
// sorter: (a, b) => a.salary - b.salary → 숫자 커스텀 정렬
const columns: ColumnType<Employee>[] = [
  { key: 'salary', title: '연봉(만)', dataIndex: 'salary',
    sorter: (a, b) => a.salary - b.salary },
  { key: 'dept',   title: '부서',     dataIndex: 'dept',
    sorter: true },
  // ...
]

<DataGrid dataSource={EMPLOYEE_DATA} columns={columns} rowKey="id" />`

export function SortingDemo() {
  return (
    <div className="demo-page">
      <h1 className="demo-page__title">정렬 (Sorting)</h1>
      <p className="demo-page__desc">
        10,000건 × 20컬럼 데이터를 헤더 클릭으로 정렬합니다. 오름차순 → 내림차순 → 해제 순서로 전환됩니다.
      </p>

      <DemoBlock
        title="컬럼 정렬 (10,000건 × 20컬럼)"
        description="숫자형 컬럼은 커스텀 비교함수, 문자형은 sorter: true를 사용합니다"
        code={CODE}
      >
        <div style={{ height: 520 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
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
