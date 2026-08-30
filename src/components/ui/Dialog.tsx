import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const DEFAULT_OVERLAY =
  'fixed inset-0 z-[var(--dialog-z,50)] flex items-center justify-center bg-black/40 backdrop-blur-xs px-4'
const DEFAULT_PANEL =
  'w-full max-w-lg rounded-xl border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  /** 是否阻止点击遮罩关闭 */
  closeOnOverlay?: boolean
  /** z-index 层级，默认 50 */
  zIndex?: number
  /** 提供时完全替换默认面板类（需自带背景/圆角/阴影/尺寸），供自定义布局弹层复用外壳能力 */
  panelClassName?: string
  /** 提供时完全替换默认遮罩类（需自带 fixed inset-0 flex 布局与背景色） */
  overlayClassName?: string
  /** 无 title 时的无障碍名称（自定义头部弹层使用） */
  ariaLabel?: string
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  closeOnOverlay = true,
  zIndex = 50,
  panelClassName,
  overlayClassName,
  ariaLabel,
}: DialogProps) {
  const triggerRef = useRef<Element | null>(null)

  // 记录触发元素，关闭时还原焦点
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as Element
    }
  }, [isOpen])

  // ESC 关闭 + 焦点陷阱
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusable = document.querySelectorAll(
          '[data-dialog] a, [data-dialog] button, [data-dialog] input, [data-dialog] textarea, [data-dialog] select',
        )
        if (focusable.length === 0) return
        const first = focusable[0] as HTMLElement
        const last = focusable[focusable.length - 1] as HTMLElement
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // 关闭时还原焦点
  useEffect(() => {
    if (!isOpen && triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const content = (
    <div
      className={overlayClassName ?? DEFAULT_OVERLAY}
      style={{ '--dialog-z': zIndex } as React.CSSProperties}
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        data-dialog
        role="dialog"
        aria-modal="true"
        aria-label={title ?? ariaLabel}
        className={panelClassName ?? DEFAULT_PANEL}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="mb-4">
            {title && <h2 className="text-base font-bold text-slate-800">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
        )}
        {/* 无 title 时 children 直接渲染，自定义头部弹层可完全接管面板布局 */}
        {title || description ? <div className="flex flex-col gap-4">{children}</div> : children}
        {footer && <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">{footer}</div>}
      </div>
    </div>
  )

  // 使用 Portal 渲染到 body，避免父容器 overflow/transform 截断
  return createPortal(content, document.body)
}
