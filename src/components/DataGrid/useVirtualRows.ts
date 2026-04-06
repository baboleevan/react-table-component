import { useMemo, useRef, useState, useCallback } from 'react'

interface VirtualRowsOptions {
  totalCount: number
  rowHeight: number
  overscan?: number
}

interface VirtualRowsResult {
  containerRef: React.RefObject<HTMLDivElement>
  offsetTop: number
  offsetBottom: number
  visibleRange: [number, number]
  onScroll: () => void
  scrollToRow: (rowAbsIdx: number) => void
}

export function useVirtualRows({ totalCount, rowHeight, overscan = 5 }: VirtualRowsOptions): VirtualRowsResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const onScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  const scrollToRow = useCallback(
    (rowAbsIdx: number) => {
      const el = containerRef.current
      if (!el) return
      const thead = el.querySelector('thead')
      const headerHeight = thead?.getBoundingClientRect().height ?? 0
      const rowTop = rowAbsIdx * rowHeight
      const rowBottom = rowTop + rowHeight
      if (rowTop < el.scrollTop) {
        el.scrollTop = rowTop
      } else if (rowBottom + headerHeight > el.scrollTop + el.clientHeight) {
        el.scrollTop = rowBottom + headerHeight - el.clientHeight
      }
    },
    [rowHeight],
  )

  const visibleRange = useMemo<[number, number]>(() => {
    /* eslint-disable react-hooks/refs -- 가시 높이는 스크롤 컨테이너 ref로만 측정 */
    const containerHeight = containerRef.current?.clientHeight ?? 600
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
    const end = Math.min(totalCount - 1, Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan)
    /* eslint-enable react-hooks/refs */
    return [start, end]
  }, [scrollTop, totalCount, rowHeight, overscan])

  const [start, end] = visibleRange
  const offsetTop = start * rowHeight
  const offsetBottom = Math.max(0, (totalCount - 1 - end) * rowHeight)

  return { containerRef, offsetTop, offsetBottom, visibleRange, onScroll, scrollToRow }
}
