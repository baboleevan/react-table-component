import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

const columns: ColumnType<Employee>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 70 },
  { key: 'name', title: '이름', dataIndex: 'name', width: 100 },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 90 },
  { key: 'team', title: '팀', dataIndex: 'team', width: 90 },
  { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
  { key: 'level', title: '레벨', dataIndex: 'level', width: 100 },
  { key: 'salary', title: '연봉(만)', dataIndex: 'salary', width: 110, align: 'right' },
  { key: 'bonus', title: '보너스', dataIndex: 'bonus', width: 100, align: 'right' },
  { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center' },
  { key: 'city', title: '도시', dataIndex: 'city', width: 90 },
  { key: 'joinDate', title: '입사일', dataIndex: 'joinDate', width: 110 },
  { key: 'contractType', title: '고용형태', dataIndex: 'contractType', width: 100 },
  { key: 'status', title: '상태', dataIndex: 'status', width: 80 },
  { key: 'score', title: '점수', dataIndex: 'score', width: 80, align: 'center' },
  { key: 'grade', title: '등급', dataIndex: 'grade', width: 70, align: 'center' },
  { key: 'manager', title: '매니저', dataIndex: 'manager', width: 100 },
  { key: 'project', title: '프로젝트', dataIndex: 'project', width: 110 },
  { key: 'budget', title: '예산(만)', dataIndex: 'budget', width: 110, align: 'right' },
  { key: 'revenue', title: '매출(만)', dataIndex: 'revenue', width: 110, align: 'right' },
  { key: 'profitRate', title: '수익률(%)', dataIndex: 'profitRate', width: 110, align: 'right' },
]

const CODE = `const [page, setPage] = useState(1)
const [pageSize, setPageSize] = useState(50)

<DataGrid
  dataSource={EMPLOYEE_DATA}   // 10,000건
  columns={columns}            // 20개 컬럼
  rowKey="id"
  pagination={{
    current: page,
    pageSize,
    total: EMPLOYEE_DATA.length,
    showSizeChanger: true,
    pageSizeOptions: [50, 100, 200],
    showTotal: (total, [s, e]) => \`\${s}-\${e} / 총 \${total}건\`,
    onChange: (p, ps) => { setPage(p); setPageSize(ps) },
  }}
/>`

export function PaginationDemo() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">페이지네이션</h1>
      <p className="demo-page__desc">
        10,000건 데이터를 페이지 단위로 나눠 표시합니다. 처음/이전/다음/마지막 버튼으로 이동합니다.
      </p>

      <DemoBlock
        title="클라이언트 페이지네이션 (10,000건 × 20컬럼)"
        description="페이지 이동마다 가상화가 리셋되어 즉시 렌더링됩니다"
        code={CODE}
      >
        <div style={{ height: 520 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total: EMPLOYEE_DATA.length,
              showSizeChanger: true,
              pageSizeOptions: [50, 100, 200],
              showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              },
            }}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
