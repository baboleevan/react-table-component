import { useState, useEffect, useCallback, useMemo } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType, SorterResult } from '@/components/DataGrid'
import { EMPLOYEE_DATA, type Employee } from '@/preview/mockData'
import { DemoBlock } from '@/preview/components/DemoBlock'

/** 데모용 부분 데이터 (전체 정렬 시뮬레이션 부담 완화) */
const SOURCE = EMPLOYEE_DATA.slice(0, 4000)

interface FetchSortedParams {
  sortField?: string
  sortOrder?: 'ascend' | 'descend'
}

function fetchSortedRows({ sortField, sortOrder }: FetchSortedParams): Promise<Employee[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const rows = [...SOURCE]
      if (sortField && sortOrder) {
        rows.sort((a, b) => {
          const va = (a as unknown as Record<string, unknown>)[sortField]
          const vb = (b as unknown as Record<string, unknown>)[sortField]
          if (va === vb) return 0
          const cmp = va! < vb! ? -1 : 1
          return sortOrder === 'descend' ? -cmp : cmp
        })
      }
      resolve(rows)
    }, 450)
  })
}

const CODE = `// 서버(또는 API)에서만 정렬할 때
const [data, setData] = useState<Employee[]>([])
const [loading, setLoading] = useState(false)
const [sortKey, setSortKey] = useState<string | undefined>()
const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | undefined>()

const load = useCallback(async () => {
  setLoading(true)
  const rows = await fetchSortedRows({ sortField: sortKey, sortOrder })
  setData(rows)
  setLoading(false)
}, [sortKey, sortOrder])

useEffect(() => { void load() }, [load])

const columns = useMemo(() => [
  {
    key: 'name',
    title: '이름',
    dataIndex: 'name',
    sorter: true,
    sortOrder: sortKey === 'name' ? sortOrder : undefined,
  },
  // … 다른 컬럼도 동일 패턴
], [sortKey, sortOrder])

<DataGrid<Employee>
  sortRemote
  dataSource={data}
  columns={columns}
  loading={loading}
  onChange={(_pag, _filters, sorter) => {
    const one = Array.isArray(sorter) ? sorter[0] : sorter
    setSortKey(one?.columnKey)
    setSortOrder(one?.order === 'ascend' || one?.order === 'descend' ? one.order : undefined)
  }}
/>`

export function ServerSortDemo() {
  const [data, setData] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    const rows = await fetchSortedRows({ sortField: sortKey, sortOrder })
    setData(rows)
    setLoading(false)
  }, [sortKey, sortOrder])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load 내부에서 setState
    void load()
  }, [load])

  const applySorterFromChange = useCallback((sorter: SorterResult<Employee> | SorterResult<Employee>[]) => {
    const one = Array.isArray(sorter) ? sorter[0] : sorter
    const key = one?.columnKey ?? undefined
    const ord = one?.order
    setSortKey(key)
    setSortOrder(ord === 'ascend' || ord === 'descend' ? ord : undefined)
  }, [])

  const columns = useMemo(
    (): ColumnType<Employee>[] => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 72, fixed: 'left' },
      {
        key: 'name',
        title: '이름',
        dataIndex: 'name',
        width: 100,
        fixed: 'left',
        sorter: true,
        sortOrder: sortKey === 'name' ? sortOrder : undefined,
      },
      { key: 'dept', title: '부서', dataIndex: 'dept', width: 96, sorter: true, sortOrder: sortKey === 'dept' ? sortOrder : undefined },
      { key: 'team', title: '팀', dataIndex: 'team', width: 88 },
      {
        key: 'salary',
        title: '연봉(만)',
        dataIndex: 'salary',
        width: 104,
        align: 'right',
        sorter: true,
        sortOrder: sortKey === 'salary' ? sortOrder : undefined,
        render: (v) => (v as number).toLocaleString(),
      },
      {
        key: 'joinDate',
        title: '입사일',
        dataIndex: 'joinDate',
        width: 112,
        sorter: true,
        sortOrder: sortKey === 'joinDate' ? sortOrder : undefined,
      },
      { key: 'city', title: '도시', dataIndex: 'city', width: 96, sorter: true, sortOrder: sortKey === 'city' ? sortOrder : undefined },
    ],
    [sortKey, sortOrder],
  )

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">서버 정렬 (sortRemote)</h1>
      <p className="demo-page__desc">
        헤더 클릭 시 <code>onChange</code>로 정렬 요청만 보내고, 응답으로 받은 <code>dataSource</code> 순서를 그대로 표시합니다.
        <code> sortRemote</code>를 켜면 클라이언트에서 다시 정렬하지 않습니다. 컬럼의 <code>sortOrder</code>로 헤더 화살표를 맞추세요.
      </p>

      <DemoBlock
        title={`가짜 API 정렬 (${SOURCE.length.toLocaleString()}건, 450ms 지연)`}
        description="sortRemote + columns[].sortOrder + onChange(sorter) 패턴입니다."
        code={CODE}
      >
        <div style={{ height: 520 }}>
          <DataGrid<Employee>
            sortRemote
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 900, y: 440 }}
            onChange={(_pagination, _filters, sorter) => {
              applySorterFromChange(sorter)
            }}
          />
        </div>
      </DemoBlock>
    </div>
  )
}
