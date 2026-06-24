import { useState, type ReactNode } from 'react'

export type MobileView = 'edit' | 'preview'

interface ModeLayoutProps {
  /** 编辑器区域 */
  editor: ReactNode
  /** 预览区域 */
  preview: ReactNode
  /** 可选：预览区顶部工具栏 */
  toolbar?: ReactNode
  /** 外层容器额外 className */
  className?: string
  /** 编辑器区域额外 className */
  editorClassName?: string
  /** 预览区域额外 className */
  previewClassName?: string
  /** 受控的移动端当前视图；不传则内部管理 */
  activeView?: MobileView
  /** 受控时的切换回调 */
  onActiveViewChange?: (view: MobileView) => void
  /** Tab 按钮文案 */
  editLabel?: string
  previewLabel?: string
}

/**
 * 通用模式布局：移动端「编辑/预览」Tab + 桌面端左右分栏。
 *
 * 统一处理响应式布局与视图切换，各模式组件只需关注编辑器、预览内容与工具栏。
 */
export function ModeLayout({
  editor,
  preview,
  toolbar,
  className = '',
  editorClassName = '',
  previewClassName = '',
  activeView: controlledView,
  onActiveViewChange,
  editLabel = '编辑内容',
  previewLabel = '实时预览',
}: ModeLayoutProps) {
  const [internalView, setInternalView] = useState<MobileView>('edit')
  const activeView = controlledView ?? internalView
  const setActiveView = onActiveViewChange ?? setInternalView

  return (
    <main className={`flex flex-col min-h-0 flex-1 bg-slate-200 ${className}`}>
      {/* 移动端视图切换 Tab */}
      <div className="flex shrink-0 border-b border-slate-200 bg-white md:hidden">
        <button
          type="button"
          onClick={() => setActiveView('edit')}
          className={`flex-1 py-3 text-center text-[13px] font-bold transition-all cursor-pointer ${
            activeView === 'edit'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-slate-50/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {editLabel}
        </button>
        <button
          type="button"
          onClick={() => setActiveView('preview')}
          className={`flex-1 py-3 text-center text-[13px] font-bold transition-all cursor-pointer ${
            activeView === 'preview'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-slate-50/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {previewLabel}
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2 gap-px bg-slate-200">
        <section
          className={`min-h-0 overflow-hidden bg-white flex flex-col ${editorClassName} ${
            activeView === 'edit' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {editor}
        </section>
        <section
          className={`min-h-0 overflow-hidden flex flex-col relative ${previewClassName} ${
            activeView === 'preview' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {toolbar}
          {preview}
        </section>
      </div>
    </main>
  )
}
