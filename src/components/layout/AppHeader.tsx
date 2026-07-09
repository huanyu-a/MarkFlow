import { useRef, useEffect, useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import type { RenderMode } from '@/lib/store'
import { ModeTabs } from '@/components/layout/ModeTabs'
import { THEMES } from '@engine/composables/useTheme'
import { THEME_CATEGORIES, getThemeProfile } from '@engine/themes'

type ThemeTab = 'styles' | 'colors'

interface AppHeaderProps {
  mode: RenderMode
  setMode: (mode: RenderMode) => void
  accent: string
  setTheme: (accent: string, dark: string) => void
  setThemeProfile: (id: string) => void
  onOpenMobileMenu: () => void
  onWidthChange: (width: number) => void
}

export function AppHeader({
  mode,
  setMode,
  accent,
  setTheme,
  setThemeProfile,
  onOpenMobileMenu,
  onWidthChange,
}: AppHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerWidth, setHeaderWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  )
  const [showThemePanel, setShowThemePanel] = useState(false)
  const [activeThemeTab, setActiveThemeTab] = useState<ThemeTab>('styles')
  const [themeSearch, setThemeSearch] = useState('')

  const themeProfileId = useStore((s) => s.themeProfileId)
  const themeProfiles = useStore((s) => s.themeProfiles)
  const currentProfile = getThemeProfile(themeProfileId)

  const filteredCategories = useMemo(() => {
    const q = themeSearch.trim().toLowerCase()
    return THEME_CATEGORIES.map((cat) => ({
      ...cat,
      profiles: themeProfiles.filter(
        (p) =>
          p.category === cat.id &&
          (q === '' ||
            p.name.toLowerCase().includes(q) ||
            cat.name.toLowerCase().includes(q)),
      ),
    })).filter((cat) => cat.profiles.length > 0)
  }, [themeSearch, themeProfiles])

  useEffect(() => {
    // 监听窗口宽度（而非 header 自身宽度），使响应式判断与视口一致
    const update = () => {
      const w = window.innerWidth
      setHeaderWidth(w)
      onWidthChange(w)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [onWidthChange])

  // 点击外部关闭主题面板
  useEffect(() => {
    if (!showThemePanel) return
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-theme-toggle]') && !target.closest('[data-theme-panel]')) {
        setShowThemePanel(false)
        setThemeSearch('')
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showThemePanel])

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
        {/* 主题 + 调色板：融合为一个统一面板 */}
        {headerWidth >= 960 && (
          <div className="relative">
            <button
              data-theme-toggle
              onClick={() => setShowThemePanel(!showThemePanel)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
              title="主题与配色"
            >
              {/* 调色板图标 */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
                <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
                <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
                <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
              </svg>
              {headerWidth >= 1300 && <span>{currentProfile?.name ?? '主题'}</span>}
            </button>
            {showThemePanel && (
              <div
                data-theme-panel
                className="absolute right-0 top-full mt-2 w-[300px] max-h-[480px] rounded-xl border border-slate-200 bg-white shadow-xl z-50 flex flex-col overflow-hidden"
              >
                {/* Tab 切换 */}
                <div className="flex border-b border-slate-100 shrink-0">
                  <button
                    onClick={() => setActiveThemeTab('styles')}
                    className={`flex-1 py-2 text-[12px] font-medium transition-colors cursor-pointer ${activeThemeTab === 'styles' ? 'text-slate-800 border-b-2 border-[var(--accent)]' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    主题风格
                  </button>
                  <button
                    onClick={() => setActiveThemeTab('colors')}
                    className={`flex-1 py-2 text-[12px] font-medium transition-colors cursor-pointer ${activeThemeTab === 'colors' ? 'text-slate-800 border-b-2 border-[var(--accent)]' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    配色
                  </button>
                </div>

                {/* Tab: 主题风格（色块网格） */}
                {activeThemeTab === 'styles' && (
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-2 border-b border-slate-100 shrink-0">
                      <input
                        type="text"
                        value={themeSearch}
                        onChange={(e) => setThemeSearch(e.target.value)}
                        placeholder="搜索主题或分类..."
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-[12px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                      {filteredCategories.map((cat) => (
                        <div key={cat.id} className="mb-3">
                          <div className="px-1 py-0.5 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{cat.name}</div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {cat.profiles.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => { setThemeProfile(p.id) }}
                                className={`relative flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all cursor-pointer ${themeProfileId === p.id ? 'bg-slate-100 ring-2 ring-[var(--accent)]' : 'hover:bg-slate-50'}`}
                                title={p.name}
                              >
                                <span
                                  className="h-8 w-8 rounded-full shadow-sm border border-slate-200"
                                  style={{ background: `linear-gradient(135deg, ${p.accent} 0%, ${p.dark} 100%)` }}
                                />
                                <span className="text-[10px] text-slate-500 truncate w-full text-center leading-tight">{p.name}</span>
                                {themeProfileId === p.id && (
                                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {filteredCategories.length === 0 && (
                        <div className="text-center text-[12px] text-slate-400 py-6">无匹配主题</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: 配色 */}
                {activeThemeTab === 'colors' && (
                  <div className="p-2.5">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">纯色（仅改强调色）</div>
                    <div className="grid grid-cols-5 gap-2 justify-items-center">
                      {THEMES.map((t) => (
                        <button
                          key={t.accent}
                          title={t.accent}
                          onClick={() => { setTheme(t.accent, t.dark) }}
                          className="h-8 w-8 rounded-full transition-transform hover:scale-110 cursor-pointer shrink-0 border border-slate-200"
                          style={{
                            background: `linear-gradient(135deg, ${t.accent} 0%, ${t.dark} 100%)`,
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
            )}
          </div>
        )}

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
