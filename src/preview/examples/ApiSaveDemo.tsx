import { useState, useCallback, useRef } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'
import './ApiSaveDemo.scss'

type DirtyMap = Record<number, Partial<Employee>>
type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

// ── 가짜 API ─────────────────────────────────────
async function fakeApiSave(payload: { id: number; changes: Partial<Employee> }[]): Promise<void> {
  await new Promise((res) => setTimeout(res, 900))
  if (Math.random() < 0.15) throw new Error('서버 오류 (시뮬레이션)')
  console.log('[API] PATCH /employees', payload)
}

// ── 편집 가능한 컬럼 ─────────────────────────────
const makeColumns = (dirty: DirtyMap): ColumnType<Employee>[] => [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 70, fixed: 'left' },
  {
    key: 'name',
    title: '이름',
    dataIndex: 'name',
    width: 100,
    editable: true,
    onCell: (r) => ({ className: dirty[r.id]?.name !== undefined ? 'cell--dirty' : '' }),
  },
  {
    key: 'email',
    title: '이메일',
    dataIndex: 'email',
    width: 200,
    editable: true,
    ellipsis: true,
    onCell: (r) => ({ className: dirty[r.id]?.email !== undefined ? 'cell--dirty' : '' }),
  },
  {
    key: 'phone',
    title: '연락처',
    dataIndex: 'phone',
    width: 150,
    editable: true,
    onCell: (r) => ({ className: dirty[r.id]?.phone !== undefined ? 'cell--dirty' : '' }),
  },
  {
    key: 'dept',
    title: '부서',
    dataIndex: 'dept',
    width: 90,
    editable: true,
    onCell: (r) => ({ className: dirty[r.id]?.dept !== undefined ? 'cell--dirty' : '' }),
  },
  { key: 'team', title: '팀', dataIndex: 'team', width: 90 },
  { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
  { key: 'level', title: '레벨', dataIndex: 'level', width: 100 },
  {
    key: 'salary',
    title: '연봉(만)',
    dataIndex: 'salary',
    width: 110,
    align: 'right',
    editable: true,
    onCell: (r) => ({ className: dirty[r.id]?.salary !== undefined ? 'cell--dirty' : '' }),
  },
  {
    key: 'bonus',
    title: '보너스',
    dataIndex: 'bonus',
    width: 100,
    align: 'right',
    editable: true,
    onCell: (r) => ({ className: dirty[r.id]?.bonus !== undefined ? 'cell--dirty' : '' }),
  },
  { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center' },
  {
    key: 'city',
    title: '도시',
    dataIndex: 'city',
    width: 90,
    editable: true,
    onCell: (r) => ({ className: dirty[r.id]?.city !== undefined ? 'cell--dirty' : '' }),
  },
  { key: 'joinDate', title: '입사일', dataIndex: 'joinDate', width: 110 },
  { key: 'status', title: '상태', dataIndex: 'status', width: 80 },
  {
    key: 'score',
    title: '점수',
    dataIndex: 'score',
    width: 80,
    align: 'center',
    editable: true,
    onCell: (r) => ({ className: dirty[r.id]?.score !== undefined ? 'cell--dirty' : '' }),
  },
  {
    key: 'grade',
    title: '등급',
    dataIndex: 'grade',
    width: 70,
    align: 'center',
    editable: true,
    onCell: (r) => ({ className: dirty[r.id]?.grade !== undefined ? 'cell--dirty' : '' }),
  },
  {
    key: 'project',
    title: '프로젝트',
    dataIndex: 'project',
    width: 110,
    editable: true,
    onCell: (r) => ({ className: dirty[r.id]?.project !== undefined ? 'cell--dirty' : '' }),
  },
  {
    key: 'budget',
    title: '예산(만)',
    dataIndex: 'budget',
    width: 110,
    align: 'right',
    editable: true,
    onCell: (r) => ({ className: dirty[r.id]?.budget !== undefined ? 'cell--dirty' : '' }),
  },
  { key: 'revenue', title: '매출(만)', dataIndex: 'revenue', width: 110, align: 'right' },
  { key: 'profitRate', title: '수익률(%)', dataIndex: 'profitRate', width: 110, align: 'right' },
  {
    key: 'memo',
    title: '메모',
    dataIndex: 'memo',
    width: 180,
    editable: true,
    ellipsis: true,
    fixed: 'right',
    onCell: (r) => ({ className: dirty[r.id]?.memo !== undefined ? 'cell--dirty' : '' }),
  },
]

// ────────────────────────────────────────────────
// 예제 1: 수동 저장 (Save Button)
// ────────────────────────────────────────────────
const BASIC_CODE = `const [data, setData] = useState(EMPLOYEE_DATA)  // 10,000건
const [dirty, setDirty] = useState<Record<number, Partial<Employee>>>({})

const handleCellEdit = (rowKey, colKey, newValue) => {
  // 1. 화면 즉시 반영
  setData(prev =>
    prev.map(r => r.id === rowKey ? { ...r, [colKey]: newValue } : r)
  )
  // 2. 변경 누적 (같은 행을 여러 번 수정해도 최신값만 보관)
  setDirty(prev => ({
    ...prev,
    [rowKey]: { ...prev[rowKey], [colKey]: newValue },
  }))
}

const handleSave = async () => {
  const payload = Object.entries(dirty).map(([id, changes]) => ({
    id: Number(id), changes,
  }))
  await fetch('/api/employees', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  setDirty({})
}`

function SaveButtonExample() {
  const [data, setData] = useState<Employee[]>(EMPLOYEE_DATA)
  const [dirty, setDirty] = useState<DirtyMap>({})
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const dirtyCount = Object.keys(dirty).length
  const columns = makeColumns(dirty)

  const handleCellEdit = useCallback((rowKey: string | number, colKey: string, newValue: unknown) => {
    setData((prev) => prev.map((r) => (r.id === rowKey ? { ...r, [colKey]: newValue } : r)))
    setDirty((prev) => ({
      ...prev,
      [rowKey as number]: { ...prev[rowKey as number], [colKey]: newValue as never },
    }))
  }, [])

  const handleSave = useCallback(async () => {
    if (dirtyCount === 0) return
    setStatus('saving')
    const payload = Object.entries(dirty).map(([id, changes]) => ({ id: Number(id), changes }))
    try {
      await fakeApiSave(payload)
      setDirty({})
      setStatus('success')
      setLastSaved(new Date().toLocaleTimeString())
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [dirty, dirtyCount])

  return (
    <>
      <div className="api-demo-toolbar">
        <span className="api-demo-toolbar__info">
          {dirtyCount > 0
            ? `⚠ ${dirtyCount}개 행 수정됨 (노란 셀)`
            : lastSaved
              ? `✓ ${lastSaved} 저장됨`
              : '수정 사항 없음'}
        </span>
        <button
          className="api-demo-btn api-demo-btn--ghost"
          onClick={() => {
            setData(EMPLOYEE_DATA)
            setDirty({})
            setStatus('idle')
          }}
        >
          초기화
        </button>
        <button
          className={`api-demo-btn api-demo-btn--primary${status === 'saving' ? ' loading' : ''}`}
          onClick={handleSave}
          disabled={dirtyCount === 0 || status === 'saving'}
        >
          {status === 'saving'
            ? '저장 중…'
            : status === 'success'
              ? '저장 완료 ✓'
              : status === 'error'
                ? '오류 발생 ✗'
                : `변경사항 저장 (${dirtyCount}행)`}
        </button>
      </div>
      <div style={{ height: 500 }}>
        <DataGrid<Employee>
          dataSource={data}
          columns={columns}
          rowKey="id"
          onCellEdit={handleCellEdit}
          scroll={{ x: 2200 }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            pageSizeOptions: [50, 100, 200],
            showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
          }}
        />
      </div>
    </>
  )
}

// ────────────────────────────────────────────────
// 예제 2: 자동 저장 (Debounce Auto-Save)
// ────────────────────────────────────────────────
const AUTO_CODE = `const pendingRef = useRef<Record<number, Partial<Employee>>>({})
const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

const handleCellEdit = (rowKey, colKey, newValue) => {
  setData(prev =>
    prev.map(r => r.id === rowKey ? { ...r, [colKey]: newValue } : r)
  )
  pendingRef.current[rowKey] = {
    ...pendingRef.current[rowKey], [colKey]: newValue,
  }
  if (timerRef.current) clearTimeout(timerRef.current)
  timerRef.current = setTimeout(async () => {
    const payload = Object.entries(pendingRef.current).map(([id, changes]) => ({
      id: Number(id), changes,
    }))
    pendingRef.current = {}
    await fetch('/api/employees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }, 1000)
}`

function AutoSaveExample() {
  const [data, setData] = useState<Employee[]>(EMPLOYEE_DATA)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [log, setLog] = useState<string[]>([])

  const pendingRef = useRef<DirtyMap>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)])
  }, [])

  const handleCellEdit = useCallback(
    (rowKey: string | number, colKey: string, newValue: unknown) => {
      setData((prev) => prev.map((r) => (r.id === rowKey ? { ...r, [colKey]: newValue } : r)))
      pendingRef.current[rowKey as number] = {
        ...pendingRef.current[rowKey as number],
        [colKey]: newValue as never,
      }
      setStatus('saving')
      addLog(`편집: id=${rowKey} ${colKey}="${newValue}" — 1초 후 전송`)

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        const payload = Object.entries(pendingRef.current).map(([id, changes]) => ({ id: Number(id), changes }))
        pendingRef.current = {}
        try {
          await fakeApiSave(payload)
          setStatus('success')
          addLog(`전송 성공 — ${payload.length}개 행 PATCH`)
          setTimeout(() => setStatus('idle'), 1500)
        } catch (e) {
          setStatus('error')
          addLog(`오류: ${(e as Error).message}`)
          setTimeout(() => setStatus('idle'), 2000)
        }
      }, 1000)
    },
    [addLog],
  )

  const statusLabel: Record<SaveStatus, string> = {
    idle: '대기 중',
    saving: '⏳ 전송 대기…',
    success: '✓ 저장됨',
    error: '✗ 오류',
  }

  // 자동 저장 예제는 빈 dirty 맵 사용 (노란 강조 표시 불필요)
  const columns = makeColumns({})

  return (
    <>
      <div className="api-demo-toolbar">
        <span className={`api-demo-status api-demo-status--${status}`}>{statusLabel[status]}</span>
      </div>
      <div style={{ height: 440 }}>
        <DataGrid<Employee>
          dataSource={data}
          columns={columns}
          rowKey="id"
          onCellEdit={handleCellEdit}
          scroll={{ x: 2200 }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            pageSizeOptions: [50, 100, 200],
            showTotal: (total, [s, e]) => `${s}-${e} / 총 ${total}건`,
          }}
        />
      </div>
      {log.length > 0 && (
        <div className="api-demo-log">
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </>
  )
}

