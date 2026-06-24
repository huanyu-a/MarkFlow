import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { components, type ComponentDef } from '@engine'
import { useStore } from '@/lib/store'
import { copyText } from '@/lib/clipboard'
import { Toast } from '@/components/ui/Toast'
import { X } from '@/components/ui/Icon'

// ── 分类定义 ──
const categories = [
  { key: 'all', label: '全部' },
  { key: 'title', label: '标题' },
  { key: 'content', label: '内容' },
  { key: 'layout', label: '布局' },
  { key: 'image', label: '图片' },
  { key: 'inline', label: '行内' },
  { key: 'interactive', label: '互动' },
  { key: 'other', label: '其他' },
]

const componentCategoryMap: Record<string, string> = {
  Title_DA01: 'title',
  Title_DA02: 'title',
  PTitle_DA01: 'title',
  Breaking_DA01: 'title',
  ReadingPath_DA01: 'content',
  Lead_DA01: 'content',
  Statement_DA01: 'content',
  Slider_DA01: 'image',
  Img_DA01: 'image',
  Steps_DA01: 'layout',
  Steps_DA02: 'layout',
  LabeledFlow_DA01: 'layout',
  Compare_DA01: 'layout',
  Timeline_DA01: 'layout',
  GovHeader_DA01: 'layout',
  Badges_DA01: 'other',
  CTA_DA01: 'interactive',
  Engage_DA01: 'interactive',
  Engage_DA02: 'interactive',
  Badge_DA01: 'inline',
  Icon_DA01: 'inline',
  Table_DA01: 'layout',
  CodeBlock_DA01: 'content',
  Callout_DA01: 'content',
  HintContainer_DA01: 'content',
  Align_DA01: 'layout',
}

interface ComponentExample {
  def: ComponentDef
  rendered: string
}

/**
 * 解析组件 example 字符串，提取 attrs 和 body
 * 例：`<title badge="GUIDE">标题</title>` → { attrs: { badge: 'GUIDE' }, body: '标题' }
 */
function parseExampleTag(example: string): { attrs: Record<string, string>; body: string } {
  const attrs: Record<string, string> = {}
  // 匹配开标签 <tagname attr="value" ...>
  const openMatch = example.match(/^<([A-Za-z_][\w.-]*)([^>]*)>/)
  if (!openMatch) return { attrs, body: example }

  const tagName = openMatch[1]
  const attrStr = openMatch[2].trim()

  // 解析属性
  if (attrStr) {
    const attrRe = /([A-Za-z_][\w.-]*)="([^"]*)"/g
    let m: RegExpExecArray | null
    while ((m = attrRe.exec(attrStr))) {
      attrs[m[1]] = m[2]
    }
  }

  // 提取 body（开标签和闭标签之间的内容）
  const openEnd = openMatch[0].length
  const closeTag = `</${tagName}>`
  const closeIdx = example.lastIndexOf(closeTag)
  const body = closeIdx > openEnd ? example.slice(openEnd, closeIdx).trim() : ''

  return { attrs, body }
}

interface ExtensionPageProps {
  onClose: () => void
}

export function ExtensionPage({ onClose }: ExtensionPageProps) {
  const colors = useStore((s) => s.colors)
  const [activeCategory, setActiveCategory] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  // 渲染所有组件预览
  const [examples, setExamples] = useState<ComponentExample[]>([])

  useEffect(() => {
    const rendered = components
      .filter((c) => c.id !== 'ReadingPath_DA01' && c.example)
      .map((def) => {
        try {
          // 解析 example 提取 attrs 和 body
          const { attrs, body } = parseExampleTag(def.example!)
          // 注意：rest[0] 在不同组件中含义不同（Title 用作原始文本统计字数，Compare 用作 inlineRenderer 函数）
          // 展示页不传 rest[0]，避免 Compare 等组件将字符串当函数调用导致崩溃
          return {
            def,
            rendered: def.render.call(def, attrs, body, colors),
          }
        } catch (err) {
          console.error(`[ExtensionPage] render failed for ${def.id}:`, err)
          return { def, rendered: '' }
        }
      })
    setExamples(rendered)
  }, [colors])

  // 分类过滤
  const filtered = useMemo(() => {
    if (activeCategory === 'all') return examples
    return examples.filter((e) => componentCategoryMap[e.def.id] === activeCategory)
  }, [examples, activeCategory])

  // 复制语法
  const handleCopy = useCallback(async (code: string) => {
    const ok = await copyText(code)
    if (ok) {
      setToast('已复制到剪贴板')
      clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(null), 1500)
    }
  }, [])

  // 插入到编辑器光标处
  const handleInsert = useCallback((code: string) => {
    window.dispatchEvent(new CustomEvent('m2v-editor-insert', { detail: { text: code } }))
    setToast('已插入到编辑器')
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1500)
  }, [])

  return (
    <div className="flex h-full flex-col bg-slate-50 overflow-hidden">
      {/* 顶栏 */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">扩展组件</h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">浏览和使用丰富的排版组件</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 px-6 py-3 border-b border-slate-100 bg-white shrink-0 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
              activeCategory === cat.key
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-transparent text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 瀑布流卡片 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="columns-2 gap-5 max-w-[900px] mx-auto max-[1024px]:columns-1">
          {filtered.map((ex) => (
            <SpotlightCard
              key={ex.def.id}
              example={ex}
              onCopy={handleCopy}
              onInsert={handleInsert}
            />
          ))}
        </div>
      </div>

      {/* Toast */}
      <Toast toast={toast ? { message: toast, key: Date.now() } : null} />
    </div>
  )
}

