import { useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'
import './CustomEditorDemo.scss'

// ──────────────────────────────────────────────
// 재사용 가능한 에디터 컴포넌트
// (실제 프로젝트에서는 별도 파일로 분리하세요)
// ──────────────────────────────────────────────

interface SelectEditorProps {
  value: unknown
  options: { label: string; value: string }[]
  onCommit: (v: unknown) => void
  onCancel: () => void
}

function SelectEditor({ value, options, onCommit, onCancel }: SelectEditorProps) {
  return (
    <select
      className="custom-editor custom-editor--select"
      defaultValue={value as string}
      autoFocus
      onChange={(e) => onCommit(e.target.value)}
      onBlur={onCancel}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

interface RadioEditorProps {
  value: unknown
  options: { label: string; value: string }[]
  onCommit: (v: unknown) => void
  onCancel: () => void
}

function RadioEditor({ value, options, onCommit, onCancel }: RadioEditorProps) {
  return (
    <div className="custom-editor custom-editor--radio" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      {options.map((o) => (
        <label key={o.value} className="custom-editor__radio-item">
          <input
            type="radio"
            name="cell-radio"
            value={o.value}
            defaultChecked={o.value === value}
            onChange={() => onCommit(o.value)}
            autoFocus={o.value === value}
          />
          {o.label}
        </label>
      ))}
    </div>
  )
}

interface CheckboxEditorProps {
  value: unknown
  label?: string
  onCommit: (v: unknown) => void
  onCancel: () => void
}

function CheckboxEditor({ value, label = '활성', onCommit, onCancel }: CheckboxEditorProps) {
  const boolVal = value === true || value === 'true' || value === '활성'
  return (
    <label className="custom-editor custom-editor--checkbox" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <input
        type="checkbox"
        defaultChecked={boolVal}
        autoFocus
        onChange={(e) => onCommit(e.target.checked ? '활성' : '비활성')}
        onBlur={onCancel}
      />
      {label}
    </label>
  )
}

// ── NumberEditor — 숫자 전용 입력 ──────────────
interface NumberEditorProps {
  value: unknown
  min?: number
  max?: number
  step?: number
  onCommit: (v: unknown) => void
  onCancel: () => void
}

function NumberEditor({ value, min, max, step = 1, onCommit, onCancel }: NumberEditorProps) {
  return (
    <input
      type="number"
      className="custom-editor custom-editor--number"
      defaultValue={Number(value)}
      min={min}
      max={max}
      step={step}
      autoFocus
      onBlur={(e) => onCommit(Number(e.target.value))}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onCancel()
          return
        }
        if (e.key === 'Enter') onCommit(Number((e.target as HTMLInputElement).value))
      }}
    />
  )
}

// ── DateEditor — 날짜 입력 ─────────────────────
interface DateEditorProps {
  value: unknown
  onCommit: (v: unknown) => void
  onCancel: () => void
}

function DateEditor({ value, onCommit, onCancel }: DateEditorProps) {
  return (
    <input
      type="date"
      className="custom-editor custom-editor--date"
      defaultValue={value as string}
      autoFocus
      onChange={(e) => onCommit(e.target.value)}
      onBlur={onCancel}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    />
  )
}

// ── TextareaEditor — 여러 줄 텍스트 입력 ──────
interface TextareaEditorProps {
  value: unknown
  onCommit: (v: unknown) => void
  onCancel: () => void
}

function TextareaEditor({ value, onCommit, onCancel }: TextareaEditorProps) {
  return (
    <textarea
      className="custom-editor custom-editor--textarea"
      defaultValue={value as string}
      autoFocus
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onCancel()
        }
        // Ctrl+Enter 또는 Shift+Enter로 커밋
        if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
          e.preventDefault()
          onCommit((e.target as HTMLTextAreaElement).value)
        }
      }}
    />
  )
}

// ── RatingEditor — 별점 클릭 선택 (1~5) ───────
interface RatingEditorProps {
  value: unknown
  onCommit: (v: unknown) => void
  onCancel: () => void
}

