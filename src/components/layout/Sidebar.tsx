import { useState, useRef } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'
import { AiStar, Settings, RotateCcw, HelpCircle, Book, Send, Sparkles, Grid } from '@/components/ui/Icon'

export type SidebarPanel = 'ai' | 'library' | 'settings' | 'demo' | 'help' | 'extension' | null

interface SidebarProps {
  activePanel: SidebarPanel
  onPanelChange: (panel: SidebarPanel) => void
  onOpenAiTypeset?: () => void
  onOpenExtension?: () => void
  onCopyGuide?: () => void
}

const navItems: Array<{ id: Exclude<SidebarPanel, 'ai' | 'extension'>; icon: typeof AiStar; label: string }> = [
  { id: 'library', icon: Book, label: '指令库' },
  { id: 'demo', icon: RotateCcw, label: '恢复示例' },
]

/**
 * 左侧导航栏：48px 图标轨道，桌面端常驻。
 * AI 排版为菜单按钮，鼠标划过显示子菜单。
 */
export function Sidebar({ activePanel, onPanelChange, onOpenAiTypeset, onOpenExtension, onCopyGuide }: SidebarProps) {
  const [showAiMenu, setShowAiMenu] = useState(false)
  const aiMenuTimer = useRef<ReturnType<typeof setTimeout>>()
  return (
    <nav className="hidden md:flex w-12 shrink-0 flex-col items-center border-r border-slate-200 bg-white pt-2">
      {/* 顶部功能区 */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {/* 组件库 */}
        <Tooltip text="组件库">
          <button
            onClick={() => onOpenExtension?.()}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              activePanel === 'extension'
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Grid size={18} />
          </button>
        </Tooltip>

        {/* AI 排版 —— hover 展开子菜单 */}
        <div
          className="relative"
          onMouseEnter={() => {
            clearTimeout(aiMenuTimer.current)
            setShowAiMenu(true)
          }}
          onMouseLeave={() => {
            aiMenuTimer.current = setTimeout(() => setShowAiMenu(false), 200)
          }}
        >
          <Tooltip text="AI 排版">
            <button
              onClick={() => onOpenAiTypeset?.()}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                activePanel === 'ai'
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <AiStar size={18} />
            </button>
          </Tooltip>
          {/* hover 子菜单 */}
          {showAiMenu && (
            <div
              className="absolute left-full top-0 ml-2 flex flex-col gap-1 z-50"
              onMouseEnter={() => clearTimeout(aiMenuTimer.current)}
              onMouseLeave={() => setShowAiMenu(false)}
            >
              <button
                onClick={() => {
                  onCopyGuide?.()
                  setShowAiMenu(false)
                }}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-md hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <Sparkles size={12} />
                复制排版指令
              </button>
              <button
                onClick={() => {
                  onOpenAiTypeset?.()
                  setShowAiMenu(false)
                }}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[var(--accent)] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Send size={12} />
                AI 排版
              </button>
            </div>
          )}
        </div>

        {/* 其他导航项 */}
        {navItems.map(({ id, icon: IconComp, label }) => {
          const isActive = activePanel === id
          return (
            <Tooltip key={id} text={label}>
              <button
                onClick={() => onPanelChange(isActive ? null : id)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <IconComp size={18} />
              </button>
            </Tooltip>
          )
        })}
      </div>

      {/* 底部固定区 */}
      <div className="flex flex-col items-center gap-1 pb-3">
        <Tooltip text="设置">
          <button
            onClick={() => onPanelChange(activePanel === 'settings' ? null : 'settings')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              activePanel === 'settings'
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Settings size={18} />
          </button>
        </Tooltip>
        <Tooltip text="查看源码">
          <a
            href="https://github.com/huanyu-a/MarkFlow"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 98 96" fill="currentColor">
              <path d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252V91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 0 48.9043 0C21.8203 0 0 22.1074 0 49.1914C0 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008V83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z" />
            </svg>
          </a>
        </Tooltip>
        <Tooltip text="查看使用帮助">
          <button
            onClick={() => onPanelChange('help')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <HelpCircle size={18} />
          </button>
        </Tooltip>
      </div>
    </nav>
  )
}
