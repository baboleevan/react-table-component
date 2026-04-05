import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

const columns: ColumnType<Employee>[] = [
  { key: 'id',           title: 'ID',       dataIndex: 'id',           width: 70 },
  { key: 'name',         title: '이름',     dataIndex: 'name',         width: 100 },
  { key: 'email',        title: '이메일',   dataIndex: 'email',        width: 200, ellipsis: true },
  { key: 'dept',         title: '부서',     dataIndex: 'dept',         width: 90 },
  { key: 'team',         title: '팀',       dataIndex: 'team',         width: 90 },
  { key: 'position',     title: '직급',     dataIndex: 'position',     width: 90 },
  { key: 'level',        title: '레벨',     dataIndex: 'level',        width: 100 },
  { key: 'salary',       title: '연봉(만)', dataIndex: 'salary',       width: 110, align: 'right' },
  { key: 'age',          title: '나이',     dataIndex: 'age',          width: 70,  align: 'center' },
  { key: 'gender',       title: '성별',     dataIndex: 'gender',       width: 70,  align: 'center' },
  { key: 'city',         title: '도시',     dataIndex: 'city',         width: 90 },
  { key: 'joinDate',     title: '입사일',   dataIndex: 'joinDate',     width: 110 },
  { key: 'contractType', title: '고용형태', dataIndex: 'contractType', width: 100 },
  { key: 'status',       title: '상태',     dataIndex: 'status',       width: 80 },
  { key: 'score',        title: '점수',     dataIndex: 'score',        width: 80,  align: 'center' },
  { key: 'grade',        title: '등급',     dataIndex: 'grade',        width: 70,  align: 'center' },
  { key: 'manager',      title: '매니저',   dataIndex: 'manager',      width: 100 },
  { key: 'project',      title: '프로젝트', dataIndex: 'project',      width: 110 },
  { key: 'budget',       title: '예산(만)', dataIndex: 'budget',       width: 110, align: 'right' },
  { key: 'profitRate',   title: '수익률(%)', dataIndex: 'profitRate',  width: 110, align: 'right' },
]

const CHECKBOX_CODE = `const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([])

<DataGrid
  dataSource={EMPLOYEE_DATA}
  columns={columns}
  rowKey="id"
  rowSelection={{
    type: 'checkbox',          // 네모 체크박스 (다중 선택)
    selectedRowKeys: selectedKeys,
    onChange: (keys) => setSelectedKeys(keys),
  }}
  pagination={{ pageSize: 50, showSizeChanger: true }}
/>`

const RADIO_CODE = `const [selectedKey, setSelectedKey] = useState<string | number | null>(null)

<DataGrid
  dataSource={EMPLOYEE_DATA}
  columns={columns}
  rowKey="id"
  rowSelection={{
    type: 'radio',             // 원형 라디오 (단일 선택)
    selectedRowKeys: selectedKey ? [selectedKey] : [],
    onChange: (keys) => setSelectedKey(keys[0] ?? null),
  }}
  pagination={{ pageSize: 50 }}
/>`

export function SelectionDemo() {
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([])
  const [radioKey, setRadioKey] = useState<string | number | null>(null)

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">행 선택 (Row Selection)</h1>
      <p className="demo-page__desc">
        <code>rowSelection.type</code>으로 선택 방식을 지정합니다.
        <strong> checkbox</strong>는 네모 형태로 다중 선택, <strong>radio</strong>는 원형으로 단일 선택입니다.
      </p>

      {/* Checkbox 다중 선택 */}
      <DemoBlock
        title="Checkbox 선택 — 네모 형태, 다중 선택"
        description="헤더의 전체선택 체크박스는 현재 페이지 행에만 적용됩니다. indeterminate(부분 선택) 상태도 지원합니다."
        code={CHECKBOX_CODE}
      >
        <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(0,0,0,.45)' }}>
          선택된 행: <strong>{selectedKeys.length}</strong>건
          {selectedKeys.length > 0 && (
            <button
              onClick={() => setSelectedKeys([])}
              style={{ marginLeft: 8, fontSize: 12, padding: '1px 8px', cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4 }}
            >
              선택 해제
            </button>
          )}
        </p>
        <div style={{ height: 460 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedKeys,
              onChange: (keys) => setSelectedKeys(keys),
            }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: [50, 100, 200],
              showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
            }}
          />
        </div>
      </DemoBlock>

      {/* Radio 단일 선택 */}
      <DemoBlock
        title="Radio 선택 — 원형 형태, 단일 선택"
        description="type='radio'로 설정하면 한 번에 하나의 행만 선택할 수 있습니다. 헤더에는 전체선택 없이 빈 셀이 표시됩니다."
        code={RADIO_CODE}
      >
        <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(0,0,0,.45)' }}>
          선택된 행: <strong>{radioKey != null ? `ID ${radioKey}` : '없음'}</strong>
          {radioKey != null && (
            <button
              onClick={() => setRadioKey(null)}
              style={{ marginLeft: 8, fontSize: 12, padding: '1px 8px', cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4 }}
            >
              선택 해제
            </button>
          )}
        </p>
        <div style={{ height: 460 }}>
          <DataGrid<Employee>
            dataSource={EMPLOYEE_DATA}
            columns={columns}
            rowKey="id"
            rowSelection={{
              type: 'radio',
              selectedRowKeys: radioKey != null ? [radioKey] : [],
              onChange: (keys) => setRadioKey(keys[0] ?? null),
            }}
            pagination={{
              pageSize: 50,
              showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
            }}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