function RatingEditor({ value, onCommit, onCancel }: RatingEditorProps) {
  // score(0~100) → 별(1~5) 변환
  const current = Math.min(5, Math.max(1, Math.round(Number(value) / 20)))
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div
      className="custom-editor custom-editor--rating"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      tabIndex={0}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`custom-editor__star${(hovered ?? current) >= star ? ' active' : ''}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onCommit(star * 20)} // 별(1~5) → score(20~100)
        >
          ★
        </span>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────
// 옵션 상수
// ──────────────────────────────────────────────
const DEPT_OPTIONS = [
  { label: '개발', value: '개발' },
  { label: '디자인', value: '디자인' },
  { label: '기획', value: '기획' },
  { label: '마케팅', value: '마케팅' },
  { label: 'QA', value: 'QA' },
  { label: '인프라', value: '인프라' },
  { label: '데이터', value: '데이터' },
  { label: '보안', value: '보안' },
]

const GRADE_OPTIONS = [
  { label: 'S', value: 'S' },
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
]

const LEVEL_OPTIONS = [
  { label: 'Junior', value: 'Junior' },
  { label: 'Mid', value: 'Mid' },
  { label: 'Senior', value: 'Senior' },
  { label: 'Lead', value: 'Lead' },
  { label: 'Principal', value: 'Principal' },
]

const CONTRACT_OPTIONS = [
  { label: '정규직', value: '정규직' },
  { label: '계약직', value: '계약직' },
  { label: '파트타임', value: '파트타임' },
  { label: '프리랜서', value: '프리랜서' },
]

// ──────────────────────────────────────────────
// 코드 스니펫
// ──────────────────────────────────────────────
const SELECT_CODE = `// Select 에디터
const columns: ColumnType<Employee>[] = [
  {
    key: 'dept',
    title: '부서',
    dataIndex: 'dept',
    editable: true,
    renderEditor: (value, _record, _idx, onCommit, onCancel) => (
      <select
        autoFocus
        defaultValue={value as string}
        onChange={(e) => onCommit(e.target.value)}
        onBlur={onCancel}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      >
        {DEPT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    ),
  },
]`

const RADIO_CODE = `// Radio 에디터
{
  key: 'grade',
  title: '등급',
  dataIndex: 'grade',
  editable: true,
  renderEditor: (value, _record, _idx, onCommit, onCancel) => (
    <div onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      {GRADE_OPTIONS.map(o => (
        <label key={o.value}>
          <input
            type="radio"
            name="cell-radio"
            value={o.value}
            defaultChecked={o.value === value}
            onChange={() => onCommit(o.value)}
            autoFocus={o.value === value}
          />
          {o.label}
        </label>
      ))}
    </div>
  ),
}`

const CHECKBOX_CODE = `// Checkbox 에디터 (boolean → '활성'/'비활성' 문자열)
{
  key: 'status',
  title: '상태',
  dataIndex: 'status',
  editable: true,
  renderEditor: (value, _record, _idx, onCommit, onCancel) => (
    <label>
      <input
        type="checkbox"
        defaultChecked={value === '재직'}
        autoFocus
        onChange={(e) => onCommit(e.target.checked ? '재직' : '휴직')}
        onBlur={onCancel}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      />
      재직
    </label>
  ),
}`

const NUMBER_CODE = `// Number 에디터 — <input type="number"> 숫자 전용 입력
{
  key: 'salary',
  title: '연봉(만)',
  dataIndex: 'salary',
  editable: true,
  renderEditor: (value, _r, _i, onCommit, onCancel) => (
    <NumberEditor value={value} min={1000} max={20000} step={100}
      onCommit={onCommit} onCancel={onCancel} />
  ),
}`

const DATE_CODE = `// Date 에디터 — <input type="date"> 날짜 선택
{
  key: 'joinDate',
  title: '입사일',
  dataIndex: 'joinDate',
  editable: true,
  renderEditor: (value, _r, _i, onCommit, onCancel) => (
    <DateEditor value={value} onCommit={onCommit} onCancel={onCancel} />
  ),
}`

const TEXTAREA_CODE = `// Textarea 에디터 — <textarea> 여러 줄 입력
{
  key: 'memo',
  title: '메모',
  dataIndex: 'memo',
  editable: true,
  renderEditor: (value, _r, _i, onCommit, onCancel) => (
    <TextareaEditor value={value} onCommit={onCommit} onCancel={onCancel} />
  ),
}`

const RATING_CODE = `// Rating 에디터 — 별점 클릭 선택 (1~5)
{
  key: 'score',
  title: '점수',
  dataIndex: 'score',
  editable: true,
  renderEditor: (value, _r, _i, onCommit, onCancel) => (
    <RatingEditor value={value} onCommit={onCommit} onCancel={onCancel} />
  ),
}`

const MIXED_CODE = `// renderEditor로 컬럼별 다른 에디터 적용 (전체 혼합)
const columns: ColumnType<Employee>[] = [
  { key: 'name',  title: '이름', dataIndex: 'name', editable: true },
  { key: 'dept',  title: '부서', dataIndex: 'dept', editable: true,
    renderEditor: (v,_,_i,onCommit,onCancel) =>
      <SelectEditor value={v} options={DEPT_OPTIONS} onCommit={onCommit} onCancel={onCancel} /> },
  { key: 'grade', title: '등급', dataIndex: 'grade', editable: true,
    renderEditor: (v,_,_i,onCommit,onCancel) =>
      <RadioEditor value={v} options={GRADE_OPTIONS} onCommit={onCommit} onCancel={onCancel} /> },
  { key: 'status', title: '재직여부', dataIndex: 'status', editable: true,
    renderEditor: (v,_,_i,onCommit,onCancel) =>
      <CheckboxEditor value={v} label="재직" onCommit={onCommit} onCancel={onCancel} /> },
  { key: 'salary', title: '연봉(만)', dataIndex: 'salary', editable: true,
    renderEditor: (v,_,_i,onCommit,onCancel) =>
      <NumberEditor value={v} min={1000} max={20000} step={100} onCommit={onCommit} onCancel={onCancel} /> },
  { key: 'joinDate', title: '입사일', dataIndex: 'joinDate', editable: true,
    renderEditor: (v,_,_i,onCommit,onCancel) =>
      <DateEditor value={v} onCommit={onCommit} onCancel={onCancel} /> },
  { key: 'memo', title: '메모', dataIndex: 'memo', editable: true,
    renderEditor: (v,_,_i,onCommit,onCancel) =>
      <TextareaEditor value={v} onCommit={onCommit} onCancel={onCancel} /> },
  { key: 'score', title: '점수(별점)', dataIndex: 'score', editable: true,
    renderEditor: (v,_,_i,onCommit,onCancel) =>
      <RatingEditor value={v} onCommit={onCommit} onCancel={onCancel} /> },
]`

// 개별 데모용 간략 페이지네이션
const SMALL_PAGINATION = {
  pageSize: 5,
  pageSizeOptions: [5, 10, 20],
  showSizeChanger: true,
}

export function CustomEditorDemo() {
  const [data, setData] = useState<Employee[]>(EMPLOYEE_DATA)

  const handleCellEdit = (rowKey: string | number, colKey: string, newValue: unknown) => {
    setData((prev) => prev.map((r) => (r.id === rowKey ? { ...r, [colKey]: newValue } : r)))
  }

  // ── Select 전용 컬럼 ──────────────────────────
  const selectColumns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 110 },
    {
      key: 'dept',
      title: '부서',
      dataIndex: 'dept',
      width: 110,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectEditor value={value} options={DEPT_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'level',
      title: '레벨',
      dataIndex: 'level',
      width: 120,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectEditor value={value} options={LEVEL_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'contractType',
      title: '고용형태',
      dataIndex: 'contractType',
      width: 130,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectEditor value={value} options={CONTRACT_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'position',
      title: '직급',
      dataIndex: 'position',
      width: 90,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectEditor
          value={value}
          options={['사원', '주임', '대리', '과장', '차장', '부장', '이사'].map((v) => ({ label: v, value: v }))}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      ),
    },
  ]

  // ── Radio 전용 컬럼 ───────────────────────────
  const radioColumns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 110 },
    { key: 'dept', title: '부서', dataIndex: 'dept', width: 90 },
    {
      key: 'grade',
      title: '등급',
      dataIndex: 'grade',
      width: 220,
      align: 'center',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <RadioEditor value={value} options={GRADE_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
  ]

  // ── Checkbox 전용 컬럼 ────────────────────────
  const checkboxColumns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 110 },
    { key: 'dept', title: '부서', dataIndex: 'dept', width: 90 },
    {
      key: 'status',
      title: '재직여부',
      dataIndex: 'status',
      width: 120,
      align: 'center',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <CheckboxEditor value={value} label="재직" onCommit={onCommit} onCancel={onCancel} />
      ),
      render: (v) => {
        const colors: Record<string, string> = { 재직: '#52c41a', 휴직: '#ff4d4f', 수습: '#1677ff', 파견: '#722ed1' }
        return <span style={{ color: colors[v as string] ?? '#000', fontWeight: 500 }}>{v as string}</span>
      },
    },
  ]

  // ── Number 전용 컬럼 ──────────────────────────
  const numberColumns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 110 },
    {
      key: 'salary',
      title: '연봉(만)',
      dataIndex: 'salary',
      width: 130,
      align: 'right',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <NumberEditor value={value} min={1000} max={20000} step={100} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'bonus',
      title: '보너스',
      dataIndex: 'bonus',
      width: 120,
      align: 'right',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <NumberEditor value={value} min={0} max={5000} step={50} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
  ]

  // ── Date 전용 컬럼 ────────────────────────────
  const dateColumns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 110 },
    {
      key: 'joinDate',
      title: '입사일',
      dataIndex: 'joinDate',
      width: 160,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <DateEditor value={value} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
  ]

  // ── Textarea 전용 컬럼 ────────────────────────
  const textareaColumns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 110 },
    {
      key: 'memo',
      title: '메모',
      dataIndex: 'memo',
      width: 400,
      ellipsis: true,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <TextareaEditor value={value} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
  ]

  // ── Rating 전용 컬럼 ──────────────────────────
  const ratingColumns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 110 },
    {
      key: 'score',
      title: '점수(별점)',
      dataIndex: 'score',
      width: 200,
      align: 'center',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <RatingEditor value={value} onCommit={onCommit} onCancel={onCancel} />
      ),
      render: (v) => {
        const stars = Math.min(5, Math.max(1, Math.round(Number(v) / 20)))
        return (
          <span title={`${v as number}점`}>
            {'★'.repeat(stars)}
            {'☆'.repeat(5 - stars)}
          </span>
        )
      },
    },
  ]

  const columns: ColumnType<Employee>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 70, fixed: 'left' },
    { key: 'name', title: '이름', dataIndex: 'name', width: 110, editable: true },
    { key: 'email', title: '이메일', dataIndex: 'email', width: 200, editable: true, ellipsis: true },
    {
      key: 'dept',
      title: '부서',
      dataIndex: 'dept',
      width: 110,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectEditor value={value} options={DEPT_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'level',
      title: '레벨',
      dataIndex: 'level',
      width: 120,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectEditor value={value} options={LEVEL_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'contractType',
      title: '고용형태',
      dataIndex: 'contractType',
      width: 130,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectEditor value={value} options={CONTRACT_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'grade',
      title: '등급',
      dataIndex: 'grade',
      width: 200,
      align: 'center',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <RadioEditor value={value} options={GRADE_OPTIONS} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'status',
      title: '재직여부',
      dataIndex: 'status',
      width: 110,
      align: 'center',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <CheckboxEditor value={value} label="재직" onCommit={onCommit} onCancel={onCancel} />
      ),
      render: (v) => {
        const colors: Record<string, string> = { 재직: '#52c41a', 휴직: '#ff4d4f', 수습: '#1677ff', 파견: '#722ed1' }
        return <span style={{ color: colors[v as string] ?? '#000', fontWeight: 500 }}>{v as string}</span>
      },
    },
    {
      key: 'position',
      title: '직급',
      dataIndex: 'position',
      width: 90,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <SelectEditor
          value={value}
          options={['사원', '주임', '대리', '과장', '차장', '부장', '이사'].map((v) => ({ label: v, value: v }))}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      ),
    },
    {
      key: 'salary',
      title: '연봉(만)',
      dataIndex: 'salary',
      width: 120,
      align: 'right',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <NumberEditor value={value} min={1000} max={20000} step={100} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'bonus',
      title: '보너스',
      dataIndex: 'bonus',
      width: 110,
      align: 'right',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <NumberEditor value={value} min={0} max={5000} step={50} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    {
      key: 'score',
      title: '점수(별점)',
      dataIndex: 'score',
      width: 160,
      align: 'center',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <RatingEditor value={value} onCommit={onCommit} onCancel={onCancel} />
      ),
      render: (v) => {
        const stars = Math.min(5, Math.max(1, Math.round(Number(v) / 20)))
        return (
          <span title={`${v as number}점`}>
            {'★'.repeat(stars)}
            {'☆'.repeat(5 - stars)}
          </span>
        )
      },
    },
    { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center' },
    { key: 'city', title: '도시', dataIndex: 'city', width: 90 },
    {
      key: 'joinDate',
      title: '입사일',
      dataIndex: 'joinDate',
      width: 130,
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <DateEditor value={value} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
    { key: 'project', title: '프로젝트', dataIndex: 'project', width: 110 },
    { key: 'budget', title: '예산(만)', dataIndex: 'budget', width: 110, align: 'right' },
    { key: 'revenue', title: '매출(만)', dataIndex: 'revenue', width: 110, align: 'right' },
    { key: 'profitRate', title: '수익률(%)', dataIndex: 'profitRate', width: 110, align: 'right' },
    {
      key: 'memo',
      title: '메모',
      dataIndex: 'memo',
      width: 180,
      ellipsis: true,
      fixed: 'right',
      editable: true,
      renderEditor: (value, _r, _i, onCommit, onCancel) => (
        <TextareaEditor value={value} onCommit={onCommit} onCancel={onCancel} />
      ),
    },
  ]

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">
        커스텀 에디터 (Select / Radio / Checkbox / Number / Date / Textarea / Rating)
      </h1>
      <p className="demo-page__desc">
        <code>renderEditor</code>로 컬럼별 다른 에디터 컴포넌트를 사용합니다. 10,000건 × 20컬럼 데이터이며, 셀을
        더블클릭하면 해당 컬럼에 맞는 에디터가 나타납니다.
      </p>

      <DemoBlock
        title="Select 에디터"
        description="부서·레벨·고용형태·직급 컬럼은 select 드롭다운으로 선택합니다"
        code={SELECT_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          부서 / 레벨 / 고용형태 / 직급 셀을 더블클릭 → select 드롭다운
        </p>
        <div style={{ height: 300 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={selectColumns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            pagination={SMALL_PAGINATION}
          />
        </div>
      </DemoBlock>

      <DemoBlock title="Radio 에디터" description="등급(S/A/B/C/D) 컬럼은 radio 버튼으로 선택합니다" code={RADIO_CODE}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          등급 셀을 더블클릭 → radio 버튼으로 S/A/B/C/D 선택
        </p>
        <div style={{ height: 300 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={radioColumns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            pagination={SMALL_PAGINATION}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="Checkbox 에디터"
        description="재직여부 컬럼은 checkbox로 재직/휴직을 토글합니다"
        code={CHECKBOX_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          재직여부 셀을 더블클릭 → checkbox로 재직/휴직 토글
        </p>
        <div style={{ height: 300 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={checkboxColumns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            pagination={SMALL_PAGINATION}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="Number 에디터"
        description="연봉·보너스 컬럼은 input type=number 으로 숫자만 입력합니다. min/max/step 제약 가능."
        code={NUMBER_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          연봉(1,000~20,000, step 100) / 보너스(0~5,000, step 50) 셀을 더블클릭
        </p>
        <div style={{ height: 300 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={numberColumns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            pagination={SMALL_PAGINATION}
          />
        </div>
      </DemoBlock>

      <DemoBlock title="Date 에디터" description="입사일 컬럼은 input type=date 로 날짜를 선택합니다." code={DATE_CODE}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          입사일 셀을 더블클릭 → 날짜 피커로 선택
        </p>
        <div style={{ height: 300 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={dateColumns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            pagination={SMALL_PAGINATION}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="Textarea 에디터"
        description="메모 컬럼은 textarea로 여러 줄 입력을 지원합니다. Ctrl+Enter로 커밋."
        code={TEXTAREA_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          메모 셀을 더블클릭 → textarea에서 여러 줄 입력, Ctrl+Enter 커밋 / Escape 취소
        </p>
        <div style={{ height: 300 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={textareaColumns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            pagination={SMALL_PAGINATION}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="Rating 에디터 (별점)"
        description="점수 컬럼을 별점으로 입력합니다. 클릭한 별 수 × 20 = score."
        code={RATING_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          점수 셀을 더블클릭 → 별(★)을 클릭하여 1~5점 선택 (score = 별 × 20)
        </p>
        <div style={{ height: 300 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={ratingColumns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            pagination={SMALL_PAGINATION}
          />
        </div>
      </DemoBlock>

      <DemoBlock
        title="통합 예제 — 컬럼별 다른 에디터 (10,000건 × 20컬럼)"
        description="각 컬럼 특성에 맞게 에디터를 혼합 적용. 셀을 더블클릭하세요."
        code={MIXED_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          이름·이메일 = 텍스트 &nbsp;|&nbsp; 부서·레벨·고용형태·직급 = Select &nbsp;|&nbsp; 등급 = Radio &nbsp;|&nbsp;
          재직여부 = Checkbox &nbsp;|&nbsp; 연봉·보너스 = Number &nbsp;|&nbsp; 입사일 = Date &nbsp;|&nbsp; 메모 =
          Textarea &nbsp;|&nbsp; 점수 = Rating
        </p>
        <div style={{ height: 560 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={columns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            scroll={{ x: 2400 }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: [50, 100, 200],
              showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
            }}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
