import { useState, type ReactNode } from 'react'

interface DemoBlockProps {
  title: string
  description?: string
  code: string
  children: ReactNode
  previewClassName?: string
}

export function DemoBlock({ title, description, code, children, previewClassName }: DemoBlockProps) {
  const [showCode, setShowCode] = useState(false)

  return (
    <div className="demo-block">
      <div className="demo-block__header">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className={`demo-block__preview ${previewClassName ?? ''}`}>
        {children}
      </div>
      <div className="demo-block__code-toggle" onClick={() => setShowCode(!showCode)}>
        <span>{showCode ? '▲' : '▼'}</span>
        {showCode ? '소스 코드 숨기기' : '소스 코드 보기'}
      </div>
      {showCode && <div className="demo-block__code">{code}</div>}
    </div>
  )
}
