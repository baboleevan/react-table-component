import { useState, useRef } from 'react'
import { DataGrid } from '@/components/DataGrid'
import type { ColumnType, DataGridHandle, ValidateError } from '@/components/DataGrid'
import { DemoBlock } from '../components/DemoBlock'

// ──────────────────────────────────────────────
// 교차 컬럼 검증용 데이터
// ──────────────────────────────────────────────
interface PriceRange {
  id: number
  name: string
  minPrice: number
  maxPrice: number
  stock: number
  discount: number   // 할인율 (%)
}

const RANGE_DATA: PriceRange[] = [
  { id: 1, name: '노트북 Pro',    minPrice: 800000,  maxPrice: 1500000, stock: 5,  discount: 10 },
  { id: 2, name: '마우스',        minPrice: 50000,   maxPrice: 30000,   stock: 20, discount: 5  },
  { id: 3, name: '모니터 27"',   minPrice: 300000,  maxPrice: 500000,  stock: 0,  discount: 20 },
  { id: 4, name: '기계식 키보드', minPrice: 150000,  maxPrice: 150000,  stock: 8,  discount: 0  },
  { id: 5, name: '마우스 패드',   minPrice: 10000,   maxPrice: 25000,   stock: 50, discount: 110 },
]

// ──────────────────────────────────────────────
// 샘플 데이터
// ──────────────────────────────────────────────
interface Product {
  id: number
  name: string
  price: number
  stock: number
  category: string
  email: string
  code: string
}

const INITIAL_DATA: Product[] = [
  { id: 1, name: '노트북 Pro',    price: 1500000, stock: 5,  category: '전자기기', email: 'user@example.com', code: 'EL-001' },
  { id: 2, name: '',              price: -1000,   stock: -3, category: '',         email: 'invalid-email',    code: '' },
  { id: 3, name: '기계식 키보드', price: 180000,  stock: 20, category: '주변기기', email: 'kb@shop.com',      code: 'PH-003' },
  { id: 4, name: '모니터 27"',   price: 0,       stock: 0,  category: '전자기기', email: '',                 code: 'EL-004' },
  { id: 5, name: '마우스 패드',   price: 15000,   stock: 50, category: '주변기기', email: 'pad@shop.co.kr',   code: 'PH-005' },
]

// ──────────────────────────────────────────────
// 코드 스니펫
// ──────────────────────────────────────────────
const ONBLUR_CODE = `// onBlur 트리거 — 편집 완료 시 자동 검증
const columns: ColumnType<Product>[] = [
  {
    key: 'name', title: '상품명', editable: true,
    validator: (value) => {
      if (!value || String(value).trim() === '')
        return { status: 'error', message: '상품명은 필수입니다' }
      if (String(value).length < 2)
        return { status: 'warning', message: '2자 이상 입력을 권장합니다' }
      return null  // null → 성공
    },
    validateTrigger: 'onBlur',  // 기본값이므로 생략 가능
  },
  {
    key: 'price', title: '가격', editable: true,
    validator: (value) => {
      const n = Number(value)
      if (isNaN(n) || n <= 0)
        return { status: 'error', message: '0보다 큰 숫자를 입력하세요' }
      return null
    },
  },
]

<DataGrid dataSource={data} columns={columns} onCellEdit={handleCellEdit} />`

const ASYNC_CODE = `// 비동기 validator — API 중복 확인 등
{
  key: 'code', title: '상품코드', editable: true,
  validator: async (value) => {
    if (!value) return { status: 'error', message: '코드는 필수입니다' }
    // 서버 API 호출 시뮬레이션
    const isDuplicate = await checkDuplicate(String(value))
    if (isDuplicate)
      return { status: 'error', message: '이미 사용 중인 코드입니다' }
    return null  // 성공
  },
}`

const CROSS_COL_CODE = `// 교차 컬럼 검증 — record(같은 행의 다른 컬럼) 및 dataSource(전체 데이터) 활용
const columns: ColumnType<PriceRange>[] = [
  {
    key: 'minPrice', title: '최저가', editable: true,
    // record로 같은 행의 maxPrice와 비교
    validator: (value, record) => {
      const min = Number(value)
      const max = Number((record as PriceRange).maxPrice)
      if (isNaN(min) || min <= 0)
        return { status: 'error', message: '0보다 큰 숫자를 입력하세요' }
      if (min >= max)
        return { status: 'error', message: '최저가는 최고가보다 작아야 합니다' }
      return null
    },
  },
  {
    key: 'maxPrice', title: '최고가', editable: true,
    validator: (value, record) => {
      const max = Number(value)
      const min = Number((record as PriceRange).minPrice)
      if (isNaN(max) || max <= 0)
        return { status: 'error', message: '0보다 큰 숫자를 입력하세요' }
      if (max <= min)
        return { status: 'error', message: '최고가는 최저가보다 커야 합니다' }
      return null
    },
  },
  {
    key: 'name', title: '상품명', editable: true,
    // dataSource로 전체 데이터 중 중복 이름 검사
    validator: (value, record, rowKey, dataSource) => {
      const trimmed = String(value ?? '').trim()
      if (!trimmed) return { status: 'error', message: '상품명은 필수입니다' }
      const dup = dataSource.some(
        r => r.name === trimmed && r.id !== (record as PriceRange).id
      )
      if (dup) return { status: 'error', message: '이미 존재하는 상품명입니다' }
      return null
    },
  },
]`

