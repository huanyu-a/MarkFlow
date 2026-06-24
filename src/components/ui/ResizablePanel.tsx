import { useState, useCallback, useRef, useEffect, createContext, useContext, type ReactNode } from 'react'

interface PanelContextValue {
  fullscreen: boolean
  toggleFullscreen: () => void
}

const PanelContext = createContext<PanelContextValue>({ fullscreen: false, toggleFullscreen: () => {} })
export const usePanelFullscreen = () => useContext(PanelContext)

interface ResizablePanelProps {
  children: ReactNode
  defaultWidth?: number
  defaultHeight?: number
  minWidth?: number
  minHeight?: number
}

export function ResizablePanel({
  children,
  defaultWidth = 768,
  defaultHeight = 660,
  minWidth = 400,
  minHeight = 300,
}: ResizablePanelProps) {
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight })
  const [fullscreen, setFullscreen] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number; dir: string } | null>(null)

  const toggleFullscreen = useCallback(() => setFullscreen((f) => !f), [])

  const onPointerDown = useCallback((dir: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h, dir }
  }, [size])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const { startX, startY, startW, startH, dir } = dragRef.current
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    setSize({
      w: dir.includes('r') ? Math.max(minWidth, startW + dx) : dir.includes('l') ? Math.max(minWidth, startW - dx) : startW,
      h: dir.includes('b') ? Math.max(minHeight, startH + dy) : dir.includes('t') ? Math.max(minHeight, startH - dy) : startH,
    })
  }, [minWidth, minHeight])

  const onPointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  // 全屏时 ESC 退出
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const handleStyle = 'absolute z-10 bg-transparent transition-colors hover:bg-[var(--accent)]/30'

  return (
    <PanelContext.Provider value={{ fullscreen, toggleFullscreen }}>
      <div
        className="relative flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl"
        style={fullscreen
          ? { width: '100vw', height: '100vh', borderRadius: 0 }
          : { width: size.w, height: size.h }
        }
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* 拖拽手柄 — 仅非全屏时显示 */}
        {!fullscreen && (
          <>
            <div className={`${handleStyle} right-0 top-2 bottom-2 w-1 cursor-e-resize`} onPointerDown={onPointerDown('r')} />
            <div className={`${handleStyle} bottom-0 left-2 right-2 h-1 cursor-s-resize`} onPointerDown={onPointerDown('b')} />
            <div className={`${handleStyle} right-0 bottom-0 w-3 h-3 cursor-se-resize`} onPointerDown={onPointerDown('br')} />
            <div className={`${handleStyle} left-0 top-2 bottom-2 w-1 cursor-w-resize`} onPointerDown={onPointerDown('l')} />
            <div className={`${handleStyle} top-0 left-2 right-2 h-1 cursor-n-resize`} onPointerDown={onPointerDown('t')} />
            <div className={`${handleStyle} left-0 top-0 w-3 h-3 cursor-nw-resize`} onPointerDown={onPointerDown('tl')} />
            <div className={`${handleStyle} right-0 top-0 w-3 h-3 cursor-ne-resize`} onPointerDown={onPointerDown('tr')} />
            <div className={`${handleStyle} left-0 bottom-0 w-3 h-3 cursor-sw-resize`} onPointerDown={onPointerDown('bl')} />
          </>
        )}

        {children}
      </div>
    </PanelContext.Provider>
  )
}
