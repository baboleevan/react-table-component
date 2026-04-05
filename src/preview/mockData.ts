// ──────────────────────────────────────────────────────────────────
// 공유 목업 데이터 — 26컬럼 × 10,000행
// 렌더링/편집 성능 검증을 위해 모든 데모 페이지에서 공통으로 사용합니다.
// ──────────────────────────────────────────────────────────────────

export interface Employee {
  id: number
  name: string
  email: string
  phone: string
  dept: string
  team: string
  position: string
  level: string
  salary: number
  bonus: number
  age: number
  gender: string
  city: string
  country: string
  joinDate: string
  contractType: string
  status: string
  score: number
  grade: string
  manager: string
  project: string
  budget: number
  revenue: number
  cost: number
  profitRate: number
  memo: string
}

const DEPTS    = ['개발', '디자인', '기획', '마케팅', 'QA', '인프라', '데이터', '보안']
const TEAMS    = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']
const POSITIONS = ['사원', '주임', '대리', '과장', '차장', '부장', '이사']
const LEVELS   = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal']
const CITIES   = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '수원', '창원', '고양']
const GRADES   = ['S', 'A', 'B', 'C', 'D']
const STATUSES = ['재직', '휴직', '수습', '파견']
const CONTRACTS = ['정규직', '계약직', '파트타임', '프리랜서']
const PROJECTS = ['Phoenix', 'Atlas', 'Hermes', 'Poseidon', 'Apollo', 'Artemis', 'Hera', 'Ares']
const MANAGERS = ['김민준', '이서연', '박도윤', '정시아', '최준서', '윤하은', '임지호', '한소율']

const FIRST = ['김', '이', '박', '정', '최', '윤', '임', '한', '오', '서', '신', '권', '황', '안', '송']
const LAST  = ['민준', '서연', '도윤', '시아', '준서', '하은', '지호', '소율', '수빈', '예린',
               '태양', '지훈', '나연', '현우', '은지', '승현', '아린', '재원', '다은', '성민']

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

function genDate(seed: number): string {
  const y = 2010 + (seed % 14)
  const m = String((seed % 12) + 1).padStart(2, '0')
  const d = String((seed % 28) + 1).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const EMPLOYEE_DATA: Employee[] = Array.from({ length: 10_000 }, (_, i) => {
  const n = i + 1
  const name = pick(FIRST, n * 7) + pick(LAST, n * 13)
  const dept = pick(DEPTS, n * 3)
  const salary = 2800 + ((n * 17) % 6000)
  const revenue = salary * (1 + ((n * 11) % 5))
  const cost = Math.round(revenue * (0.4 + (n % 3) * 0.1))
  const profitRate = Math.round(((revenue - cost) / revenue) * 1000) / 10

  return {
    id: n,
    name,
    email: `user${n}@company.kr`,
    phone: `010-${String(1000 + (n % 9000)).padStart(4, '0')}-${String(1000 + ((n * 7) % 9000)).padStart(4, '0')}`,
    dept,
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
    profitRate,
    memo: `메모 ${n}`,
  }
})
