import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'
import './InlineEditDemo.scss'

// ──────────────────────────────────────────────
// 재사용 에디터 컴포넌트 (CustomEditorDemo와 동일)
// ──────────────────────────────────────────────

const DEPT_OPTIONS = ['개발', '디자인', '기획', '마케팅', 'QA', '인프라', '데이터', '보안']
const LEVEL_OPTIONS = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal']
const GRADE_OPTIONS = ['S', 'A', 'B', 'C', 'D']
const STATUS_OPTIONS = ['재직', '휴직', '수습', '파견']

function SelectCell({
  value,
  options,
  onCommit,
  onCancel,
}: {
  value: unknown
  options: string[]
  onCommit: (v: unknown) => void
  onCancel: () => void
}) {
  return (
    <select
      className="inline-demo-select"
      defaultValue={value as string}
      onChange={(e) => onCommit(e.target.value)}
      onBlur={onCancel}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

// ──────────────────────────────────────────────
// 코드 스니펫
// ──────────────────────────────────────────────
const INLINE_BASIC_CODE = `// editMode="inline" — 에디터가 처음부터 노출
<DataGrid
  dataSource={data}
  columns={columns}
  rowKey="id"
  editMode="inline"   // ← 이 옵션 하나로 전환
  onCellEdit={handleCellEdit}
/>`

const INLINE_SELECT_CODE = `// renderEditor를 지정하면 inline 모드에서도 동일하게 동작
{
  key: 'dept', title: '부서', dataIndex: 'dept',
  editable: true,
  renderEditor: (value, _r, _i, onCommit, onCancel) => (
    <select
      defaultValue={value as string}
      onChange={(e) => onCommit(e.target.value)}
      onBlur={onCancel}
    >
      {DEPT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  ),
}`

const INLINE_MIXED_CODE = `// 컬럼별로 다른 에디터 혼합 적용 (inline 모드)
const columns: ColumnType<Employee>[] = [
  { key: 'name',   title: '이름', dataIndex: 'name',  editable: true },
  { key: 'salary', title: '연봉', dataIndex: 'salary', editable: true,
    renderEditor: (v,_,_i,onCommit) => (
      <input type="number" defaultValue={Number(v)} min={1000} max={20000}
        onBlur={(e) => onCommit(Number(e.target.value))} />
    )},
  { key: 'dept', title: '부서', dataIndex: 'dept', editable: true,
    renderEditor: (v,_,_i,onCommit,onCancel) => (
      <select defaultValue={v as string}
        onChange={(e) => onCommit(e.target.value)} onBlur={onCancel}>
        ...
      </select>
    )},
]`

// ──────────────────────────────────────────────
// 데모 컴포넌트
// ──────────────────────────────────────────────
export function InlineEditDemo() {
  const [data, setData] = useState<Employee[]>(EMPLOYEE_DATA.slice(0, 50))

  const handleCellEdit = (rowKey: string | number, colKey: string, newValue: unknown) => {
    setData((prev) => prev.map((r) => (r.id === rowKey ? { ...r, [colKey]: newValue } : r)))
  }

  // ── 기본 텍스트 inline 컬럼 ──────────────────
  const basicColumns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 60, align: 'center' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 120, editable: true },
    { key: 'email', title: '이메일', dataIndex: 'email', width: 200, editable: true, ellipsis: true },
    { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center', editable: true },
    { key: 'city', title: '도시', dataIndex: 'city', width: 100, editable: true },
    { key: 'project', title: '프로젝트', dataIndex: 'project', width: 130, editable: true },
    { key: 'memo', title: '메모', dataIndex: 'memo', width: 220, editable: true, ellipsis: true },
  ]

  // ── Select inline 컬럼 ───────────────────────
  const selectColumns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 60, align: 'center' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 110 },
    {
      key: 'dept',
      title: '부서',
      dataIndex: 'dept',
      width: 120,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectCell value={value} options={DEPT_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'level',
      title: '레벨',
      dataIndex: 'level',
      width: 120,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectCell value={value} options={LEVEL_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'grade',
      title: '등급',
      dataIndex: 'grade',
      width: 110,
      align: 'center',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectCell value={value} options={GRADE_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'status',
      title: '재직여부',
      dataIndex: 'status',
      width: 120,
      align: 'center',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectCell value={value} options={STATUS_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
      render: (v) => {
        const colors: Record<string, string> = { 재직: '#52c41a', 휴직: '#ff4d4f', 수습: '#1677ff', 파견: '#722ed1' }
        return <span style={{ color: colors[v as string] ?? '#000', fontWeight: 500 }}>{v as string}</span>
      },
    },
  ]

  // ── 혼합 inline 컬럼 (number + select + text) ──
  const mixedColumns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 60, align: 'center', fixed: 'left' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 110, editable: true, fixed: 'left' },
    {
      key: 'salary',
      title: '연봉(만)',
      dataIndex: 'salary',
      width: 130,
      align: 'right',
      editable: true,
      renderEditor: (value, _r, _i, onCommit) => (
        <input
          className="inline-demo-number"
          type="number"
          defaultValue={Number(value)}
          min={1000}
          max={20000}
          step={100}
          onBlur={(e) => onCommit(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommit(Number((e.target as HTMLInputElement).value))
          }}
        />
      ),
    },
    {
      key: 'bonus',
      title: '보너스',
      dataIndex: 'bonus',
      width: 110,
      align: 'right',
      editable: true,
      renderEditor: (value, _r, _i, onCommit) => (
        <input
          className="inline-demo-number"
          type="number"
          defaultValue={Number(value)}
          min={0}
          max={5000}
          step={50}
          onBlur={(e) => onCommit(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommit(Number((e.target as HTMLInputElement).value))
          }}
        />
      ),
    },
    {
      key: 'dept',
      title: '부서',
      dataIndex: 'dept',
      width: 120,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectCell value={value} options={DEPT_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'level',
      title: '레벨',
      dataIndex: 'level',
      width: 120,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectCell value={value} options={LEVEL_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'grade',
      title: '등급',
      dataIndex: 'grade',
      width: 100,
      align: 'center',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectCell value={value} options={GRADE_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'status',
      title: '재직여부',
      dataIndex: 'status',
      width: 120,
      align: 'center',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectCell value={value} options={STATUS_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
      render: (v) => {
        const colors: Record<string, string> = { 재직: '#52c41a', 휴직: '#ff4d4f', 수습: '#1677ff', 파견: '#722ed1' }
        return <span style={{ color: colors[v as string] ?? '#000', fontWeight: 500 }}>{v as string}</span>
      },
    },
    { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center', editable: true },
    { key: 'city', title: '도시', dataIndex: 'city', width: 100, editable: true },
    {
      key: 'joinDate',
      title: '입사일',
      dataIndex: 'joinDate',
      width: 150,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <input
          className="inline-demo-date"
          type="date"
          defaultValue={value as string}
          onChange={(e) => onCommit(e.target.value)}
          onBlur={onCancel}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        />
      ),
    },
    { key: 'project', title: '프로젝트', dataIndex: 'project', width: 130, editable: true },
    { key: 'memo', title: '메모', dataIndex: 'memo', width: 200, editable: true, ellipsis: true },
  ]

  const commonPagination = {
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50],
    showTotal: (total: number, [s, e]: [number, number]) => `${s}-${e} / 총 ${total}건`,
  }

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">인라인 편집 (editMode="inline")</h1>
      <p className="demo-page__desc">
        <code>editMode="inline"</code>을 설정하면 클릭·더블클릭 없이
        <strong> input / select 등 에디터가 처음부터 노출</strong>됩니다.
        <strong> Tab</strong>으로 다음 컬럼, <strong>Shift+Tab</strong>으로 이전 컬럼으로 이동합니다.
      </p>

      {/* 기본 텍스트 inline */}
      <DemoBlock
        title="기본 텍스트 입력 (inline)"
        description="editable: true인 컬럼이 처음부터 input으로 노출됩니다. Tab으로 다음 셀로 이동."
        code={INLINE_BASIC_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          이름 / 이메일 / 나이 / 도시 / 프로젝트 / 메모 셀이 즉시 편집 가능 &nbsp;|&nbsp; Tab → 다음 셀, Shift+Tab →
          이전 셀
        </p>
        <div style={{ height: 400 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={basicColumns}
            rowKey="id"
            editMode="inline"
            onCellEdit={handleCellEdit}
            pagination={commonPagination}
          />
        </div>
      </DemoBlock>

      {/* Select inline */}
      <DemoBlock
        title="Select 드롭다운 (inline)"
        description="renderEditor와 함께 inline 모드를 사용하면 select가 항상 노출된 폼 테이블이 됩니다."
        code={INLINE_SELECT_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          부서 / 레벨 / 등급 / 재직여부가 select로 항상 노출 &nbsp;|&nbsp; Tab으로 다음 셀 이동
        </p>
        <div style={{ height: 400 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={selectColumns}
            rowKey="id"
            editMode="inline"
            onCellEdit={handleCellEdit}
            pagination={commonPagination}
          />
        </div>
      </DemoBlock>

      {/* 혼합 inline */}
      <DemoBlock
        title="혼합 에디터 (inline) — 고정 컬럼 포함"
        description="number input / select / date / text input이 혼합된 인라인 폼 테이블. 이름·ID 컬럼은 fixed left."
        code={INLINE_MIXED_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          연봉·보너스 = number &nbsp;|&nbsp; 부서·레벨·등급·재직여부 = select &nbsp;|&nbsp; 입사일 = date &nbsp;|&nbsp;
          나이·도시·프로젝트·메모 = text
        </p>
        <div style={{ height: 500 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={mixedColumns}
            rowKey="id"
            editMode="inline"
            onCellEdit={handleCellEdit}
            scroll={{ x: 1600 }}
            pagination={commonPagination}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
