/**
 * Preview 전용: TS/TSX 데모 문자열을 HTML로 하이라이트합니다.
 * 외부 라이브러리 없이 토큰 단위로 span을 씌웁니다.
 */

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const KEYWORDS = new Set([
  'as',
  'async',
  'await',
  'bigint',
  'boolean',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'keyof',
  'let',
  'never',
  'new',
  'null',
  'number',
  'of',
  'package',
  'private',
  'protected',
  'public',
  'readonly',
  'return',
  'static',
  'string',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'type',
  'typeof',
  'undefined',
  'unknown',
  'var',
  'void',
  'while',
  'with',
  'yield',
])

function span(cls: string, raw: string): string {
  return `<span class="demo-block__code-${cls}">${escapeHtml(raw)}</span>`
}

function readLineComment(src: string, start: number): { end: number; text: string } {
  let i = start + 2
  while (i < src.length && src[i] !== '\n') i++
  return { end: i, text: src.slice(start, i) }
}

function readBlockComment(src: string, start: number): { end: number; text: string } {
  let i = start + 2
  while (i + 1 < src.length) {
    if (src[i] === '*' && src[i + 1] === '/') return { end: i + 2, text: src.slice(start, i + 2) }
    i++
  }
  return { end: src.length, text: src.slice(start) }
}

function readDoubleQuoted(src: string, start: number): { end: number; text: string } {
  let i = start + 1
  while (i < src.length) {
    const c = src[i]!
    if (c === '\\') {
      i += 2
      continue
    }
    if (c === '"') return { end: i + 1, text: src.slice(start, i + 1) }
    i++
  }
  return { end: src.length, text: src.slice(start) }
}

function readSingleQuoted(src: string, start: number): { end: number; text: string } {
  let i = start + 1
  while (i < src.length) {
    const c = src[i]!
    if (c === '\\') {
      i += 2
      continue
    }
    if (c === "'") return { end: i + 1, text: src.slice(start, i + 1) }
    i++
  }
  return { end: src.length, text: src.slice(start) }
}

function readTemplateLiteral(src: string, start: number): { end: number; text: string } {
  let i = start + 1
  let result = '`'
  while (i < src.length) {
    const c = src[i]!
    if (c === '\\') {
      result += src.slice(i, Math.min(i + 2, src.length))
      i += 2
      continue
    }
    if (c === '`') {
      result += '`'
      return { end: i + 1, text: result }
    }
    if (c === '$' && src[i + 1] === '{') {
      result += '${'
      i += 2
      let depth = 1
      while (i < src.length && depth > 0) {
        const d = src[i]!
        if (d === '`') {
          const sub = readTemplateLiteral(src, i)
          result += sub.text
          i = sub.end
          continue
        }
        if (d === '/' && src[i + 1] === '/') {
          const lc = readLineComment(src, i)
          result += lc.text
          i = lc.end
          continue
        }
        if (d === '/' && src[i + 1] === '*') {
          const bc = readBlockComment(src, i)
          result += bc.text
          i = bc.end
          continue
        }
        if (d === '"') {
          const dq = readDoubleQuoted(src, i)
          result += dq.text
          i = dq.end
          continue
        }
        if (d === "'") {
          const sq = readSingleQuoted(src, i)
          result += sq.text
          i = sq.end
          continue
        }
        if (d === '{') depth++
        else if (d === '}') depth--
        result += d
        i++
      }
      continue
    }
    result += c
    i++
  }
  return { end: src.length, text: result }
}

function readNumber(src: string, start: number): { end: number; text: string } | null {
  let i = start
  if (src[i] === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
    i += 2
    while (i < src.length && /[\da-fA-F]/.test(src[i]!)) i++
    return { end: i, text: src.slice(start, i) }
  }
  while (i < src.length && /[\d_]/.test(src[i]!)) i++
  if (src[i] === '.') {
    i++
    while (i < src.length && /[\d_]/.test(src[i]!)) i++
  }
  if (src[i] === 'e' || src[i] === 'E') {
    i++
    if (src[i] === '+' || src[i] === '-') i++
    while (i < src.length && /\d/.test(src[i]!)) i++
  }
  const t = src.slice(start, i)
  if (t === '' || t === '.') return null
  return { end: i, text: t }
}

function readIdentifier(src: string, start: number): { end: number; text: string } {
  let i = start + 1
  while (i < src.length && /[\w$]/.test(src[i]!)) i++
  return { end: i, text: src.slice(start, i) }
}

/** `<` 또는 `</` 뒤에 [A-Z_]로 시작하는 JSX 컴포넌트 이름만 태그로 색상 처리 */
function tryReadJsxComponentRef(src: string, start: number): { end: number; prefix: string; name: string } | null {
  if (src[start] !== '<') return null
  if (src[start + 1] === '!' || src[start + 1] === '?') return null
  let i = start
  let prefix = '<'
  i++
  if (src[i] === '/') {
    prefix = '</'
    i++
  }
  if (!/[A-Z_]/.test(src[i] ?? '')) return null
  const nameStart = i
  i++
  while (i < src.length && /[\w.]/.test(src[i]!)) i++
  const name = src.slice(nameStart, i)
  if (!name) return null
  return { end: i, prefix, name }
}

/**
 * 데모 코드 문자열 → 하이라이트된 HTML (본문만, `<pre>` 바깥).
 */
export function highlightPreviewCodeToHtml(src: string): string {
  const parts: string[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]!

    if (c === '\n') {
      parts.push(span('pun', '\n'))
      i++
      continue
    }

    if (c === '/' && src[i + 1] === '/') {
      const r = readLineComment(src, i)
      parts.push(span('cmt', r.text))
      i = r.end
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      const r = readBlockComment(src, i)
      parts.push(span('cmt', r.text))
      i = r.end
      continue
    }

    if (c === '"') {
      const r = readDoubleQuoted(src, i)
      parts.push(span('str', r.text))
      i = r.end
      continue
    }
    if (c === "'") {
      const r = readSingleQuoted(src, i)
      parts.push(span('str', r.text))
      i = r.end
      continue
    }
    if (c === '`') {
      const r = readTemplateLiteral(src, i)
      parts.push(span('tpl', r.text))
      i = r.end
      continue
    }

    const jsx = tryReadJsxComponentRef(src, i)
    if (jsx) {
      parts.push(span('pun', jsx.prefix))
      parts.push(span('tag', jsx.name))
      i = jsx.end
      continue
    }

    if (/\d/.test(c) || (c === '.' && /\d/.test(src[i + 1] ?? ''))) {
      const num = readNumber(src, i)
      if (num) {
        parts.push(span('num', num.text))
        i = num.end
        continue
      }
    }

    if (/\s/.test(c)) {
      parts.push(span('pun', c))
      i++
      continue
    }

    if (/[A-Za-z_$]/.test(c)) {
      const id = readIdentifier(src, i)
      if (KEYWORDS.has(id.text)) {
        parts.push(span('kw', id.text))
      } else {
        parts.push(span('id', id.text))
      }
      i = id.end
      continue
    }

    parts.push(span('pun', c))
    i++
  }
  return parts.join('')
}