const MANUAL_CODE = `// manual 트리거 — gridRef.validate()로 일괄 검증
const gridRef = useRef<DataGridHandle>(null)

// 컬럼 설정 (validateTrigger: 'manual')
{
  key: 'email', title: '이메일', editable: true,
  validateTrigger: 'manual',  // blur 시 자동 검증 안 함
  validator: (value) => {
    if (!value) return { status: 'error', message: '이메일은 필수입니다' }
    const ok = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(value))
    if (!ok) return { status: 'error', message: '올바른 이메일 형식이 아닙니다' }
    return null
  },
}

// 저장 버튼 클릭 시
const handleSave = async () => {
  const isValid = await gridRef.current?.validate()
  if (!isValid) {
    alert('입력값을 확인해주세요')
    return
  }
  // API 저장 로직...
}

<DataGrid gridRef={gridRef} columns={columns} ... />`

// ──────────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────────
/** 이메일 형식 검증 */
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/** 중복 코드 체크 시뮬레이션 (500ms 지연) */
async function checkDuplicateCode(code: string, currentId: number): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 500))
  const EXISTING = ['EL-001', 'PH-003', 'EL-004', 'PH-005']
  // 현재 행 자신의 코드는 중복 아님
  const otherData = INITIAL_DATA.filter(d => d.id !== currentId)
  return otherData.some(d => d.code === code) || (EXISTING.includes(code) && currentId === 2)
}

