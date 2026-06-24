import { useRef, useEffect, useState } from 'react'
import type { RenderMode } from '@/lib/store'
import { ModeTabs } from '@/components/layout/ModeTabs'
import { THEMES } from '@engine/composables/useTheme'

interface AppHeaderProps {
  mode: RenderMode
  setMode: (mode: RenderMode) => void
  accent: string
  setTheme: (accent: string, dark: string) => void
  onOpenMobileMenu: () => void
  onWidthChange: (width: number) => void
}

export function AppHeader({
  mode,
  setMode,
  accent,
  setTheme,
  onOpenMobileMenu,
  onWidthChange,
}: AppHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerWidth, setHeaderWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  )
  const [showThemes, setShowThemes] = useState(false)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      setHeaderWidth(rect.width)
      onWidthChange(rect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [onWidthChange])

  // 点击外部关闭主题面板
  useEffect(() => {
    if (!showThemes) return
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-theme-toggle]') && !target.closest('[data-theme-panel]')) {
        setShowThemes(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showThemes])

  return (
    <header
      ref={headerRef}
      className="app-header relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm"
    >
      <div className="flex items-center gap-6">
        <a
          href="https://www.bx9y.com.cn/"
          className="flex items-center gap-1 text-[12px] font-medium text-slate-400 hover:text-slate-600 transition-colors no-underline shrink-0"
          title="回到知识分享萌首页"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
          {headerWidth >= 960 && <span>知识分享萌</span>}
        </a>
        <div className="flex items-center gap-2">
          <div className="app-logo-bg flex h-7 w-7 items-center justify-center rounded-md text-white shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
          </div>
          {headerWidth >= 1300 ? (
            <h1 className="text-[17px] font-bold tracking-tight text-slate-800">
              Mark<span className="app-title-accent">Flow</span>
            </h1>
          ) : (
            <h1 className="text-[17px] font-bold tracking-tight text-slate-800">
              MF
            </h1>
          )}
        </div>
        {headerWidth >= 960 && (
          <ModeTabs mode={mode} onChange={setMode} />
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* 主题色按钮：点击展开色板 */}
        <div className="relative">
          <button
            data-theme-toggle
            onClick={() => setShowThemes(!showThemes)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            title="切换主题色"
          >
            {/* 调色板图标 */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
            {headerWidth >= 1300 && <span>主题</span>}
          </button>
          {showThemes && (
            <div
              data-theme-panel
              className="absolute right-0 top-full mt-2 w-[180px] rounded-lg border border-slate-200 bg-white p-2.5 shadow-xl z-50"
            >
              <div className="flex flex-wrap gap-1.5">
                {THEMES.map((t) => (
                  <button
                    key={t.accent}
                    title={t.accent}
                    onClick={() => { setTheme(t.accent, t.dark); setShowThemes(false) }}
                    className="h-6 w-6 rounded-full transition-transform hover:scale-110 cursor-pointer shrink-0"
                    style={{
                      background: t.accent,
                      boxShadow: accent === t.accent
                        ? '0 0 0 2px #fff, 0 0 0 3px var(--accent)'
                        : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 移动端菜单按钮 */}
        {headerWidth < 960 && (
          <button
            onClick={onOpenMobileMenu}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            title="更多菜单"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
