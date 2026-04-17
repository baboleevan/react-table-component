import { describe, it, expect } from 'vitest'
import { getRecordValue, normalizeCellRenderResult, escapeCsvCell, flattenForTsv } from '@/components/DataGrid/tableUtils'
describe('getRecordValue', () => {
  it('reads nested dataIndex path', () => {
    const row = { address: { city: 'Seoul' } }
    expect(getRecordValue(row, ['address', 'city'], 'x')).toBe('Seoul')
  })

  it('returns undefined for missing path', () => {
    expect(getRecordValue({ a: 1 }, ['b', 'c'], 'k')).toBeUndefined()
  })
})

describe('normalizeCellRenderResult', () => {
  it('unwraps Ant Design style { children } without props', () => {
    const out = normalizeCellRenderResult({ children: 'text only' })
    expect(out.children).toBe('text only')
    expect(out.props).toBeUndefined()
  })

  it('preserves props when present', () => {
    const out = normalizeCellRenderResult({
      children: 'x',
      props: { colSpan: 2 },
    })
    expect(out.props?.colSpan).toBe(2)
  })

  it('passes through primitives as children', () => {
    expect(normalizeCellRenderResult(42).children).toBe(42)
  })
})

describe('escapeCsvCell', () => {
  it('quotes when delimiter appears', () => {
    expect(escapeCsvCell('a,b', ',')).toBe('"a,b"')
  })

  it('escapes double quotes', () => {
    expect(escapeCsvCell('say "hi"', ',')).toBe('"say ""hi"""')
  })
})

describe('flattenForTsv', () => {
  it('removes tabs and newlines', () => {
    expect(flattenForTsv('a\tb\nc')).toBe('a b c')
  })
})
