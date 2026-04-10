import { useState, useEffect } from 'react'
import { getCurrentBreakpoint, type GridBreakpoint } from '@/components/DataGrid/tableUtils'

export type { GridBreakpoint }

export function useGridBreakpoint(): GridBreakpoint {
  const [bp, setBp] = useState<GridBreakpoint>(() =>
    typeof window !== 'undefined' ? getCurrentBreakpoint(window.innerWidth) : 'xxl',
  )

  useEffect(() => {
    const onResize = () => setBp(getCurrentBreakpoint(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return bp
}