// ──────────────────────────────────────────────
// 데모 컴포넌트
// ──────────────────────────────────────────────
export function ValidationDemo() {
  const [data, setData] = useState<Product[]>(INITIAL_DATA)
  const [rangeData, setRangeData] = useState<PriceRange[]>(RANGE_DATA)
  const [manualErrors, setManualErrors] = useState<ValidateError[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'validating' | 'ok' | 'fail'>('idle')
  const [inspectResult, setInspectResult] = useState<string>('')
  const gridRef = useRef<DataGridHandle<Product>>(null)
  const manualGridRef = useRef<DataGridHandle<Product>>(null)
  const crossColGridRef = useRef<DataGridHandle<PriceRange>>(null)

  const handleCellEdit = (rowKey: string | number, colKey: string, newValue: unknown) => {
    setData(prev => prev.map(r => r.id === rowKey ? { ...r, [colKey]: newValue } : r))
  }

  const handleRangeEdit = (rowKey: string | number, colKey: string, newValue: unknown) => {
    setRangeData(prev => prev.map(r => r.id === rowKey ? { ...r, [colKey]: newValue } : r))
  }

  // ── onBlur 트리거 컬럼 ──────────────────────
  const onBlurColumns: ColumnType<Product>[] = [
    { key: 'id',   title: 'ID',   dataIndex: 'id',   width: 60, align: 'center' },
    {
      key: 'name', title: '상품명', dataIndex: 'name', width: 160, editable: true,
      validator: (value) => {
        if (!value || String(value).trim() === '')
          return { status: 'error', message: '상품명은 필수입니다' }
        if (String(value).trim().length < 2)
          return { status: 'warning', message: '2자 이상 입력을 권장합니다' }
        return null
      },
    },
    {
      key: 'price', title: '가격(원)', dataIndex: 'price', width: 130, align: 'right', editable: true,
      validator: (value) => {
        const n = Number(value)
        if (isNaN(n) || n <= 0)
          return { status: 'error', message: '0보다 큰 숫자를 입력하세요' }
        return null
      },
      render: (v) => `₩${Number(v).toLocaleString()}`,
    },
    {
      key: 'stock', title: '재고', dataIndex: 'stock', width: 90, align: 'center', editable: true,
      validator: (value) => {
        const n = Number(value)
        if (isNaN(n) || n < 0)
          return { status: 'error', message: '0 이상의 숫자를 입력하세요' }
        if (n === 0)
          return { status: 'warning', message: '재고가 없습니다' }
        return null
      },
    },
    {
      key: 'category', title: '카테고리', dataIndex: 'category', width: 120, editable: true,
      validator: (value) => {
        if (!value || String(value).trim() === '')
          return { status: 'error', message: '카테고리는 필수입니다' }
        return null
      },
    },
  ]

  // ── 비동기 validator 컬럼 ─────────────────────
  const asyncColumns: ColumnType<Product>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 60, align: 'center' },
    { key: 'name', title: '상품명', dataIndex: 'name', width: 160 },
    {
      key: 'code', title: '상품코드', dataIndex: 'code', width: 150, editable: true,
      validator: async (value, record) => {
        if (!value || String(value).trim() === '')
          return { status: 'error', message: '코드는 필수입니다' }
        if (!/^[A-Z]{2}-\d{3}$/.test(String(value)))
          return { status: 'error', message: '형식: XX-000 (예: EL-001)' }
        // API 중복 확인 시뮬레이션
        const isDup = await checkDuplicateCode(String(value), (record as Product).id)
        if (isDup) return { status: 'error', message: '이미 사용 중인 코드입니다' }
        return null
      },
    },
    {
      key: 'email', title: '이메일', dataIndex: 'email', width: 200, editable: true,
      validator: (value) => {
        if (!value || String(value).trim() === '')
          return { status: 'error', message: '이메일은 필수입니다' }
        if (!isValidEmail(String(value)))
          return { status: 'error', message: '올바른 이메일 형식이 아닙니다' }
        return null
      },
    },
  ]

  // ── manual 트리거 컬럼 (저장 버튼으로 일괄 검증) ─
  const manualColumns: ColumnType<Product>[] = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 60, align: 'center' },
    {
      key: 'name', title: '상품명', dataIndex: 'name', width: 160, editable: true,
      validateTrigger: 'manual',
      validator: (value) => {
        if (!value || String(value).trim() === '')
          return { status: 'error', message: '상품명은 필수입니다' }
        return null
      },
    },
    {
      key: 'price', title: '가격(원)', dataIndex: 'price', width: 130, align: 'right', editable: true,
      validateTrigger: 'manual',
      validator: (value) => {
        const n = Number(value)
        if (isNaN(n) || n <= 0) return { status: 'error', message: '0보다 큰 숫자를 입력하세요' }
        return null
      },
      render: (v) => `₩${Number(v).toLocaleString()}`,
    },
    {
      key: 'stock', title: '재고', dataIndex: 'stock', width: 90, align: 'center', editable: true,
      validateTrigger: 'manual',
      validator: (value) => {
        const n = Number(value)
        if (isNaN(n) || n < 0) return { status: 'error', message: '0 이상의 숫자를 입력하세요' }
        if (n === 0) return { status: 'warning', message: '재고 없음' }
        return null
      },
    },
    {
      key: 'email', title: '이메일', dataIndex: 'email', width: 200, editable: true,
      validateTrigger: 'manual',
      validator: (value) => {
        if (!value || String(value).trim() === '')
          return { status: 'error', message: '이메일은 필수입니다' }
        if (!isValidEmail(String(value)))
          return { status: 'error', message: '올바른 이메일 형식이 아닙니다' }
        return null
      },
    },
    {
      key: 'code', title: '상품코드', dataIndex: 'code', width: 130, editable: true,
      validateTrigger: 'manual',
      validator: async (value, record) => {
        if (!value || String(value).trim() === '')
          return { status: 'error', message: '코드는 필수입니다' }
        if (!/^[A-Z]{2}-\d{3}$/.test(String(value)))
          return { status: 'error', message: '형식: XX-000' }
        const isDup = await checkDuplicateCode(String(value), (record as Product).id)
        if (isDup) return { status: 'error', message: '중복 코드' }
        return null
      },
    },
  ]

  // ── 교차 컬럼 검증 컬럼 ─────────────────────
  const crossColColumns: ColumnType<PriceRange>[] = [
    { key: 'id',   title: 'ID',   dataIndex: 'id',   width: 55, align: 'center' },
    {
      key: 'name', title: '상품명', dataIndex: 'name', width: 160, editable: true,
      // dataSource 4번째 파라미터로 전체 데이터 중 중복 이름 검사
      validator: (value, record, _rk, dataSource) => {
        const trimmed = String(value ?? '').trim()
        if (!trimmed) return { status: 'error', message: '상품명은 필수입니다' }
        const dup = dataSource.some(
          r => r.name === trimmed && r.id !== record.id
        )
        if (dup) return { status: 'error', message: '이미 존재하는 상품명입니다' }
        return null
      },
    },
    {
      key: 'minPrice', title: '최저가(원)', dataIndex: 'minPrice', width: 130, align: 'right', editable: true,
      // record로 같은 행의 maxPrice와 비교
      validator: (value, record) => {
        const min = Number(value)
        const max = Number(record.maxPrice)
        if (isNaN(min) || min <= 0) return { status: 'error', message: '0보다 큰 숫자를 입력하세요' }
        if (min >= max)  return { status: 'error', message: '최저가는 최고가보다 작아야 합니다' }
        return null
      },
      render: (v) => `₩${Number(v).toLocaleString()}`,
    },
    {
      key: 'maxPrice', title: '최고가(원)', dataIndex: 'maxPrice', width: 130, align: 'right', editable: true,
      validator: (value, record) => {
        const max = Number(value)
        const min = Number(record.minPrice)
        if (isNaN(max) || max <= 0) return { status: 'error', message: '0보다 큰 숫자를 입력하세요' }
        if (max <= min)  return { status: 'error', message: '최고가는 최저가보다 커야 합니다' }
        return null
      },
      render: (v) => `₩${Number(v).toLocaleString()}`,
    },
    {
      key: 'discount', title: '할인율(%)', dataIndex: 'discount', width: 110, align: 'center', editable: true,
      // 같은 행의 stock이 0이면 할인 불가 규칙
      validator: (value, record) => {
        const d = Number(value)
        if (isNaN(d) || d < 0)    return { status: 'error',   message: '0 이상의 숫자를 입력하세요' }
        if (d > 100)               return { status: 'error',   message: '100을 초과할 수 없습니다' }
        if (d > 0 && record.stock === 0)
          return { status: 'warning', message: '재고 없는 상품에 할인을 적용 중입니다' }
        return null
      },
    },
    { key: 'stock', title: '재고', dataIndex: 'stock', width: 80, align: 'center' },
  ]

  const handleManualSave = async () => {
    setSaveStatus('validating')
    setManualErrors([])
    const isValid = await manualGridRef.current?.validate()
    setSaveStatus(isValid ? 'ok' : 'fail')
    const errors = manualGridRef.current?.getErrors() ?? []
    setManualErrors(errors)
  }

  const handleManualClear = () => {
    manualGridRef.current?.clearErrors()
    setSaveStatus('idle')
    setManualErrors([])
  }

  return (
    <div className="demo-page">
      <h1 className="demo-page__title">셀 검증 (Validation)</h1>
      <p className="demo-page__desc">
        <code>validator</code> prop으로 셀별 검증 함수를 설정합니다.
        동기·비동기(Promise) 모두 지원하며, <code>validateTrigger</code>로 검증 시점을 제어합니다.
        오류 셀은 빨간 테두리로 표시되고, hover 시 메시지가 노출됩니다.
      </p>

      {/* onBlur 자동 검증 */}
      <DemoBlock
        title="onBlur 자동 검증 (기본값)"
        description="셀 편집 완료(blur) 시 자동으로 validator 실행. validateTrigger 생략 시 기본 동작."
        code={ONBLUR_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          셀을 더블클릭하여 편집 후 다른 곳을 클릭하면 즉시 검증됩니다.
          빨간 테두리(error) / 노란 테두리(warning). hover 시 메시지 표시.
        </p>
        <div style={{ height: 320 }}>
          <DataGrid<Product>
            dataSource={data}
            columns={onBlurColumns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            pagination={false}
            gridRef={gridRef}
          />
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button
            onClick={async () => {
              const ok = await gridRef.current?.validate()
              alert(ok ? '✅ 모든 검증 통과!' : '❌ 검증 오류가 있습니다')
            }}
            style={btnStyle('#1677ff')}
          >
            전체 재검증
          </button>
          <button onClick={() => gridRef.current?.clearErrors()} style={btnStyle('#6b7280')}>
            오류 초기화
          </button>
        </div>
      </DemoBlock>

      {/* 비동기 validator */}
      <DemoBlock
        title="비동기 validator (API 검증 시뮬레이션)"
        description="validator 함수가 Promise를 반환하면 자동으로 비동기 처리됩니다. 검증 중 파란 테두리 표시."
        code={ASYNC_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          상품코드(형식: XX-000) 편집 시 500ms 뒤 중복 확인 API 호출 시뮬레이션.
          이메일 형식도 검증합니다.
        </p>
        <div style={{ height: 320 }}>
          <DataGrid<Product>
            dataSource={data}
            columns={asyncColumns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            pagination={false}
          />
        </div>
      </DemoBlock>

      {/* 교차 컬럼 검증 + getRow/getCell/getData */}
      <DemoBlock
        title="교차 컬럼 검증 & 데이터 조회 (getRow / getCell / getData)"
        description="validator의 4번째 파라미터 dataSource로 다른 행 값을 조회하고, record로 같은 행의 다른 컬럼과 비교합니다. gridRef.getRow() / getCell() / getData()로 외부에서도 그리드 데이터를 조회할 수 있습니다."
        code={CROSS_COL_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          최저가 ≥ 최고가이거나, 재고=0인 상품에 할인율을 적용하거나, 상품명이 중복되면 오류/경고가 표시됩니다.
        </p>
        <div style={{ height: 280 }}>
          <DataGrid<PriceRange>
            dataSource={rangeData}
            columns={crossColColumns}
            rowKey="id"
            onCellEdit={handleRangeEdit}
            pagination={false}
            gridRef={crossColGridRef}
          />
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              const ok = await crossColGridRef.current?.validate()
              alert(ok ? '✅ 모든 검증 통과!' : '❌ 검증 오류가 있습니다')
            }}
            style={btnStyle('#1677ff')}
          >
            전체 검증
          </button>
          <button
            onClick={() => {
              const row = crossColGridRef.current?.getRow(1)
              setInspectResult(`getRow(1) → ${JSON.stringify(row)}`)
            }}
            style={btnStyle('#52c41a')}
          >
            getRow(1)
          </button>
          <button
            onClick={() => {
              const cell = crossColGridRef.current?.getCell(3, 'maxPrice')
              setInspectResult(`getCell(3, 'maxPrice') → ${JSON.stringify(cell)}`)
            }}
            style={btnStyle('#fa8c16')}
          >
            getCell(3, maxPrice)
          </button>
          <button
            onClick={() => {
              const allData = crossColGridRef.current?.getData() ?? []
              setInspectResult(`getData() → ${allData.length}개 행\n${JSON.stringify(allData, null, 2)}`)
            }}
            style={btnStyle('#722ed1')}
          >
            getData()
          </button>
          <button onClick={() => { crossColGridRef.current?.clearErrors(); setInspectResult('') }} style={btnStyle('#6b7280')}>
            초기화
          </button>
        </div>
        {inspectResult && (
          <pre style={{
            marginTop: 8, padding: '8px 12px', background: '#f6f8fa',
            border: '1px solid #e4e6ef', borderRadius: 4, fontSize: 12,
            whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflow: 'auto',
          }}>
            {inspectResult}
          </pre>
        )}
      </DemoBlock>

      {/* manual 트리거 */}
      <DemoBlock
        title="manual 트리거 — 저장 버튼으로 일괄 검증"
        description="validateTrigger='manual'로 설정하면 blur 시 자동 검증하지 않습니다. gridRef.validate()를 직접 호출하세요."
        code={MANUAL_CODE}
      >
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
          편집 중 blur해도 오류가 표시되지 않습니다. <strong>저장</strong> 버튼을 눌러야 일괄 검증이 실행됩니다.
        </p>
        <div style={{ height: 320 }}>
          <DataGrid<Product>
            dataSource={data}
            columns={manualColumns}
            rowKey="id"
            onCellEdit={handleCellEdit}
            pagination={false}
            gridRef={manualGridRef}
            onValidateChange={setManualErrors}
          />
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleManualSave}
            disabled={saveStatus === 'validating'}
            style={btnStyle('#1677ff')}
          >
            {saveStatus === 'validating' ? '검증 중…' : '저장 (일괄 검증)'}
          </button>
          <button onClick={handleManualClear} style={btnStyle('#6b7280')}>
            오류 초기화
          </button>
          {saveStatus === 'ok' && (
            <span style={{ color: '#52c41a', fontWeight: 600 }}>✅ 저장 완료</span>
          )}
          {saveStatus === 'fail' && (
            <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
              ❌ {manualErrors.filter(e => e.status === 'error').length}개 오류 수정 후 다시 시도하세요
            </span>
          )}
        </div>
        {manualErrors.length > 0 && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff1f0',
            border: '1px solid #ffa39e', borderRadius: 4, fontSize: 12 }}>
            <strong>오류 목록:</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
              {manualErrors.map((e, i) => (
                <li key={i} style={{ color: e.status === 'error' ? '#ff4d4f' : '#d48806' }}>
                  행 {String(e.rowKey)} · {e.columnKey}: {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </DemoBlock>
    </div>
  )
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '6px 16px', background: bg, color: '#fff',
    border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13,
  }
}
