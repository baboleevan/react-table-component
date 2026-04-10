import { useState, useEffect, useCallback, useMemo } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '@/preview/mockData'
import { DemoBlock } from '@/preview/components/DemoBlock'

// ──────────────────────────────────────────────
// 가짜 API — 서버 사이드 페이지네이션을 시뮬레이션합니다
// ──────────────────────────────────────────────
interface FetchParams {
  page: number
  pageSize: number
  sortKey?: string
  sortOrder?: 'ascend' | 'descend'
}

interface FetchResult {
  data: Employee[]
  total: number
}

function fetchEmployees({ page, pageSize, sortKey, sortOrder }: FetchParams): Promise<FetchResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let source = [...EMPLOYEE_DATA]
      if (sortKey && sortOrder) {
        source.sort((a, b) => {
          const va = (a as unknown as Record<string, unknown>)[sortKey]
          const vb = (b as unknown as Record<string, unknown>)[sortKey]
          if (va === vb) return 0
          const cmp = va! < vb! ? -1 : 1
          return sortOrder === 'descend' ? -cmp : cmp
        })
      }
      const start = (page - 1) * pageSize
      resolve({ data: source.slice(start, start + pageSize), total: source.length })
    }, 400) // 400 ms 가짜 지연
  })
}

const STATUS_COLORS: Record<string, string> = {
  재직: '#52c41a',
  휴직: '#ff4d4f',
  수습: '#1677ff',
  파견: '#722ed1',
}

const CODE = `// 서버 페이지네이션 패턴
const [data, setData]       = useState<Employee[]>([])
const [total, setTotal]     = useState(0)
const [page, setPage]       = useState(1)
const [pageSize, setPageSize] = useState(50)
const [loading, setLoading] = useState(false)

const load = useCallback(async (p: number, ps: number) => {
  setLoading(true)
  const res = await fetchEmployees({ page: p, pageSize: ps })
  setData(res.data)
  setTotal(res.total)
  setLoading(false)
}, [])

useEffect(() => { load(page, pageSize) }, [page, pageSize, load])

<DataGrid<Employee>
  dataSource={data}
  loading={loading}
  pagination={{
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    pageSizeOptions: [25, 50, 100],
    showTotal: (t, [s, e]) => \`\${s}-\${e} / 총 \${t}건\`,
    onChange: (p, ps) => { setPage(p); setPageSize(ps) },
  }}
/>`

export function ServerPaginationDemo() {
  const [data, setData] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | undefined>()

  const load = useCallback(async (p: number, ps: number, sk?: string, so?: 'ascend' | 'descend') => {
    setLoading(true)
    const res = await fetchEmployees({ page: p, pageSize: ps, sortKey: sk, sortOrder: so })
    setData(res.data)
    setTotal(res.total)
    setLoading(false)
  }, [])

  useEffect(() => {
    // 서버 데이터 동기화: 페이지/정렬 변경 시 fetch (데모용)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load 내부에서 setState
    load(page, pageSize, sortKey, sortOrder)
  }, [page, pageSize, sortKey, sortOrder, load])

  const handleChange = useCallback(
    (
      pag: { current?: number; pageSize?: number },
      _filters: unknown,
      sorter: { columnKey?: string; order?: string | null } | Array<{ columnKey?: string; order?: string | null }>,
    ) => {
      const newPage = pag.current ?? 1
      const newSize = pag.pageSize ?? pageSize
      const one = Array.isArray(sorter) ? sorter[0] : sorter
      const newKey = one?.columnKey ?? undefined
      const rawOrd = one?.order
      const newOrd = rawOrd === 'ascend' || rawOrd === 'descend' ? rawOrd : undefined

      setPage(newPage)
      setPageSize(newSize)
      setSortKey(newKey)
      setSortOrder(newOrd)
    },
    [pageSize],
  )

  const columns = useMemo(
    (): ColumnType<Employee>[] => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 70, fixed: 'left' },
      { key: 'name', title: '이름', dataIndex: 'name', width: 110, fixed: 'left', sorter: true },
      { key: 'email', title: '이메일', dataIndex: 'email', width: 200, ellipsis: true },
      { key: 'phone', title: '전화번호', dataIndex: 'phone', width: 150 },
      { key: 'dept', title: '부서', dataIndex: 'dept', width: 100, sorter: true },
      { key: 'team', title: '팀', dataIndex: 'team', width: 90 },
      { key: 'position', title: '직급', dataIndex: 'position', width: 90, sorter: true },
      { key: 'level', title: '레벨', dataIndex: 'level', width: 100, sorter: true },
      {
        key: 'salary',
        title: '연봉(만)',
        dataIndex: 'salary',
        width: 110,
        align: 'right',
        sorter: true,
        render: (v) => (v as number).toLocaleString(),
      },
      { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center', sorter: true },
      { key: 'gender', title: '성별', dataIndex: 'gender', width: 70, align: 'center' },
      { key: 'city', title: '도시', dataIndex: 'city', width: 90, sorter: true },
      { key: 'joinDate', title: '입사일', dataIndex: 'joinDate', width: 110, sorter: true },
      { key: 'contractType', title: '고용형태', dataIndex: 'contractType', width: 100 },
      {
        key: 'status',
        title: '상태',
        dataIndex: 'status',
        width: 90,
        align: 'center',
        sorter: true,
        render: (v) => (
          <span style={{ color: STATUS_COLORS[v as string] ?? '#000', fontWeight: 500 }}>{v as string}</span>
        ),
      },
      { key: 'score', title: '점수', dataIndex: 'score', width: 80, align: 'center', sorter: true },
      { key: 'grade', title: '등급', dataIndex: 'grade', width: 70, align: 'center', sorter: true },
      { key: 'project', title: '프로젝트', dataIndex: 'project', width: 110 },
      {
        key: 'revenue',
        title: '매출(만)',
        dataIndex: 'revenue',
        width: 110,
        align: 'right',
        sorter: true,
        render: (v) => (v as number).toLocaleString(),
      },
      {
        key: 'profitRate',
        title: '수익률(%)',
        dataIndex: 'profitRate',
        width: 110,
        align: 'right',
        sorter: true,
      },
      { key: 'memo', title: '메모', dataIndex: 'memo', width: 160, ellipsis: true, fixed: 'right' },
    ],
    [],
  )

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">서버 페이지네이션</h1>
      <p className="demo-page__desc">
        페이지 이동 · 정렬 · 페이지 크기 변경 시 API를 호출합니다 (400 ms 지연 시뮬레이션). 실제 프로젝트에서는{' '}
        <code>fetchEmployees</code>를 실제 API 호출로 교체하세요.
      </p>

      <DemoBlock
        title="API 페이지네이션 (10,000건 × 21컬럼)"
        description="controlled pagination: current + total + onChange 를 모두 지정합니다."
        code={CODE}
      >
        <div style={{ height: 560 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 2200 }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [25, 50, 100],
              showTotal: (t, [s, e]) => `${s}-${e} / 총 ${t}건`,
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              },
            }}
            onChange={handleChange}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