// ────────────────────────────────────────────────
// 예제 3: 인라인 모드 + 수동 저장
// ────────────────────────────────────────────────
const INLINE_CODE = `const [data, setData] = useState(EMPLOYEE_DATA.slice(0, 200))
const [dirty, setDirty] = useState<Record<number, Partial<Employee>>>({})

const handleCellEdit = (rowKey, colKey, newValue) => {
  setData(prev =>
    prev.map(r => r.id === rowKey ? { ...r, [colKey]: newValue } : r)
  )
  setDirty(prev => ({
    ...prev,
    [rowKey]: { ...prev[rowKey], [colKey]: newValue },
  }))
}

<DataGrid
  dataSource={data}
  columns={columns}
  rowKey="id"
  editMode="inline"   // ← 처음부터 에디터 노출
  onCellEdit={handleCellEdit}
/>`

const INLINE_COLUMNS: ColumnType<Employee>[] = [
  { key: 'id', title: 'ID', dataIndex: 'id', width: 70, fixed: 'left' },
  { key: 'name', title: '이름', dataIndex: 'name', width: 110, editable: true },
  { key: 'email', title: '이메일', dataIndex: 'email', width: 200, editable: true, ellipsis: true },
  { key: 'phone', title: '연락처', dataIndex: 'phone', width: 150, editable: true },
  { key: 'dept', title: '부서', dataIndex: 'dept', width: 100, editable: true },
  { key: 'team', title: '팀', dataIndex: 'team', width: 90 },
  { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
  { key: 'salary', title: '연봉(만)', dataIndex: 'salary', width: 110, align: 'right', editable: true },
  { key: 'bonus', title: '보너스', dataIndex: 'bonus', width: 100, align: 'right', editable: true },
  { key: 'city', title: '도시', dataIndex: 'city', width: 100, editable: true },
  { key: 'project', title: '프로젝트', dataIndex: 'project', width: 120, editable: true },
  { key: 'memo', title: '메모', dataIndex: 'memo', width: 180, editable: true, ellipsis: true, fixed: 'right' },
]

function InlineSaveExample() {
  const [data, setData] = useState<Employee[]>(EMPLOYEE_DATA.slice(0, 200))
  const [dirty, setDirty] = useState<DirtyMap>({})
  const [status, setStatus] = useState<SaveStatus>('idle')

  const dirtyCount = Object.keys(dirty).length

  const handleCellEdit = useCallback((rowKey: string | number, colKey: string, newValue: unknown) => {
    setData((prev) => prev.map((r) => (r.id === rowKey ? { ...r, [colKey]: newValue } : r)))
    setDirty((prev) => ({
      ...prev,
      [rowKey as number]: { ...prev[rowKey as number], [colKey]: newValue as never },
    }))
  }, [])

  const handleSave = useCallback(async () => {
    if (dirtyCount === 0) return
    setStatus('saving')
    const payload = Object.entries(dirty).map(([id, changes]) => ({ id: Number(id), changes }))
    try {
      await fakeApiSave(payload)
      setDirty({})
      setStatus('success')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [dirty, dirtyCount])

  return (
    <>
      <div className="api-demo-toolbar">
        <span className="api-demo-toolbar__info">
          {dirtyCount > 0 ? `${dirtyCount}개 행 수정됨` : '수정 사항 없음'}
        </span>
        <button
          className="api-demo-btn api-demo-btn--ghost"
          onClick={() => {
            setData(EMPLOYEE_DATA.slice(0, 200))
            setDirty({})
            setStatus('idle')
          }}
        >
          초기화
        </button>
        <button
          className={`api-demo-btn api-demo-btn--primary${status === 'saving' ? ' loading' : ''}`}
          onClick={handleSave}
          disabled={dirtyCount === 0 || status === 'saving'}
        >
          {status === 'saving'
            ? '저장 중…'
            : status === 'success'
              ? '저장 완료'
              : status === 'error'
                ? '오류 발생'
                : `변경사항 저장 (${dirtyCount}행)`}
        </button>
      </div>
      <div style={{ height: 500 }}>
        <DataGrid<Employee>
          dataSource={data}
          columns={INLINE_COLUMNS}
          rowKey="id"
          editMode="inline"
          onCellEdit={handleCellEdit}
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
            showTotal: (total: number, [s, e]: [number, number]) => `${s}-${e} / 총 ${total}건`,
          }}
        />
      </div>
    </>
  )
}

// ────────────────────────────────────────────────
// 페이지
// ────────────────────────────────────────────────
export function ApiSaveDemo() {
  return (
    <div className="demo-page">
      <h1 className="demo-page__title">API 저장 (편집 → 전송)</h1>
      <p className="demo-page__desc">
        셀을 편집하고 API로 전송하는 세 가지 패턴입니다. API는 시뮬레이션이며 15% 확률로 오류가 발생합니다.
      </p>

      <DemoBlock
        title="수동 저장 — Save Button (10,000건)"
        description="변경 셀은 노란색으로 표시됩니다. 저장 버튼 클릭 시 변경 행만 일괄 PATCH 전송합니다."
        code={BASIC_CODE}
      >
        <SaveButtonExample />
      </DemoBlock>

      <DemoBlock
        title="자동 저장 — Debounce Auto-Save (10,000건)"
        description="편집 완료 후 1초 동안 추가 입력이 없으면 변경 행을 자동으로 일괄 전송합니다."
        code={AUTO_CODE}
      >
        <AutoSaveExample />
      </DemoBlock>

      <DemoBlock
        title="인라인 편집 + 수동 저장 (200건)"
        description='editMode="inline"으로 에디터가 처음부터 노출됩니다. 편집된 셀은 노란 배경으로 표시되고, 원래 값으로 되돌리면 배경이 해제됩니다.'
        code={INLINE_CODE}
      >
        <InlineSaveExample />
      </DemoBlock>
    </div>
  )
}
