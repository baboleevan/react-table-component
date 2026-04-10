import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '@/preview/mockData'
import { DemoBlock } from '@/preview/components/DemoBlock'

// ──────────────────────────────────────────────
// 컬럼 정의
// ──────────────────────────────────────────────
const columns: ColumnType<Employee>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 65, align: 'center' },
  { key: 'name', title: '이름', dataIndex: 'name', width: 100 },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 90 },
  { key: 'team', title: '팀', dataIndex: 'team', width: 90 },
  { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
  { key: 'level', title: '레벨', dataIndex: 'level', width: 100 },
  { key: 'salary', title: '연봉(만)', dataIndex: 'salary', width: 110, align: 'right' },
  { key: 'email', title: '이메일', dataIndex: 'email', width: 200, ellipsis: true },
  { key: 'city', title: '도시', dataIndex: 'city', width: 90 },
  { key: 'status', title: '상태', dataIndex: 'status', width: 80 },
]

// ──────────────────────────────────────────────
// 코드 스니펫
// ──────────────────────────────────────────────
const BASIC_CODE = `const [focusedRow, setFocusedRow] = useState<Employee | null>(null)

<DataGrid
  dataSource={data}
  columns={columns}
  rowKey="id"
  // 클릭 + 키보드(↑↓) 모두에서 호출됩니다
  onFocusedRowChange={(record, index) => {
    setFocusedRow(record)
  }}
/>`

const ONROW_CODE = `// onRow.onClick 과 onFocusedRowChange 병행 사용
const [focusedRow, setFocusedRow] = useState<Employee | null>(null)
const [clickedRow, setClickedRow] = useState<Employee | null>(null)

<DataGrid
  onFocusedRowChange={(record) => setFocusedRow(record)}   // 클릭 + 키보드
  onRow={(record) => ({
    onClick: () => setClickedRow(record),   // 클릭만
    style: { cursor: 'pointer' },
  })}
/>`

const MULTI_CODE = `// 포커스된 행으로 상세 패널 / 액션 버튼 제어
const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

const handleFocusedRowChange = (record: Employee) => {
  setSelectedEmployee(record)
}

// 그리드 외부에서 해당 row의 데이터로 상세 뷰 렌더링
{selectedEmployee && (
  <DetailPanel employee={selectedEmployee} />
)}`