// ── 聚光灯卡片 ──
function SpotlightCard({
  example,
  onCopy,
  onInsert,
}: {
  example: ComponentExample
  onCopy: (code: string) => void
  onInsert: (code: string) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [showDetails, setShowDetails] = useState(false)
  const { def, rendered } = example

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
  }, [])

  // SVG 图标
  const CopyIcon = () => (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
    </svg>
  )

  return (
    <div
      ref={cardRef}
      className="group relative break-inside-avoid mb-5 inline-block w-full rounded-2xl bg-white border border-slate-200 shadow-sm cursor-default overflow-hidden"
      style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}
      onMouseMove={handleMouseMove}
    >
      {/* 高光层 */}
      <div className="absolute inset-0 z-[3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none spotlight-glow" style={{
        background: 'radial-gradient(350px circle at var(--mouse-x) var(--mouse-y), rgba(var(--accent-rgb,108,92,231),0.12), rgba(var(--accent-rgb,108,92,231),0.04) 40%, transparent 70%)',
      }} />

      {/* 卡片内容 */}
      <div className="relative z-[1]">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">{def.name}</span>
            <span className="text-[10px] font-mono text-[var(--accent)] bg-[var(--accent)]/8 px-1.5 py-0.5 rounded">&lt;{def.tag}&gt;</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* 插入按钮 */}
            {def.example && (
              <button
                onClick={() => onInsert(def.example!)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-[10px] text-emerald-600 cursor-pointer hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
              >
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v10M3 8h10" />
                </svg>
                插入
              </button>
            )}
            {/* 复制按钮 */}
            {def.example && (
              <button
                onClick={() => onCopy(def.example!)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-[var(--accent)]/5 text-[10px] text-[var(--accent)] cursor-pointer hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all"
              >
                <CopyIcon />
                复制
              </button>
            )}
            {/* 展开/收起按钮 */}
            {def.example && (
              <button
                onClick={() => setShowDetails((v) => !v)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] cursor-pointer transition-all ${
                  showDetails
                    ? 'border-slate-300 bg-slate-100 text-slate-600'
                    : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
                title={showDetails ? '收起代码与属性' : '展开代码与属性'}
              >
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 渲染预览 */}
        <div className="px-5 pb-4">
          {rendered ? (
            <div
              className="preview-content max-w-full [&_section]:transition-opacity [&_section]:duration-150"
              dangerouslySetInnerHTML={{ __html: rendered }}
            />
          ) : (
            <div className="text-xs text-slate-300 italic py-8 text-center">暂无示例</div>
          )}
        </div>

        {/* 可折叠：语法代码 + 属性说明 */}
        {showDetails && (
          <div className="px-5 pb-5 space-y-4 transition-all duration-150">
            {/* 语法代码 */}
            {def.example && (
              <div>
                <pre className="m-0 p-3 bg-[#1e1e2e] rounded-xl border border-white/5 text-[#e0e0e0] font-mono text-[11px] leading-6 overflow-auto whitespace-pre-wrap break-all max-h-40">
                  <code>{def.example}</code>
                </pre>
              </div>
            )}

            {/* 属性说明表 */}
            {def.attrs && def.attrs.length > 0 && (
              <div className="rounded-lg border border-slate-200 overflow-hidden text-[11px]">
                <div className="grid grid-cols-[90px_1fr] bg-[var(--accent)]/5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  <span className="px-2.5 py-1.5">属性</span>
                  <span className="px-2.5 py-1.5">说明</span>
                </div>
                {def.attrs.map((attr) => (
                  <div key={attr.key} className="grid grid-cols-[90px_1fr] border-t border-slate-100">
                    <span className="px-2.5 py-1.5 flex items-center">
                      <code className="font-mono text-[11px] text-[var(--accent)] bg-[var(--accent)]/8 px-1.5 py-0.5 rounded">{attr.key}</code>
                      {attr.required && <span className="text-[9px] text-red-500 ml-1 font-semibold">必填</span>}
                    </span>
                    <span className="px-2.5 py-1.5 text-slate-500 text-[11px] leading-5 flex flex-wrap items-center">
                      {attr.label}
                      {attr.default && <>, 默认 <code className="font-mono text-[10px] text-[var(--accent)] bg-[var(--accent)]/8 px-1 rounded">{attr.default}</code></>}
                      {attr.options && attr.options.length > 0 && (
                        <>, 可选 {attr.options.map((opt, i) => (
                          <code key={opt} className="font-mono text-[10px] text-[var(--accent)] bg-[var(--accent)]/8 px-1 rounded">
                            {opt}{i < attr.options!.length - 1 ? ' / ' : ''}
                          </code>
                        ))}</>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
