import { useMemo, useState } from 'react'
import { DataGrid, TableSummary, type ColumnType, type TableFilters } from '@/components/DataGrid'

interface Row {
  id: string
  name: string
  role: string
  address: { city: string; zip: string }
  amount: number
}

const baseRows: Row[] = [
  {
    id: '1',
    name: '김철수',
    role: 'dev',
    address: { city: '서울', zip: '06000' },
    amount: 120,
  },
  {
    id: '2',
    name: '이영희',
    role: 'design',
    address: { city: '부산', zip: '48000' },
    amount: 200,
  },
  {
    id: '3',
    name: '박민수',
    role: 'dev',
    address: { city: '서울', zip: '03100' },
    amount: 90,
  },
]

interface TreeRow {
  id: string
  title: string
  children?: TreeRow[]
}

const treeData: TreeRow[] = [
  {
    id: 'p1',
    title: '프로젝트 A',
    children: [
      { id: 'c1', title: '태스크 A-1' },
      { id: 'c2', title: '태스크 A-2' },
    ],
  },
  { id: 'p2', title: '프로젝트 B (자식 없음)' },
]

export function AntdFeaturesDemo() {
  const [filterLog, setFilterLog] = useState<string>('—')
  const [expandKeys, setExpandKeys] = useState<(string | number)[]>(['1'])

  const filterColumns = useMemo(
    (): ColumnType<Row>[] => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 72 },
      {
        key: 'name',
        title: '이름',
        dataIndex: 'name',
        width: 120,
        filters: [
          { text: '김', value: 'kim' },
          { text: '이', value: 'lee' },
        ],
        filterMultiple: true,
        filterSearch: true,
        onFilter: (value, record) => {
          if (value === 'kim') return record.name.startsWith('김')
          if (value === 'lee') return record.name.startsWith('이')
          return false
        },
      },
      {
        key: 'role',
        title: '역할',
        dataIndex: 'role',
        width: 100,
        filters: [
          { text: '개발', value: 'dev' },
          { text: '디자인', value: 'design' },
        ],
        onFilter: (value, record) => record.role === value,
        defaultFilteredValue: ['dev'],
      },
      {
        key: 'city',
        title: '도시 (중첩 dataIndex)',
        dataIndex: ['address', 'city'],
        width: 120,
      },
      {
        key: 'amount',
        title: '금액',
        dataIndex: 'amount',
        width: 90,
        align: 'right',
        sorter: { compare: (a, b) => a.amount - b.amount, multiple: 1 },
        defaultSortOrder: 'descend',
        showSorterTooltip: true,
      },
    ],
    [],
  )

  const hiddenColumns = useMemo(
    (): ColumnType<Row>[] => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 70 },
      { key: 'name', title: '이름', dataIndex: 'name', width: 120 },
      {
        key: 'secret',
        title: '숨김 컬럼',
        dataIndex: 'role',
        width: 100,
        hidden: true,
      },
      {
        key: 'wideOnly',
        title: 'xl 이상만',
        dataIndex: 'amount',
        width: 90,
        responsive: ['xl', 'xxl'],
      },
    ],
    [],
  )

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">Ant Design Table 호환 기능</h1>
      <p className="demo-page__desc">
        필터·정렬(다중)·제목/푸터·합계·확장 행·트리·중첩 dataIndex·hidden/responsive·onChange(filters)·colSpan
        등 TODO에 정리된 API를 한 화면에서 확인합니다.
      </p>

      <section className="demo-block" style={{ marginBottom: 28 }}>
        <h2 className="demo-block__title">필터 + defaultSortOrder + onChange(filters)</h2>
        <p className="demo-block__desc">
          역할 컬럼은 <code>defaultFilteredValue: [&apos;dev&apos;]</code> 로 초기 필터가 걸려 있습니다. 헤더 ▾로
          필터를 바꾸면 로그가 갱신됩니다.
        </p>
        <div className="demo-block__body" style={{ height: 360 }}>
          <DataGrid<Row>
            rowKey="id"
            dataSource={baseRows}
            columns={filterColumns}
            scroll={{ x: 900 }}
            title={() => <strong>상단 제목 (title prop)</strong>}
            footer={(rows) => <span>하단 푸터 — 현재 페이지 {rows.length}행</span>}
            onChange={(_pag, filters: TableFilters) => {
              setFilterLog(JSON.stringify(filters, null, 0))
            }}
            summary={(pageData) => (
              <TableSummary.Row>
                <TableSummary.Cell colSpan={3} index={0}>
                  합계
                </TableSummary.Cell>
                <TableSummary.Cell index={3} />
                <TableSummary.Cell index={4} align="right">
                  {pageData.reduce((s, r) => s + r.amount, 0).toLocaleString()}
                </TableSummary.Cell>
              </TableSummary.Row>
            )}
            summaryFixed="bottom"
          />
        </div>
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: '#f6f7f9',
            fontSize: 12,
            overflow: 'auto',
          }}
        >
          filters: {filterLog}
        </pre>
      </section>

      <section className="demo-block" style={{ marginBottom: 28 }}>
        <h2 className="demo-block__title">행 확장 (expandedRowRender)</h2>
        <div className="demo-block__body" style={{ height: 320 }}>
          <DataGrid<Row>
            rowKey="id"
            dataSource={baseRows}
            columns={[
              { key: 'id', title: 'ID', dataIndex: 'id', width: 72 },
              { key: 'name', title: '이름', dataIndex: 'name', width: 140 },
              { key: 'role', title: '역할', dataIndex: 'role', width: 100 },
            ]}
            expandable={{
              expandedRowKeys: expandKeys,
              onExpandedRowsChange: setExpandKeys,
              expandedRowRender: (record) => (
                <div style={{ padding: '8px 0' }}>
                  확장 영역: <strong>{record.name}</strong> / {record.address.city} ({record.address.zip})
                </div>
              ),
            }}
          />
        </div>
      </section>

      <section className="demo-block" style={{ marginBottom: 28 }}>
        <h2 className="demo-block__title">트리 (childrenColumnName)</h2>
        <div className="demo-block__body" style={{ height: 280 }}>
          <DataGrid<TreeRow>
            rowKey="id"
            dataSource={treeData}
            columns={[
              { key: 'title', title: '이름', dataIndex: 'title', width: 280 },
            ]}
            expandable={{
              defaultExpandedRowKeys: ['p1'],
              childrenColumnName: 'children',
              indentSize: 20,
            }}
          />
        </div>
      </section>

      <section className="demo-block" style={{ marginBottom: 28 }}>
        <h2 className="demo-block__title">hidden / responsive</h2>
        <p className="demo-block__desc">
          브라우저 너비를 줄이면 &quot;xl 이상만&quot; 컬럼이 사라집니다. 숨김 컬럼은 DOM에 나오지 않습니다.
        </p>
        <div className="demo-block__body" style={{ height: 260 }}>
          <DataGrid<Row>
            rowKey="id"
            dataSource={baseRows}
            columns={hiddenColumns}
            scroll={{ x: 700 }}
          />
        </div>
      </section>

      <section className="demo-block" style={{ marginBottom: 28 }}>
        <h2 className="demo-block__title">render → `&#123; children, props: &#123; colSpan &#125; &#125;`</h2>
        <div className="demo-block__body" style={{ height: 220 }}>
          <DataGrid<{ id: string; a: string; b: string }>
            rowKey="id"
            dataSource={[
              { id: '1', a: 'A1', b: 'B1' },
              { id: '2', a: 'A2', b: 'B2' },
            ]}
            columns={[
              {
                key: 'a',
                title: '열 A',
                dataIndex: 'a',
                width: 120,
                render: (v, _r, rowIndex) =>
                  rowIndex === 0 ? { children: v as string, props: { colSpan: 0 } } : { children: v as string },
              },
              {
                key: 'b',
                title: '열 B',
                dataIndex: 'b',
                width: 160,
                render: (v, _r, rowIndex) =>
                  rowIndex === 0
                    ? { children: <em>첫 행: A+B 병합 셀</em>, props: { colSpan: 2 } }
                    : { children: v as string },
              },
            ]}
          />
        </div>
      </section>

      <section className="demo-block">
        <h2 className="demo-block__title">tableLayout + showHeader</h2>
        <div className="demo-block__body" style={{ height: 200 }}>
          <DataGrid<Row>
            rowKey="id"
            dataSource={baseRows.slice(0, 2)}
            tableLayout="auto"
            showHeader={false}
            columns={[
              { key: 'name', title: '이름', dataIndex: 'name' },
              { key: 'amount', title: '금액', dataIndex: 'amount' },
            ]}
          />
        </div>
      </section>
    </div>
  )
}
