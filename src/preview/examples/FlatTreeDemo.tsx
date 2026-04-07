import { useMemo, useState } from 'react'
import { DataGrid, type ColumnType } from '@/components/DataGrid'
import { DemoBlock } from '../components/DemoBlock'

/** depth 기반 플랫 트리 행 (전위 순회: 부모 다음에 자식 행) */
interface DepthTreeRecord {
  id: string
  depth: number
  name: string
  count?: number
}

const SAMPLE: DepthTreeRecord[] = [
  { id: '1', depth: 1, name: 'ROOT(상위부품)', count: 171 },
  { id: '2', depth: 2, name: 'root', count: 0 },
  { id: '3', depth: 3, name: '하위 1', count: 12 },
  { id: '4', depth: 3, name: '하위 2', count: 8 },
  { id: '5', depth: 2, name: '형제 그룹', count: 3 },
  { id: '6', depth: 1, name: '다른 루트', count: 99 },
]

function keysWithChildren(rows: DepthTreeRecord[], depthField: keyof DepthTreeRecord): string[] {
  const depthOf = (r: DepthTreeRecord) => Number(r[depthField] ?? 0)
  const out: string[] = []
  for (let i = 0; i < rows.length; i++) {
    if (i + 1 < rows.length && depthOf(rows[i + 1]) === depthOf(rows[i]) + 1) {
      out.push(rows[i].id)
    }
  }
  return out
}

const CODE = `// dataSource: depth 필드로 계층을 표현 (부모 행 직후에 자식 행)
const data = [
  { id: '1', depth: 1, name: 'ROOT' },
  { id: '2', depth: 2, name: 'child' },
]

<DataGrid
  rowKey="id"
  dataSource={data}
  columns={columns}
  expandable={{
    treeDataFromFlatList: { depthField: 'depth' },
    defaultExpandedRowKeys: ['1'],
    showTreeLines: true,
    indentSize: 18,
  }}
/>`

const columns: ColumnType<DepthTreeRecord>[] = [
  { key: 'no', title: 'No', width: 56, align: 'center', render: (_v, _r, i) => i + 1 },
  { key: 'name', title: '그룹번호', dataIndex: 'name', width: 260, align: 'left' },
  { key: 'count', title: '건수', dataIndex: 'count', width: 80, align: 'center' },
]

export function FlatTreeDemo() {
  const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>(() => keysWithChildren(SAMPLE, 'depth'))

  const defaultKeys = useMemo(() => keysWithChildren(SAMPLE, 'depth'), [])

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">플랫 트리 (depth + 접기/펼치기)</h1>
      <p className="demo-page__desc">
        <code>children</code> 배열 없이 <code>depth</code> 필드만으로 전위 순회 플랫 리스트를 트리로 표시합니다.
        다음 행의 depth가 현재보다 정확히 1 크면 직계 자식으로 해석합니다.{' '}
        <code>expandable.treeDataFromFlatList</code> · <code>showTreeLines</code> ·{' '}
        <code>expandedRowKeys</code> / <code>onExpandedRowsChange</code>로 폴딩을 제어합니다.
      </p>

      <DemoBlock
        title="depth 플랫 리스트 + 트리 가이드선"
        description="기본 확장 키는 자식이 있는 행 id 전체입니다. + / − 버튼으로 접었다 펼칩니다."
        code={CODE}
      >
        <p style={{ margin: '0 0 10px', fontSize: 13 }}>
          <button
            type="button"
            style={{ marginRight: 8, padding: '4px 10px', cursor: 'pointer' }}
            onClick={() => setExpandedKeys(defaultKeys)}
          >
            모두 펼치기
          </button>
          <button
            type="button"
            style={{ padding: '4px 10px', cursor: 'pointer' }}
            onClick={() => setExpandedKeys([])}
          >
            모두 접기
          </button>
        </p>
        <div style={{ height: 360 }}>
          <DataGrid<DepthTreeRecord>
            rowKey="id"
            dataSource={SAMPLE}
            columns={columns}
            scroll={{ x: 480 }}
            expandable={{
              treeDataFromFlatList: { depthField: 'depth' },
              expandedRowKeys: expandedKeys,
              onExpandedRowsChange: setExpandedKeys,
              showTreeLines: true,
              indentSize: 18,
            }}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
