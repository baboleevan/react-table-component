/* eslint-disable react-refresh/only-export-components -- Preview 전용 Context + 훅 동일 파일 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'react-table-component:preview-source-expanded'

function readStoredExpanded(): boolean | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === '1' || raw === 'true') return true
    if (raw === '0' || raw === 'false') return false
  } catch {
    /* ignore */
  }
  return null
}

export interface PreviewSourceCodeContextValue {
  /** 모든 DemoBlock 소스 패널 기본 표시 여부 */
  sourceCodeExpanded: boolean
  setSourceCodeExpanded: (next: boolean) => void
}

const PreviewSourceCodeContext = createContext<PreviewSourceCodeContextValue | null>(null)

export function PreviewSourceCodeProvider({ children }: { children: ReactNode }) {
  const [sourceCodeExpanded, setSourceCodeExpandedState] = useState(() => readStoredExpanded() ?? false)

  const setSourceCodeExpanded = useCallback((next: boolean) => {
    setSourceCodeExpandedState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      sourceCodeExpanded,
      setSourceCodeExpanded,
    }),
    [sourceCodeExpanded, setSourceCodeExpanded],
  )

  return <PreviewSourceCodeContext.Provider value={value}>{children}</PreviewSourceCodeContext.Provider>
}

export function usePreviewSourceCode(): PreviewSourceCodeContextValue {
  const ctx = useContext(PreviewSourceCodeContext)
  if (!ctx) {
    throw new Error('usePreviewSourceCode must be used within PreviewSourceCodeProvider')
  }
  return ctx
}
