import { useState, useMemo } from 'react'
import { DataTransfer } from '@/components/DataTransfer'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '@/preview/mockData'
import { DemoBlock } from '@/preview/components/DemoBlock'

// ──────────────────────────────────────────────
// 공통 컬럼
// ──────────────────────────────────────────────
const BASE_COLUMNS: ColumnType<Employee>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 65, align: 'center' },
  { key: 'name', title: '이름', dataIndex: 'name', width: 100 },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 90 },
  { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
  { key: 'level', title: '레벨', dataIndex: 'level', width: 90 },
]

const WIDE_COLUMNS: ColumnType<Employee>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 65, align: 'center' },
  { key: 'name', title: '이름', dataIndex: 'name', width: 100 },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 90 },
  { key: 'team', title: '팀', dataIndex: 'team', width: 80 },
  { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
  {
    key: 'salary',
    title: '연봉(만)',
    dataIndex: 'salary',
    width: 100,
    align: 'right',
    render: (v) => (v as number).toLocaleString(),
  },
  { key: 'status', title: '상태', dataIndex: 'status', width: 70 },
]

// ──────────────────────────────────────────────
// 데이터: 20명만 사용 (Transfer 시연용)
// ──────────────────────────────────────────────
const DEMO_DATA = EMPLOYEE_DATA.slice(0, 20)

// ──────────────────────────────────────────────
// 코드 스니펫
// ──────────────────────────────────────────────
const BASIC_CODE = `const [targetKeys, setTargetKeys] = useState<(string | number)[]>([])

<DataTransfer
  dataSource={employees}
  targetKeys={targetKeys}
  onChange={(nextKeys) => setTargetKeys(nextKeys)}
  columns={columns}
  rowKey="id"
  titles={['전체 직원', '선발 명단']}
  height={400}
/>`

const SEARCH_CODE = `// showSearch 로 각 패널에 검색창 추가
<DataTransfer
  dataSource={employees}
  targetKeys={targetKeys}
  onChange={(nextKeys, direction, moveKeys) => {
    console.log('이동 방향:', direction, '이동된 키:', moveKeys)
    setTargetKeys(nextKeys)
  }}
  columns={columns}
  rowKey="id"
  titles={['후보 직원', '최종 선발']}
  showSearch
  height={420}
/>`

const KEYBOARD_CODE = `// 키보드 단축키
// 1. DataTransfer 컨테이너를 클릭하여 포커스 획득
// 2. 왼쪽 패널에서 체크박스로 행 선택
// 3. → 키를 누르면 선택된 행이 오른쪽으로 이동
// 4. 오른쪽 패널에서 체크박스로 행 선택
// 5. ← 키를 누르면 선택된 행이 왼쪽으로 이동

// 또는 가운데 ▶ / ◀ 버튼을 직접 클릭`

