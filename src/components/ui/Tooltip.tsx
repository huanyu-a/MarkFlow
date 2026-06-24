import { type ReactNode, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  /** 提示文本 */
  text: string
  /** 包裹的子元素 */
  children: ReactNode
  /** 弹出位置 */
  position?: 'top' | 'bottom'
  /** 是否禁用 */
  disabled?: boolean
}

/** 视口安全边距 */
const MARGIN = 8
/** 最大宽度 */
const MAX_W = 300

/**
 * 轻量级 Tooltip 组件。
 * - 通过 React Portal 渲染到 body，不受父容器 overflow/transform/backdrop-filter 影响
 * - 宽度自适应，长文本自动换行（上限 300px）
 * - 悬停时 JS 计算视口安全位置，上方空间不足自动翻转到下方
 */
export function Tooltip({ text, children, position = 'top', disabled }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', zIndex: 9999 })

  const show = useCallback(() => {
    if (!text) return
    const el = triggerRef.current
    if (!el) return

    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    // 启发式估算 tooltip 尺寸
    const w = Math.min(text.length * 7.5 + 24, MAX_W)
    const lines = Math.ceil((text.length * 7.5 + 24) / MAX_W)
    const h = lines * 18 + 14

    // 水平居中于触发元素，夹紧在视口内
    let left = r.left + r.width / 2 - w / 2
    left = Math.max(MARGIN, Math.min(left, vw - MARGIN - w))

    // 垂直：优先按 position 方向，空间不足则翻转
    let top: number
    if (position === 'top') {
      top = r.top - h - 8
      if (top < MARGIN) top = r.bottom + 8
    } else {
      top = r.bottom + 8
      if (top + h > vh - MARGIN) top = r.top - h - 8
    }

    setStyle({ position: 'fixed', zIndex: 9999, left, top, maxWidth: MAX_W })
    setVisible(true)
  }, [text, position])

  const hide = useCallback(() => setVisible(false), [])

  if (disabled) return <>{children}</>

  return (
    <span ref={triggerRef} className="inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible &&
        createPortal(
          <span
            className="pointer-events-none rounded-md bg-slate-800 px-2.5 py-1.5 text-[12px] leading-snug text-white shadow-lg"
            style={style}
            role="tooltip"
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  )
}