// ──────────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────────
function RowCard({ row, label }: { row: Employee | null; label: string }) {
  if (!row) {
    return (
      <div style={cardStyle}>
        <div style={{ color: 'rgba(0,0,0,.3)', fontSize: 13 }}>
          {label}: <em>없음 — 행을 클릭하거나 ↑↓ 키로 이동하세요</em>
        </div>
      </div>
    )
  }
  return (
    <div style={{ ...cardStyle, borderColor: '#1677ff', background: '#f0f7ff' }}>
      <div style={{ fontSize: 12, color: '#1677ff', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 16px', fontSize: 13 }}>
        {(
          [
            ['ID', row.id],
            ['이름', row.name],
            ['부서', row.dept],
            ['팀', row.team],
            ['직급', row.position],
            ['레벨', row.level],
            ['연봉', `${Number(row.salary).toLocaleString()}만`],
            ['도시', row.city],
            ['상태', row.status],
          ] as [string, unknown][]
        ).map(([k, v]) => (
          <div key={k}>
            <span style={{ color: 'rgba(0,0,0,.45)' }}>{k}: </span>
            <strong>{String(v)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: '10px 14px',
  border: '1px solid #e4e6ef',
  borderRadius: 6,
  background: '#fafbfc',
  minHeight: 64,
  marginTop: 10,
}

// ──────────────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────────────
export function FocusedRowDemo() {
  const [focusedRow1, setFocusedRow1] = useState<Employee | null>(null)
  const [focusedRow2, setFocusedRow2] = useState<Employee | null>(null)
  const [clickedRow2, setClickedRow2] = useState<Employee | null>(null)
  const [focusedRow3, setFocusedRow3] = useState<Employee | null>(null)
  const [focusHistory, setFocusHistory] = useState<string[]>([])

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">포커스된 행 추적 (onFocusedRowChange)</h1>
      <p className="demo-page__desc">
        <code>onFocusedRowChange</code> prop으로 현재 포커스된 행을 부모 state에서 관리합니다. 행 클릭과 키보드 ↑↓ 이동
        모두에서 콜백이 발생합니다.
      </p>

      {/* 기본 사용 */}
      <DemoBlock
        title="기본 사용 — 클릭 & 키보드 ↑↓"
        description="onFocusedRowChange는 마우스 클릭과 키보드 방향키(↑↓) 이동 모두에서 호출됩니다."
        code={BASIC_CODE}
      >
        <p style={{ margin: '0 0 6px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          행을 클릭하거나 그리드 클릭 후 ↑↓ 키로 이동해보세요.
        </p>
        <div style={{ height: 380 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            onFocusedRowChange={(record) => setFocusedRow1(record)}
            pagination={{ pageSize: 20 }}
          />
        </div>
        <RowCard row={focusedRow1} label="현재 포커스된 행" />
      </DemoBlock>

      {/* onRow + onFocusedRowChange 병행 */}
      <DemoBlock
        title="onRow.onClick 과 병행 사용"
        description="onFocusedRowChange는 클릭+키보드 모두에 반응하고, onRow.onClick은 마우스 클릭에만 반응합니다."
        code={ONROW_CODE}
      >
        <div style={{ height: 380 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            onFocusedRowChange={(record) => setFocusedRow2(record)}
            onRow={(record) => ({
              onClick: () => setClickedRow2(record),
              style: { cursor: 'pointer' },
            })}
            pagination={{ pageSize: 20 }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
          <RowCard row={focusedRow2} label="onFocusedRowChange (클릭 + 키보드)" />
          <RowCard row={clickedRow2} label="onRow.onClick (클릭만)" />
        </div>
      </DemoBlock>

      {/* 상세 패널 + 이력 */}
      <DemoBlock
        title="활용 예시 — 상세 패널 & 포커스 이력"
        description="포커스된 행으로 외부 UI(상세 정보, 액션 버튼 등)를 제어할 수 있습니다."
        code={MULTI_CODE}
      >
        <div style={{ display: 'flex', gap: 16, height: 460, alignItems: 'flex-start' }}>
          {/* 그리드 */}
          <div style={{ flex: 1, height: '100%' }}>
            <DataGrid<Employee>
              dataSource={EMPLOYEE_DATA}
              columns={columns.slice(0, 6)}
              rowKey="id"
              onFocusedRowChange={(record, index) => {
                setFocusedRow3(record)
                setFocusHistory((prev) => [`#${index + 1} ${record.name} (${record.dept})`, ...prev.slice(0, 9)])
              }}
              pagination={{ pageSize: 30 }}
            />
          </div>

          {/* 우측 패널 */}
          <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 상세 정보 */}
            <div style={{ border: '1px solid #e4e6ef', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: '#eef0f7', fontWeight: 600, fontSize: 13 }}>직원 상세</div>
              {focusedRow3 ? (
                <div style={{ padding: '10px 12px', fontSize: 13 }}>
                  {[
                    ['이름', focusedRow3.name],
                    ['부서', focusedRow3.dept],
                    ['팀', focusedRow3.team],
                    ['직급', focusedRow3.position],
                    ['레벨', focusedRow3.level],
                    ['연봉', `${Number(focusedRow3.salary).toLocaleString()}만`],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <span style={{ color: 'rgba(0,0,0,.45)' }}>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                    <button style={actionBtn('#1677ff')}>편집</button>
                    <button style={actionBtn('#ff4d4f')}>삭제</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px 12px', fontSize: 13, color: 'rgba(0,0,0,.3)', textAlign: 'center' }}>
                  행을 선택하세요
                </div>
              )}
            </div>

            {/* 포커스 이력 */}
            <div style={{ border: '1px solid #e4e6ef', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: '#eef0f7', fontWeight: 600, fontSize: 13 }}>
                포커스 이력
              </div>
              <div style={{ padding: '6px 0', maxHeight: 200, overflowY: 'auto' }}>
                {focusHistory.length === 0 ? (
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'rgba(0,0,0,.3)' }}>없음</div>
                ) : (
                  focusHistory.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '4px 12px',
                        fontSize: 12,
                        color: i === 0 ? '#1677ff' : 'rgba(0,0,0,.6)',
                        fontWeight: i === 0 ? 600 : 400,
                        borderBottom: '1px solid #f5f5f5',
                      }}
                    >
                      {i === 0 && '▶ '}
                      {h}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </DemoBlock>
    </div>
  )
}

function actionBtn(bg: string): React.CSSProperties {
  return {
    flex: 1,
    padding: '4px 0',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
  }
}
