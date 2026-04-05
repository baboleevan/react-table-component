import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

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
  { key: 'status', title: '상태', dataIndex: 'status', width: 80 },
]

// ──────────────────────────────────────────────
// 코드 스니펫
// ──────────────────────────────────────────────
const CHECKBOX_CODE = `// clickRowToSelect: 행 전체를 클릭해 checkbox 토글
const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([])

<DataGrid
  dataSource={data}
  columns={columns}
  rowKey="id"
  rowSelection={{
    type: 'checkbox',
    selectedRowKeys: selectedKeys,
    onChange: (keys) => setSelectedKeys(keys),
    clickRowToSelect: true,   // ← 이 옵션 하나로 행 클릭 선택 활성화
  }}
  pagination={{ pageSize: 20 }}
/>`

const RADIO_CODE = `// clickRowToSelect: 행 전체를 클릭해 radio 선택
const [selectedKey, setSelectedKey] = useState<string | number | null>(null)

<DataGrid
  dataSource={data}
  columns={columns}
  rowKey="id"
  rowSelection={{
    type: 'radio',
    selectedRowKeys: selectedKey != null ? [selectedKey] : [],
    onChange: (keys) => setSelectedKey(keys[0] ?? null),
    clickRowToSelect: true,
  }}
  pagination={{ pageSize: 20 }}
/>`

const COMBINED_CODE = `// onRow.onClick 과 clickRowToSelect 동시 사용
// clickRowToSelect가 선택 토글을 처리하고,
// onRow.onClick 으로 추가 동작(상세 패널 열기 등)을 수행할 수 있습니다.
<DataGrid
  rowSelection={{
    type: 'checkbox',
    selectedRowKeys: selectedKeys,
    onChange: (keys) => setSelectedKeys(keys),
    clickRowToSelect: true,
  }}
  onRow={(record) => ({
    onClick: () => setDetailRow(record),
  })}
/>`

// ──────────────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────────────
export function ClickRowSelectDemo() {
  // checkbox 데모
  const [checkKeys, setCheckKeys] = useState<(string | number)[]>([])

  // radio 데모
  const [radioKey, setRadioKey] = useState<string | number | null>(null)

  // 복합 데모 (checkbox + 상세 패널)
  const [comboKeys, setComboKeys] = useState<(string | number)[]>([])
  const [detailRow, setDetailRow] = useState<Employee | null>(null)

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">행 클릭으로 선택 (clickRowToSelect)</h1>
      <p className="demo-page__desc">
        <code>rowSelection.clickRowToSelect: true</code>를 설정하면 체크박스·라디오 셀이 아닌 행 어디를 클릭해도 선택
        상태가 토글됩니다.
        <code>onRow.onClick</code>과 함께 사용해 상세 패널 열기 등 추가 동작을 병행할 수 있습니다.
      </p>

      {/* ── Checkbox 토글 ── */}
      <DemoBlock
        title="Checkbox — 행 클릭으로 다중 선택"
        description="행 어디를 클릭해도 체크박스가 토글됩니다. 헤더 체크박스로 현재 페이지 전체선택도 가능합니다."
        code={CHECKBOX_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(0,0,0,.45)' }}>
          선택된 행: <strong>{checkKeys.length}</strong>건
          {checkKeys.length > 0 && (
            <button
              onClick={() => setCheckKeys([])}
              style={{
                marginLeft: 8,
                fontSize: 12,
                padding: '1px 8px',
                cursor: 'pointer',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
              }}
            >
              선택 해제
            </button>
          )}
        </p>
        <div style={{ height: 420 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: checkKeys,
              onChange: (keys) => setCheckKeys(keys),
              clickRowToSelect: true,
            }}
            pagination={{ pageSize: 20 }}
          />
        </div>
      </DemoBlock>

      {/* ── Radio 선택 ── */}
      <DemoBlock
        title="Radio — 행 클릭으로 단일 선택"
        description="행을 클릭하면 해당 행이 선택되고 이전 선택은 해제됩니다."
        code={RADIO_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(0,0,0,.45)' }}>
          선택된 행: <strong>{radioKey != null ? `ID ${radioKey}` : '없음'}</strong>
          {radioKey != null && (
            <button
              onClick={() => setRadioKey(null)}
              style={{
                marginLeft: 8,
                fontSize: 12,
                padding: '1px 8px',
                cursor: 'pointer',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
              }}
            >
              선택 해제
            </button>
          )}
        </p>
        <div style={{ height: 420 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            rowSelection={{
              type: 'radio',
              selectedRowKeys: radioKey != null ? [radioKey] : [],
              onChange: (keys) => setRadioKey(keys[0] ?? null),
              clickRowToSelect: true,
            }}
            pagination={{ pageSize: 20 }}
          />
        </div>
      </DemoBlock>

      {/* ── onRow.onClick 병행 ── */}
      <DemoBlock
        title="onRow.onClick 과 병행 — 선택 + 상세 패널"
        description="clickRowToSelect가 선택을 처리하고, onRow.onClick으로 상세 패널을 동시에 업데이트합니다."
        code={COMBINED_CODE}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* 그리드 */}
          <div style={{ flex: 1, height: 420 }}>
            <DataGrid<Employee>
              dataSource={EMPLOYEE_DATA}
              columns={columns.slice(0, 6)}
              rowKey="id"
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: comboKeys,
                onChange: (keys) => setComboKeys(keys),
                clickRowToSelect: true,
              }}
              onRow={(record) => ({
                onClick: () => setDetailRow(record),
              })}
              pagination={{ pageSize: 20 }}
            />
          </div>

          {/* 상세 패널 */}
          <div style={{ width: 220, flexShrink: 0 }}>
            <div style={{ border: '1px solid #e4e6ef', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: '#eef0f7', fontWeight: 600, fontSize: 13 }}>
                클릭된 행 상세 ({comboKeys.length}개 선택)
              </div>
              {detailRow ? (
                <div style={{ padding: '10px 12px', fontSize: 13 }}>
                  {(
                    [
                      ['이름', detailRow.name],
                      ['부서', detailRow.dept],
                      ['팀', detailRow.team],
                      ['직급', detailRow.position],
                      ['레벨', detailRow.level],
                      ['연봉', `${Number(detailRow.salary).toLocaleString()}만`],
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <span style={{ color: 'rgba(0,0,0,.45)' }}>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                  <div
                    style={{
                      marginTop: 10,
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: comboKeys.includes(detailRow.id) ? '#f0f7ff' : '#fafafa',
                      border: `1px solid ${comboKeys.includes(detailRow.id) ? '#1677ff' : '#e4e6ef'}`,
                      fontSize: 12,
                      textAlign: 'center',
                      color: comboKeys.includes(detailRow.id) ? '#1677ff' : 'rgba(0,0,0,.45)',
                    }}
                  >
                    {comboKeys.includes(detailRow.id) ? '✓ 선택됨' : '선택 안됨'}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px 12px', fontSize: 13, color: 'rgba(0,0,0,.3)', textAlign: 'center' }}>
                  행을 클릭하세요
                </div>
              )}
            </div>
          </div>
        </div>
      </DemoBlock>
    </div>
  )
}