// ──────────────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────────────
export function TransferDemo() {
  const [targetKeys1, setTargetKeys1] = useState<(string | number)[]>([])
  const [targetKeys2, setTargetKeys2] = useState<(string | number)[]>([])
  const [targetKeys3, setTargetKeys3] = useState<(string | number)[]>([])
  const [log, setLog] = useState<string[]>([])

  const addLog = (direction: 'right' | 'left', keys: (string | number)[]) => {
    const arrow = direction === 'right' ? '→' : '←'
    setLog((prev) => [
      `${arrow} ${keys.length}개 이동 (keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''})`,
      ...prev.slice(0, 9),
    ])
  }

  // 1,000명 대용량 데모
  const largeData = useMemo(() => EMPLOYEE_DATA.slice(0, 1_000), [])
  const [largeTargetKeys, setLargeTargetKeys] = useState<(string | number)[]>([])

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">데이터 이전 (DataTransfer)</h1>
      <p className="demo-page__desc">
        두 패널 사이에서 행을 선택하여 이동할 수 있습니다. 중앙 <strong>▶ / ◀ 버튼</strong> 클릭 또는 컨테이너 포커스 후
        <strong> → / ← 방향키</strong>로 이동합니다.
      </p>

      {/* ── 기본 사용 ── */}
      <DemoBlock
        title="기본 사용 — 체크박스 선택 후 이동"
        description="왼쪽 패널에서 행을 선택하고 ▶ 버튼을 클릭하거나 → 키를 누르세요."
        code={BASIC_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          선발 명단: <strong>{targetKeys1.length}</strong>명
        </p>
        <DataTransfer<Employee>
          dataSource={DEMO_DATA}
          targetKeys={targetKeys1}
          onChange={(nextKeys) => setTargetKeys1(nextKeys)}
          columns={BASE_COLUMNS}
          rowKey="id"
          titles={['전체 직원', '선발 명단']}
          height={380}
        />
      </DemoBlock>

      {/* ── 검색 + 이벤트 로그 ── */}
      <DemoBlock
        title="검색 + onChange 이벤트 로그"
        description="showSearch 로 각 패널에 검색창이 추가됩니다. onChange 콜백으로 이동 방향과 이동된 키를 확인합니다."
        code={SEARCH_CODE}
      >
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <DataTransfer<Employee>
              dataSource={DEMO_DATA}
              targetKeys={targetKeys2}
              onChange={(nextKeys, direction, moveKeys) => {
                setTargetKeys2(nextKeys)
                addLog(direction, moveKeys)
              }}
              columns={BASE_COLUMNS}
              rowKey="id"
              titles={['후보 직원', '최종 선발']}
              showSearch
              height={380}
            />
          </div>
          {/* 이벤트 로그 */}
          <div style={{ width: 240, flexShrink: 0 }}>
            <div
              style={{
                border: '1px solid #e4e6ef',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '8px 12px', background: '#eef0f7', fontWeight: 600, fontSize: 13 }}>
                onChange 이벤트 로그
              </div>
              <div style={{ padding: '6px 0', minHeight: 120, maxHeight: 300, overflowY: 'auto' }}>
                {log.length === 0 ? (
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'rgba(0,0,0,.3)' }}>없음</div>
                ) : (
                  log.map((entry, i) => (
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
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </DemoBlock>

      {/* ── 키보드 단축키 ── */}
      <DemoBlock
        title="키보드 단축키 — → / ← 방향키"
        description="DataTransfer 영역을 클릭해 포커스를 맞춘 뒤, 체크박스로 행을 선택하고 방향키(→ ←)를 눌러 이동하세요."
        code={KEYBOARD_CODE}
      >
        <div
          style={{
            padding: '8px 12px',
            marginBottom: 10,
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: 6,
            fontSize: 12,
            color: '#7c5700',
          }}
        >
          💡 <strong>사용법:</strong> DataTransfer 영역을 클릭하여 포커스를 잡은 뒤, 체크박스로 행을 선택하고{' '}
          <kbd style={{ padding: '1px 5px', border: '1px solid #d9d9d9', borderRadius: 3, background: '#fff' }}>→</kbd>{' '}
          /<kbd style={{ padding: '1px 5px', border: '1px solid #d9d9d9', borderRadius: 3, background: '#fff' }}>←</kbd>{' '}
          키를 누르세요.
        </div>
        <DataTransfer<Employee>
          dataSource={DEMO_DATA}
          targetKeys={targetKeys3}
          onChange={(nextKeys) => setTargetKeys3(nextKeys)}
          columns={WIDE_COLUMNS}
          rowKey="id"
          titles={['대기 직원', '배정 완료']}
          height={380}
        />
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          배정 완료: <strong>{targetKeys3.length}</strong>명 / 대기:{' '}
          <strong>{DEMO_DATA.length - targetKeys3.length}</strong>명
        </p>
      </DemoBlock>

      {/* ── 대용량 (1,000건) ── */}
      <DemoBlock
        title="대용량 데이터 — 1,000건 가상화"
        description="dataSource 1,000건. 각 패널에서 100건 초과 시 자동으로 행 가상화가 적용됩니다."
        code={`<DataTransfer
  dataSource={employees1000}
  targetKeys={targetKeys}
  onChange={(nextKeys) => setTargetKeys(nextKeys)}
  columns={columns}
  rowKey="id"
  titles={['전체 (1,000명)', '선발']}
  height={440}
  showSearch
/>`}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          전체: <strong>1,000</strong>명 | 선발: <strong>{largeTargetKeys.length}</strong>명 | 대기:{' '}
          <strong>{1000 - largeTargetKeys.length}</strong>명
        </p>
        <DataTransfer<Employee>
          dataSource={largeData}
          targetKeys={largeTargetKeys}
          onChange={(nextKeys) => setLargeTargetKeys(nextKeys)}
          columns={WIDE_COLUMNS}
          rowKey="id"
          titles={['전체 (1,000명)', '선발']}
          height={440}
          showSearch
        />
      </DemoBlock>
    </div>
  )
}
