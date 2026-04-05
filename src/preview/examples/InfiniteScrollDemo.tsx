import { useState, useEffect, useCallback, useMemo } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

// ──────────────────────────────────────────────
// 가짜 API — 페이지 데이터를 반환합니다 (500 ms 지연)
// ──────────────────────────────────────────────
const PAGE_SIZE = 50

function fetchPage(page: number): Promise<{ data: Employee[]; hasMore: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const start = (page - 1) * PAGE_SIZE
      const slice = EMPLOYEE_DATA.slice(start, start + PAGE_SIZE)
      resolve({ data: slice, hasMore: start + PAGE_SIZE < EMPLOYEE_DATA.length })
    }, 500)
  })
}

const STATUS_COLORS: Record<string, string> = {
  재직: '#52c41a',
  휴직: '#ff4d4f',
  수습: '#1677ff',
  파견: '#722ed1',
}

const CODE = `// onScroll prop으로 스크롤 하단 감지
function handleGridScroll(e: React.UIEvent<HTMLDivElement>) {
  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
  if (scrollHeight - scrollTop - clientHeight < 120 && hasMore && !loading) {
    loadMore()
  }
}

<DataGrid<Employee>
  dataSource={rows}
  columns={columns}
  rowKey="id"
  pagination={false}
  virtual
  onScroll={handleGridScroll}
  loading={loading}
/>`

export function InfiniteScrollDemo() {
  const [rows, setRows] = useState<Employee[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  // 동일 렌더 사이클에서 중복 호출을 방지하기 위한 ref 유사 플래그
  const [loadingRef, setLoadingRef] = useState(false)

  const loadMore = useCallback(async () => {
    if (loadingRef || !hasMore) return
    setLoadingRef(true)
    setLoading(true)
    const nextPage = page + 1
    const res = await fetchPage(nextPage)
    setRows((prev) => [...prev, ...res.data])
    setPage(nextPage)
    setHasMore(res.hasMore)
    setLoading(false)
    setLoadingRef(false)
  }, [loadingRef, hasMore, page])

  // 초기 로드
  useEffect(() => {
    fetchPage(1).then((res) => {
      setRows(res.data)
      setPage(1)
      setHasMore(res.hasMore)
    })
  }, [])

  // 스크롤 핸들러 — 하단에서 120px 이내일 때 추가 로드를 트리거합니다
  const handleGridScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop - clientHeight < 120 && hasMore && !loading) {
        loadMore()
      }
    },
    [hasMore, loading, loadMore],
  )

  const columns = useMemo(
    (): ColumnType<Employee>[] => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 70, fixed: 'left' },
      { key: 'name', title: '이름', dataIndex: 'name', width: 110, fixed: 'left' },
      { key: 'email', title: '이메일', dataIndex: 'email', width: 200, ellipsis: true },
      { key: 'phone', title: '전화번호', dataIndex: 'phone', width: 150 },
      { key: 'dept', title: '부서', dataIndex: 'dept', width: 100 },
      { key: 'team', title: '팀', dataIndex: 'team', width: 90 },
      { key: 'position', title: '직급', dataIndex: 'position', width: 90 },
      { key: 'level', title: '레벨', dataIndex: 'level', width: 100 },
      {
        key: 'salary',
        title: '연봉(만)',
        dataIndex: 'salary',
        width: 110,
        align: 'right',
        render: (v) => (v as number).toLocaleString(),
      },
      { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center' },
      { key: 'gender', title: '성별', dataIndex: 'gender', width: 70, align: 'center' },
      { key: 'city', title: '도시', dataIndex: 'city', width: 90 },
      { key: 'joinDate', title: '입사일', dataIndex: 'joinDate', width: 110 },
      { key: 'contractType', title: '고용형태', dataIndex: 'contractType', width: 100 },
      {
        key: 'status',
        title: '상태',
        dataIndex: 'status',
        width: 90,
        align: 'center',
        render: (v) => (
          <span style={{ color: STATUS_COLORS[v as string] ?? '#000', fontWeight: 500 }}>{v as string}</span>
        ),
      },
      { key: 'score', title: '점수', dataIndex: 'score', width: 80, align: 'center' },
      { key: 'grade', title: '등급', dataIndex: 'grade', width: 70, align: 'center' },
      { key: 'project', title: '프로젝트', dataIndex: 'project', width: 110 },
      {
        key: 'revenue',
        title: '매출(만)',
        dataIndex: 'revenue',
        width: 110,
        align: 'right',
        render: (v) => (v as number).toLocaleString(),
      },
      { key: 'profitRate', title: '수익률(%)', dataIndex: 'profitRate', width: 110, align: 'right' },
      { key: 'memo', title: '메모', dataIndex: 'memo', width: 160, ellipsis: true, fixed: 'right' },
    ],
    [],
  )

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">무한 스크롤 (Infinite Scroll)</h1>
      <p className="demo-page__desc">
        그리드 하단 근처까지 스크롤하면 다음 50건을 자동으로 불러옵니다 (500 ms 지연 시뮬레이션).
        <code>onScroll</code> prop으로 스크롤 위치를 감지합니다.
      </p>
      <p style={{ fontSize: 13, color: 'rgba(0,0,0,.45)', marginBottom: 8 }}>
        로드된 행: <strong>{rows.length}</strong>건
        {hasMore ? (
          <span style={{ color: '#1677ff' }}> (더 불러올 수 있음)</span>
        ) : (
          <span style={{ color: '#52c41a' }}> (전체 로드 완료)</span>
        )}
        {loading && <span style={{ color: '#fa8c16', marginLeft: 8 }}>⏳ 불러오는 중...</span>}
      </p>

      <DemoBlock
        title="무한 스크롤 — onScroll 기반 (10,000건 × 21컬럼)"
        description="그리드 내부 스크롤 컨테이너 하단 근처에 도달하면 다음 50건을 추가 로드합니다."
        code={CODE}
      >
        <div style={{ height: 560 }}>
          <DataGrid<Employee>
            dataSource={rows}
            columns={columns}
            rowKey="id"
            pagination={false}
            virtual
            onScroll={handleGridScroll}
            loading={loading}
            scroll={{ x: 2200 }}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
