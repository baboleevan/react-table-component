import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { highlightPreviewCodeToHtml } from '@/preview/components/highlightPreviewCode'
import { usePreviewSourceCode } from '@/preview/context/PreviewSourceCodeContext'

interface DemoBlockProps {
  title: string
  description?: string
  code: string
  children: ReactNode
  previewClassName?: string
}

export function DemoBlock({ title, description, code, children, previewClassName }: DemoBlockProps) {
  const { sourceCodeExpanded } = usePreviewSourceCode()
  const [showCode, setShowCode] = useState(sourceCodeExpanded)
  const codeHtml = useMemo(() => highlightPreviewCodeToHtml(code), [code])

  useEffect(() => {
    setShowCode(sourceCodeExpanded)
  }, [sourceCodeExpanded])

  return (
    <div className="demo-block">
      <div className="demo-block__header">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className={`demo-block__preview ${previewClassName ?? ''}`}>{children}</div>
      <button type="button" className="demo-block__code-toggle" onClick={() => setShowCode((v) => !v)}>
        <span>{showCode ? '▲' : '▼'}</span>
        {showCode ? '소스 코드 숨기기' : '소스 코드 보기'}
      </button>
      {showCode && (
        <pre className="demo-block__code">
          <code className="demo-block__code-inner" dangerouslySetInnerHTML={{ __html: codeHtml }} />
        </pre>
      )}
    </div>
  )
}
