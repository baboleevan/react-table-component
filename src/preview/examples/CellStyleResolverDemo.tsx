import { useRef, useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType, DataGridHandle, DataGridRowStyleMap } from '@/components/DataGrid'
import { DemoBlock } from '@/preview/components/DemoBlock'
import { EMPLOYEE_DATA, type Employee } from '@/preview/mockData'

const columns: ColumnType<Employee>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 72, align: 'right' },
  { key: 'name', title: '이름', dataIndex: 'name', width: 120 },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 100 },
  { key: 'status', title: '상태', dataIndex: 'status', width: 90, align: 'center' },
  { key: 'score', title: '점수', dataIndex: 'score', width: 90, align: 'right' },
  { key: 'grade', title: '등급', dataIndex: 'grade', width: 90, align: 'center' },
]

const DECLARATIVE_CODE = `const [rowStyleMap, setRowStyleMap] = useState<DataGridRowStyleMap>({
  '10': {
    row: { style: { backgroundColor: '#fff7d6' } }, // 10번 행 전체 셀
    cells: {
      name: { style: { color: '#8a5a00', fontWeight: 700 } }, // name 컬럼만 덮어쓰기
    },
  },
})

<DataGrid<Employee>
  rowKey="id"
  columns={columns}
  dataSource={EMPLOYEE_DATA.slice(0, 120)}
  rowStyleMap={rowStyleMap}
/>`

const IMPERATIVE_CODE = `const gridRef = useRef<DataGridHandle<Employee>>(null)

// 특정 셀 변경
gridRef.current?.setCellStyle(12, 'score', {
  style: { backgroundColor: '#ffccc7', color: '#a8071a', fontWeight: 700 },
})

// 특정 행 전체 셀 변경
gridRef.current?.setRowStyle(15, {
  style: { backgroundColor: '#e6f4ff', color: '#0958d9' },
})

// 여러 행·열 한 번에 (columnKeys: '*' → 모든 데이터 컬럼)
gridRef.current?.setRangeStyle({
  rowKeys: [20, 21],
  columnKeys: '*',
  config: { tone: 'info' },
})

// 직전 명령형 변경 취소 / 다시 적용
gridRef.current?.undoStyles()
gridRef.current?.redoStyles()

// 가상 스크롤 시 해당 행으로 스크롤
gridRef.current?.scrollToRowKey(50)`

export function CellStyleResolverDemo() {
  const gridRef = useRef<DataGridHandle<Employee>>(null)
  const [rowStyleMap, setRowStyleMap] = useState<DataGridRowStyleMap>({
    '10': {
      row: { style: { backgroundColor: '#fff7d6' } },
      cells: { name: { style: { color: '#8a5a00', fontWeight: 700 } } },
    },
    '18': {
      cells: { status: { tone: 'error', style: { fontWeight: 600 } } },
    },
  })

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">셀 단위 스타일 제어 (rowStyleMap + gridRef API)</h1>
      <p className="demo-page__desc">
        선언형(`rowStyleMap`)으로 row 전체 또는 특정 column만 지정할 수 있고, 필요하면 `gridRef`로 런타임에
        변경할 수 있습니다. 인라인 스타일 병합 순서(낮음→높음)는{' '}
        <code>cellStyleResolver</code> → 컬럼 <code>onCell</code> → <code>rowStyleMap</code> → 명령형 API입니다.
        <code>printBackground</code>로 인쇄 시 배경색 유지를 켤 수 있습니다.
      </p>

      <DemoBlock
        title="선언형 스타일 제어 (권장)"
        description="부모 상태로 제어하며 row 전체 + 특정 column 스타일을 함께 지정합니다."
        code={DECLARATIVE_CODE}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() =>
              setRowStyleMap((prev) => ({
                ...prev,
                '10': {
                  row: { style: { backgroundColor: '#fff7d6' } },
                  cells: { name: { style: { color: '#8a5a00', fontWeight: 700 } } },
                },
              }))
            }
          >
            10번 행 강조
          </button>
          <button type="button" onClick={() => setRowStyleMap({})}>
            선언형 스타일 초기화
          </button>
        </div>
        <div style={{ height: 420, marginBottom: 20 }}>
          <DataGrid<Employee>
            gridRef={gridRef}
            rowKey="id"
            columns={columns}
            printBackground
            persistColumnWidthsKey="preview-cell-style-grid"
            dataSource={EMPLOYEE_DATA.slice(0, 120)}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: [20, 40, 80],
              showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
            }}
            rowStyleMap={rowStyleMap}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="명령형 스타일 제어 (옵션)"
        description="외부 이벤트로 즉시 셀/행 스타일을 바꾸고 싶을 때 gridRef 메서드를 사용합니다."
        code={IMPERATIVE_CODE}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={() =>
              gridRef.current?.setCellStyle(12, 'score', {
                style: { backgroundColor: '#ffccc7', color: '#a8071a', fontWeight: 700 },
              })
            }
          >
            12행 score 셀 강조
          </button>
          <button
            type="button"
            onClick={() =>
              gridRef.current?.setRowStyle(15, {
                style: { backgroundColor: '#e6f4ff', color: '#0958d9' },
              })
            }
          >
            15행 전체 강조
          </button>
          <button
            type="button"
            onClick={() =>
              gridRef.current?.setRangeStyle({
                rowKeys: [20, 21],
                columnKeys: ['id', 'name'],
                config: { tone: 'warning', style: { fontWeight: 700 } },
              })
            }
          >
            20–21행 id/name 범위
          </button>
          <button type="button" onClick={() => gridRef.current?.scrollToRowKey(90)}>
            90행으로 스크롤
          </button>
          <button type="button" onClick={() => gridRef.current?.undoStyles()}>
            Undo
          </button>
          <button type="button" onClick={() => gridRef.current?.redoStyles()}>
            Redo
          </button>
          <button type="button" onClick={() => gridRef.current?.clearAllStyles()}>
            명령형 스타일 초기화
          </button>
          <button type="button" onClick={() => void gridRef.current?.copyToClipboard({ scope: 'page' })}>
            현재 페이지 TSV 복사
          </button>
          <button type="button" onClick={() => gridRef.current?.exportAsCsv({ filename: 'grid-export.csv' })}>
            현재 페이지 CSV 저장
          </button>
        </div>
      </DemoBlock>
    </div>
  )
}
