import { useMemo, useState } from 'react'
import {
  DataGrid,
  TableSummary,
  type ColumnType,
  type SorterResult,
  type TableFilters,
} from '@/components/DataGrid'
import { DemoBlock } from '@/preview/components/DemoBlock'

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

/** 정렬 + 필터 동시 데모용 (역할·도시 다양화) */
const sortFilterDemoRows: Row[] = [
  ...baseRows,
  {
    id: '4',
    name: '최지훈',
    role: 'dev',
    address: { city: '대전', zip: '34000' },
    amount: 150,
  },
  {
    id: '5',
    name: '정수진',
    role: 'design',
    address: { city: '서울', zip: '04500' },
    amount: 310,
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

const CODE_SORT_AND_FILTER = `// 같은 테이블에서 필터 + 정렬 (다중 정렬은 sorter.multiple 로 우선순위)
columns={[
  {
    key: 'name',
    filterMode: 'text',
    onTextFilter: (q, r) => r.name.toLowerCase().includes(q.toLowerCase()),
    sorter: { compare: (a, b) => a.name.localeCompare(b.name, 'ko'), multiple: 2 },
  },
  {
    key: 'role',
    filters: [{ text: '개발', value: 'dev' }, ...],
    onFilter: (v, r) => r.role === v,
    filterMultiple: true,
  },
  {
    key: 'amount',
    sorter: { compare: (a, b) => a.amount - b.amount, multiple: 1 },
    defaultSortOrder: 'descend',
  },
]}
// onChange(pagination, filters, sorter, extra) 로 둘 다 추적 가능`

const CODE_TEXT_FILTER = `// filters 없이 텍스트만으로 필터 (filterMode: 'text' + onTextFilter)
{
  key: 'city',
  title: '도시',
  dataIndex: ['address', 'city'],
  filterMode: 'text',
  filterPlaceholder: '도시명 입력',
  onTextFilter: (q, record) =>
    record.address.city.toLowerCase().includes(q.trim().toLowerCase()),
}`

const CODE_FILTER = `// filters, defaultFilteredValue, defaultSortOrder, title/footer, onChange(filters), summary
<DataGrid<Row>
  columns={filterColumns}
  title={() => <strong>상단 제목</strong>}
  footer={(rows) => <span>현재 {rows.length}행</span>}
  onChange={(_, filters) => setFilterLog(JSON.stringify(filters))}
  summary={(pageData) => (
    <TableSummary.Row>
      <TableSummary.Cell colSpan={3}>합계</TableSummary.Cell>
      <TableSummary.Cell index={4} align="right">{pageData.reduce(...)}</TableSummary.Cell>
    </TableSummary.Row>
  )}
  summaryFixed="bottom"
/>`

const CODE_EXPAND = `expandable={{
  expandedRowKeys: expandKeys,
  onExpandedRowsChange: setExpandKeys,
  expandedRowRender: (record) => (
    <div>확장: {record.name}</div>
  ),
}}`

const CODE_TREE = `expandable={{
  defaultExpandedRowKeys: ['p1'],
  childrenColumnName: 'children',
  indentSize: 20,
}}`

const CODE_HIDDEN = `// hidden: true → 컬럼 미표시
// responsive: ['xl','xxl'] → 해당 브레이크포인트에서만 표시
{ key: 'wideOnly', title: 'xl 이상만', responsive: ['xl', 'xxl'] }`

const CODE_COLSPAN = `render: (v, _r, rowIndex) =>
  rowIndex === 0
    ? { children: <em>병합</em>, props: { colSpan: 2 } }
    : { children: v as string }`

const CODE_TABLE_LAYOUT = `<DataGrid
  tableLayout="auto"
  showHeader={false}
  columns={[...]}
/>`

export function AntdFeaturesDemo() {
  const [filterLog, setFilterLog] = useState<string>('—')
  const [sortFilterLog, setSortFilterLog] = useState<string>('—')
  const [expandKeys, setExpandKeys] = useState<(string | number)[]>(['1'])

  const sortFilterColumns = useMemo(
    (): ColumnType<Row>[] => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 72 },
      {
        key: 'name',
        title: '이름 (텍스트 필터 + 정렬)',
        dataIndex: 'name',
        width: 200,
        filterMode: 'text',
        filterPlaceholder: '이름 일부 입력',
        onTextFilter: (q, record) => record.name.toLowerCase().includes(q.trim().toLowerCase()),
        sorter: { compare: (a, b) => a.name.localeCompare(b.name, 'ko'), multiple: 2 },
        showSorterTooltip: true,
      },
      {
        key: 'role',
        title: '역할 (옵션 필터)',
        dataIndex: 'role',
        width: 140,
        filters: [
          { text: '개발', value: 'dev' },
          { text: '디자인', value: 'design' },
        ],
        filterMultiple: true,
        onFilter: (value, record) => record.role === value,
      },
      {
        key: 'city',
        title: '도시',
        dataIndex: ['address', 'city'],
        width: 100,
      },
      {
        key: 'amount',
        title: '금액 (정렬, multiple: 1)',
        dataIndex: 'amount',
        width: 120,
        align: 'right',
        sorter: { compare: (a, b) => a.amount - b.amount, multiple: 1 },
        defaultSortOrder: 'descend',
        showSorterTooltip: true,
      },
    ],
    [],
  )

  const textFilterColumns = useMemo(
    (): ColumnType<Row>[] => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 72 },
      { key: 'name', title: '이름', dataIndex: 'name', width: 120 },
      {
        key: 'role',
        title: '역할',
        dataIndex: 'role',
        width: 100,
      },
      {
        key: 'city',
        title: '도시 (텍스트 필터)',
        dataIndex: ['address', 'city'],
        width: 160,
        filterMode: 'text',
        filterPlaceholder: '도시명 입력 (부분 일치)',
        onTextFilter: (q, record) =>
          record.address.city.toLowerCase().includes(q.trim().toLowerCase()),
      },
      {
        key: 'amount',
        title: '금액',
        dataIndex: 'amount',
        width: 90,
        align: 'right',
      },
    ],
    [],
  )

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
        필터·정렬(다중)·정렬+필터 동시 사용·제목/푸터·합계·확장 행·트리·중첩 dataIndex·hidden/responsive·onChange(filters)·colSpan
        등 TODO에 정리된 API를 한 화면에서 확인합니다.
      </p>

      <DemoBlock
        title="텍스트 검색 필터 (filterMode: 'text')"
        description={
          '`filters`·`onFilter` 없이 `filterMode: "text"`와 `onTextFilter`만으로 헤더 ▾에서 문자열 검색 필터를 씁니다. `filteredValue`의 첫 항목이 검색어로 저장됩니다.'
        }
        code={CODE_TEXT_FILTER}
      >
        <div style={{ height: 300 }}>
          <DataGrid<Row>
            rowKey="id"
            dataSource={baseRows}
            columns={textFilterColumns}
            scroll={{ x: 700 }}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="정렬 + 필터 함께 사용"
        description={
          '먼저 필터로 행을 줄인 뒤, 남은 데이터에 정렬이 적용됩니다. 이름은 텍스트 필터와 정렬을 동시에, 역할은 옵션 필터, 금액은 기본 내림차순 정렬(multiple: 1)입니다. 금액·이름 헤더를 각각 누르면 다중 정렬이 동작합니다.'
        }
        code={CODE_SORT_AND_FILTER}
      >
        <div style={{ height: 340 }}>
          <DataGrid<Row>
            rowKey="id"
            dataSource={sortFilterDemoRows}
            columns={sortFilterColumns}
            scroll={{ x: 820 }}
            onChange={(_pagination, filters: TableFilters, sorter: SorterResult<Row> | SorterResult<Row>[]) => {
              const list = Array.isArray(sorter) ? sorter : [sorter]
              setSortFilterLog(
                JSON.stringify(
                  {
                    filters,
                    sorter: list.map((s) => ({
                      columnKey: s.columnKey,
                      order: s.order,
                      field: s.field,
                    })),
                  },
                  null,
                  0,
                ),
              )
            }}
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
          {sortFilterLog}
        </pre>
      </DemoBlock>

      <DemoBlock
        title="필터 + defaultSortOrder + onChange(filters)"
        description={
          "역할 컬럼은 defaultFilteredValue: ['dev'] 로 초기 필터가 걸려 있습니다. 헤더 ▾로 필터를 바꾸면 로그가 갱신됩니다."
        }
        code={CODE_FILTER}
      >
        <div style={{ height: 360 }}>
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
      </DemoBlock>

      <DemoBlock title="행 확장 (expandedRowRender)" code={CODE_EXPAND}>
        <div style={{ height: 320 }}>
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
      </DemoBlock>

      <DemoBlock title="트리 (childrenColumnName)" code={CODE_TREE}>
        <div style={{ height: 280 }}>
          <DataGrid<TreeRow>
            rowKey="id"
            dataSource={treeData}
            columns={[{ key: 'title', title: '이름', dataIndex: 'title', width: 280 }]}
            expandable={{
              defaultExpandedRowKeys: ['p1'],
              childrenColumnName: 'children',
              indentSize: 20,
            }}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="hidden / responsive"
        description='브라우저 너비를 줄이면 "xl 이상만" 컬럼이 사라집니다. 숨김 컬럼은 DOM에 나오지 않습니다.'
        code={CODE_HIDDEN}
      >
        <div style={{ height: 260 }}>
          <DataGrid<Row>
            rowKey="id"
            dataSource={baseRows}
            columns={hiddenColumns}
            scroll={{ x: 700 }}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="render → { children, props: { colSpan } }"
        code={CODE_COLSPAN}
      >
        <div style={{ height: 220 }}>
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
      </DemoBlock>

      <DemoBlock title="tableLayout + showHeader" code={CODE_TABLE_LAYOUT}>
        <div style={{ height: 200 }}>
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
      </DemoBlock>
    </div>
  )
}
