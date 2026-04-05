import { useState, useMemo } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType } from '@/components/DataGrid'
import type { Employee } from '../mockData'
import { DemoBlock } from '../components/DemoBlock'

// ──────────────────────────────────────────────
// 100,000행 생성 (mockData와 동일한 알고리즘)
// ──────────────────────────────────────────────
const DEPTS = ['개발', '디자인', '기획', '마케팅', 'QA', '인프라', '데이터', '보안']
const TEAMS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']
const POSITIONS = ['사원', '주임', '대리', '과장', '차장', '부장', '이사']
const LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal']
const CITIES = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '수원', '창원', '고양']
const GRADES = ['S', 'A', 'B', 'C', 'D']
const STATUSES = ['재직', '휴직', '수습', '파견']
const CONTRACTS = ['정규직', '계약직', '파트타임', '프리랜서']
const PROJECTS = ['Phoenix', 'Atlas', 'Hermes', 'Poseidon', 'Apollo', 'Artemis', 'Hera', 'Ares']
const MANAGERS = ['김민준', '이서연', '박도윤', '정시아', '최준서', '윤하은', '임지호', '한소율']
const FIRST = ['김', '이', '박', '정', '최', '윤', '임', '한', '오', '서', '신', '권', '황', '안', '송']
const LAST = [
  '민준',
  '서연',
  '도윤',
  '시아',
  '준서',
  '하은',
  '지호',
  '소율',
  '수빈',
  '예린',
  '태양',
  '지훈',
  '나연',
  '현우',
  '은지',
  '승현',
  '아린',
  '재원',
  '다은',
  '성민',
]

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}
function genDate(seed: number): string {
  const y = 2010 + (seed % 14)
  const m = String((seed % 12) + 1).padStart(2, '0')
  const d = String((seed % 28) + 1).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const ALL_DATA: Employee[] = Array.from({ length: 100_000 }, (_, i) => {
  const n = i + 1
  const name = pick(FIRST, n * 7) + pick(LAST, n * 13)
  const salary = 2800 + ((n * 17) % 6000)
  const revenue = salary * (1 + ((n * 11) % 5))
  const cost = Math.round(revenue * (0.4 + (n % 3) * 0.1))
  return {
    id: n,
    name,
    email: `user${n}@company.kr`,
    phone: `010-${String(1000 + (n % 9000)).padStart(4, '0')}-${String(1000 + ((n * 7) % 9000)).padStart(4, '0')}`,
    dept: pick(DEPTS, n * 3),
    team: pick(TEAMS, n * 5),
    position: pick(POSITIONS, n * 2),
    level: pick(LEVELS, n * 4),
    salary,
    bonus: Math.round(salary * (0.05 + (n % 4) * 0.05)),
    age: 22 + (n % 38),
    gender: n % 2 === 0 ? '남' : '여',
    city: pick(CITIES, n * 6),
    country: '대한민국',
    joinDate: genDate(n),
    contractType: pick(CONTRACTS, n * 9),
    status: pick(STATUSES, n * 8),
    score: 40 + (n % 61),
    grade: pick(GRADES, n % 5),
    manager: pick(MANAGERS, n * 11),
    project: pick(PROJECTS, n * 7),
    budget: 1000 + ((n * 13) % 9000),
    revenue,
    cost,
    profitRate: Math.round(((revenue - cost) / revenue) * 1000) / 10,
    memo: `메모 ${n}`,
  }
})

const STATUS_COLORS: Record<string, string> = {
  재직: '#52c41a',
  휴직: '#ff4d4f',
  수습: '#1677ff',
  파견: '#722ed1',
}

const CODE = `// 10만 행 가상화 + 정렬 + 선택 + 편집 + 고정 컬럼
<DataGrid<Employee>
  dataSource={data}
  columns={columns}
  rowKey="id"
  virtual          // 명시적 가상화 활성화
  pagination={false}
  rowSelection={{ type: 'checkbox', selectedRowKeys, onChange }}
  onCellEdit={handleCellEdit}
  editMode="dblclick"
  scroll={{ x: 2400 }}
  striped
/>`

export function AllFeaturesDemo() {
  const [data, setData] = useState<Employee[]>(ALL_DATA)
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([])

  const handleCellEdit = (rowKey: string | number, colKey: string, newValue: unknown) => {
    setData((prev) => prev.map((r) => (r.id === rowKey ? { ...r, [colKey]: newValue } : r)))
  }

  const columns = useMemo(
    (): ColumnType<Employee>[] => [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 70, fixed: 'left', sorter: true },
      { key: 'name', title: '이름', dataIndex: 'name', width: 110, fixed: 'left', editable: true, sorter: true },
      { key: 'email', title: '이메일', dataIndex: 'email', width: 200, editable: true, ellipsis: true },
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
        editable: true,
        sorter: (a, b) => a.salary - b.salary,
        render: (v) => (v as number).toLocaleString(),
      },
      {
        key: 'bonus',
        title: '보너스',
        dataIndex: 'bonus',
        width: 100,
        align: 'right',
        editable: true,
        sorter: (a, b) => a.bonus - b.bonus,
        render: (v) => (v as number).toLocaleString(),
      },
      { key: 'age', title: '나이', dataIndex: 'age', width: 70, align: 'center', sorter: (a, b) => a.age - b.age },
      { key: 'gender', title: '성별', dataIndex: 'gender', width: 70, align: 'center' },
      { key: 'city', title: '도시', dataIndex: 'city', width: 90, sorter: true },
      { key: 'joinDate', title: '입사일', dataIndex: 'joinDate', width: 110, sorter: true },
      { key: 'contractType', title: '고용형태', dataIndex: 'contractType', width: 100, sorter: true },
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
      {
        key: 'score',
        title: '점수',
        dataIndex: 'score',
        width: 80,
        align: 'center',
        editable: true,
        sorter: (a, b) => a.score - b.score,
      },
      { key: 'grade', title: '등급', dataIndex: 'grade', width: 70, align: 'center', sorter: true },
      { key: 'manager', title: '담당자', dataIndex: 'manager', width: 100 },
      { key: 'project', title: '프로젝트', dataIndex: 'project', width: 110 },
      {
        key: 'budget',
        title: '예산(만)',
        dataIndex: 'budget',
        width: 110,
        align: 'right',
        sorter: (a, b) => a.budget - b.budget,
        render: (v) => (v as number).toLocaleString(),
      },
      {
        key: 'revenue',
        title: '매출(만)',
        dataIndex: 'revenue',
        width: 110,
        align: 'right',
        sorter: (a, b) => a.revenue - b.revenue,
        render: (v) => (v as number).toLocaleString(),
      },
      {
        key: 'profitRate',
        title: '수익률(%)',
        dataIndex: 'profitRate',
        width: 110,
        align: 'right',
        sorter: (a, b) => a.profitRate - b.profitRate,
      },
      { key: 'memo', title: '메모', dataIndex: 'memo', width: 160, editable: true, ellipsis: true, fixed: 'right' },
    ],
    [],
  )

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">전체 기능 통합 (10만 행)</h1>
      <p className="demo-page__desc">
        가상화 렌더링으로 10만 행을 부드럽게 스크롤합니다. 정렬 · 체크박스 선택 · 더블클릭 편집 · 고정 컬럼 · 키보드
        내비게이션이 모두 동작합니다.
      </p>
      <p style={{ fontSize: 13, color: 'rgba(0,0,0,.45)', marginBottom: 8 }}>
        선택된 행: <strong>{selectedKeys.length}</strong>개 &nbsp;|&nbsp; 총 데이터: <strong>100,000</strong>건
      </p>

      <DemoBlock
        title="10만 행 × 24컬럼 — 가상화 + 모든 기능"
        description="pagination={false} + virtual 로 전체 데이터를 한 번에 렌더링. 정렬·편집·선택 모두 지원."
        code={CODE}
      >
        <div style={{ height: 600 }}>
          <DataGrid<Employee>
            dataSource={data}
            columns={columns}
            rowKey="id"
            virtual
            pagination={false}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedKeys,
              onChange: (keys) => setSelectedKeys(keys),
            }}
            onCellEdit={handleCellEdit}
            editMode="dblclick"
            scroll={{ x: 2400 }}
            striped
          />
        </div>
      </DemoBlock>
    </div>
  )
}
