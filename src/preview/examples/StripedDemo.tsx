import { useState, type CSSProperties } from 'react'
import { DataGrid, type ColumnType } from '@/components/DataGrid'
import { DemoBlock } from '@/preview/components/DemoBlock'
import { EMPLOYEE_DATA, type Employee } from '@/preview/mockData'

const columns: ColumnType<Employee>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
  { key: 'name', title: '이름', dataIndex: 'name', width: 100 },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 90 },
  { key: 'salary', title: '연봉(만)', dataIndex: 'salary', width: 100, align: 'right' },
]

const CODE = `// striped: true → 홀수 인덱스 행(0-based: 1,3,5…)에 줄무늬 배경
<DataGrid
  rowKey="id"
  dataSource={data}
  columns={columns}
  striped
/>

// 색상은 래퍼에서 CSS 변수로 조정
<div
  className="datagrid"
  style={{
    ['--grid-row-stripe-bg' as string]: '#e3f2fd',
    ['--grid-cell-bg' as string]: '#ffffff',
  }}
>
  <DataGrid ... striped />
</div>`

export function StripedDemo() {
  const [striped, setStriped] = useState(true)

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">줄무늬 (Zebra striping)</h1>
      <p className="demo-page__desc">
        <code>striped</code> prop으로 홀수 인덱스 행 배경을 바꿀 수 있습니다. 색은{' '}
        <code>--grid-row-stripe-bg</code> · <code>--grid-cell-bg</code> 변수로 덮어씁니다.
      </p>

      <DemoBlock
        title="striped 토글"
        description="체크박스로 줄무늬 적용 여부를 전환해 보세요."
        code={CODE}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14 }}>
          <input type="checkbox" checked={striped} onChange={(e) => setStriped(e.target.checked)} />
          striped 적용
        </label>
        <div style={{ height: 400 }}>
          <DataGrid<Employee>
            rowKey="id"
            dataSource={EMPLOYEE_DATA.slice(0, 80)}
            columns={columns}
            striped={striped}
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="커스텀 줄무늬 색"
        description="래퍼 div에 CSS 변수를 지정한 예시입니다."
        code={`style={{
  ['--grid-row-stripe-bg' as string]: '#fff9c4',
  ['--grid-row-hover-bg' as string]: '#fdf8e4',
}}`}
      >
        <div
          style={
            {
              height: 320,
              ['--grid-row-stripe-bg' as string]: '#e3f2fd',
              ['--grid-cell-bg' as string]: '#fffef7',
              ['--grid-row-hover-bg' as string]: '#fdf8e4',
            } as CSSProperties
          }
        >
          <DataGrid<Employee>
            rowKey="id"
            dataSource={EMPLOYEE_DATA.slice(0, 40)}
            columns={columns}
            striped
            pagination={{ pageSize: 10 }}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
