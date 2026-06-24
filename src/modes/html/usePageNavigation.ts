import { useCallback, useEffect, useRef, useState, RefObject } from 'react'
import { detectPages, type PageInfo } from '@/lib/multipage'

/**
 * 管理 HTML 预览区的分页：检测页面、键盘/滚轮翻页、切换可见页。
 */
export function usePageNavigation(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  previewPaneRef: RefObject<HTMLElement | null>,
) {
  const [pages, setPages] = useState<PageInfo[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const currentPageRef = useRef(0)
  const lastWheelFlipAtRef = useRef(0)

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  const detect = useCallback(() => {
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!doc) return
    const detected = detectPages(doc)
    setPages(detected)
    setCurrentPage(0)
  }, [iframeRef])

  // 切换当前页时，只显示当前页
  useEffect(() => {
    if (pages.length === 0) return
    pages.forEach((p, i) => {
      p.node.style.display = i === currentPage ? '' : 'none'
    })
  }, [pages, currentPage])

  // 键盘翻页
  useEffect(() => {
    if (pages.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement
      if (active?.tagName === 'TEXTAREA' || active?.tagName === 'INPUT' || active?.closest('.cm-editor')) {
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentPage((prev) => {
          const next = Math.min(prev + 1, pages.length - 1)
          if (next !== prev) e.preventDefault()
          return next
        })
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentPage((prev) => {
          const next = Math.max(prev - 1, 0)
          if (next !== prev) e.preventDefault()
          return next
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const iframeDoc = iframeRef.current?.contentDocument
    iframeDoc?.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      iframeDoc?.removeEventListener('keydown', handleKeyDown)
    }
  }, [pages, iframeRef])

  // 滚轮翻页
  useEffect(() => {
    if (pages.length <= 1) return

    const flipByWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 24) return

      const now = Date.now()
      if (now - lastWheelFlipAtRef.current < 360) {
        event.preventDefault()
        return
      }

      const prev = currentPageRef.current
      const next = event.deltaY > 0
        ? Math.min(prev + 1, pages.length - 1)
        : Math.max(prev - 1, 0)

      if (next !== prev) {
        currentPageRef.current = next
        setCurrentPage(next)
        lastWheelFlipAtRef.current = now
      }
      event.preventDefault()
    }

    const pane = previewPaneRef.current
    const iframeDoc = iframeRef.current?.contentDocument
    pane?.addEventListener('wheel', flipByWheel, { passive: false })
    iframeDoc?.addEventListener('wheel', flipByWheel, { passive: false })

    return () => {
      pane?.removeEventListener('wheel', flipByWheel)
      iframeDoc?.removeEventListener('wheel', flipByWheel)
    }
  }, [pages, iframeRef, previewPaneRef])

  return { pages, currentPage, setCurrentPage, detect }
}
