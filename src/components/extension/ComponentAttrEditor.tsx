import { useState, useEffect, useCallback, useRef } from 'react'
import type { EditorView } from '@uiw/react-codemirror'
import { tagMap } from '@engine'
import { X } from '@/components/ui/Icon'

// ── 调色板预设颜色 ──
const COLOR_PALETTE = [
  '#6c5ce7', '#5a4bd1', '#7c3aed', '#8b5cf6', '#a78bfa',
  '#e74c3c', '#ef4444', '#f87171', '#c62828', '#dc2626',
  '#f5a623', '#f59e0b', '#fbbf24', '#f97316', '#ea580c',
  '#2e7d32', '#22c55e', '#4ade80', '#16a34a', '#15803d',
  '#2196f3', '#3b82f6', '#60a5fa', '#2563eb', '#1d4ed8',
  '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#6366f1',
  '#475569', '#64748b', '#94a3b8', '#334155', '#1e293b',
  '#ec4899', '#f43f5e', '#d946ef', '#a855f7', '#000000',
]

// ── Icon 网格图标列表 ──
const ICON_GRID = [
  'material-symbols:star',
  'material-symbols:home',
  'material-symbols:search',
  'material-symbols:person',
  'material-symbols:settings',
  'material-symbols:favorite',
  'material-symbols:mail',
  'material-symbols:call',
  'material-symbols:share',
  'material-symbols:download',
  'material-symbols:info',
  'material-symbols:warning',
  'material-symbols:check',
  'material-symbols:close',
  'material-symbols:edit',
  'material-symbols:delete',
  'material-symbols:add',
  'material-symbols:arrow-forward',
  'material-symbols:visibility',
  'material-symbols:lock',
]

interface ComponentAttrEditorProps {
  tag: string
  from: number
  to: number
  view: EditorView | null
  onClose: () => void
}

interface ParsedTag {
  tagName: string
  attrs: Record<string, string>
  body: string
  fullMatch: string
  openTagEnd: number // open tag 结束位置（含 >）
  closeTagStart: number // close tag 起始位置（含 </）
}

/**
 * 解析标签字符串，提取标签名、属性和内容
 * 支持格式：
 *   <tagname attr="value">body</tagname>
 *   <tagname attr="value" />
 *   ::: type title\ncontent\n:::
 *   ```lang\ncode\n```
 */
function parseTag(text: string): ParsedTag | null {
  // ── ::: container 语法 ──
  const containerMatch = text.match(/^(:{3,4})\s*(\w+)\s*(.*)/)
  if (containerMatch) {
    const colonCount = containerMatch[1].length
    const type = containerMatch[2]
    const rest = containerMatch[3]?.trim() || ''
    const closeRe = new RegExp(`^:{${colonCount}}\\s*$`, 'm')
    const closeIdx = text.search(closeRe)
    const bodyEnd = closeIdx > 0 ? closeIdx : text.length
    const content = text.substring(containerMatch[0].length, bodyEnd).trim()

    // 解析 key=value 属性与标题
    const attrs: Record<string, string> = {}
    let title = ''
    const attrRe = /(\w[\w-.]*)=("[^"]*"|\S+)/g
    let attrMatch: RegExpExecArray | null
    let lastIndex = 0
    while ((attrMatch = attrRe.exec(rest))) {
      const key = attrMatch[1]
      let val = attrMatch[2]
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      attrs[key] = val
      lastIndex = attrMatch.index + attrMatch[0].length
    }
    // 剩余部分作为标题
    title = rest.substring(lastIndex).trim()

    const tag = type === 'table' ? 'table' : 'hint'
    attrs.type = type
    if (title) attrs.title = title

    return { tagName: tag, attrs, body: content, fullMatch: text, openTagEnd: 0, closeTagStart: text.length }
  }

  // ── ``` code fence 语法 ──
  const fenceMatch = text.match(/^```(\w*)\n([\s\S]*?)```/)
  if (fenceMatch) {
    const lang = fenceMatch[1]
    const code = fenceMatch[2]
    const attrs: Record<string, string> = { lang }
    return { tagName: 'code-block', attrs, body: code, fullMatch: text, openTagEnd: 0, closeTagStart: text.length }
  }

  // ── <tag> 语法 ──
  const openMatch = text.match(/^<([A-Za-z_][\w.-]*)([^>]*)\/?>/)
  if (!openMatch) return null

  const tagName = openMatch[1]
  const attrStr = openMatch[2].trim()
  const openTagEnd = openMatch[0].length

  const isSelfClosing = /\/>\s*$/.test(text)

  if (isSelfClosing) {
    const attrs: Record<string, string> = {}
    if (attrStr) {
      const attrRe = /([A-Za-z_][\w.-]*)="([^"]*)"/g
      let m: RegExpExecArray | null
      while ((m = attrRe.exec(attrStr))) {
        attrs[m[1]] = m[2]
      }
    }
    return { tagName, attrs, body: '', fullMatch: text, openTagEnd, closeTagStart: text.length }
  }

  const closePattern = new RegExp(`</${tagName}\\s*>\\s*$`)
  const closeMatch = text.match(closePattern)
  if (!closeMatch) return null

  const closeTagStart = text.length - closeMatch[0].length
  const body = text.slice(openTagEnd, closeTagStart)

  const attrs: Record<string, string> = {}
  if (attrStr) {
    const attrRe = /([A-Za-z_][\w.-]*)="([^"]*)"/g
    let m: RegExpExecArray | null
    while ((m = attrRe.exec(attrStr))) {
      attrs[m[1]] = m[2]
    }
  }

  return { tagName, attrs, body, fullMatch: text, openTagEnd, closeTagStart }
}

/**
 * 重建标签字符串
 */
function rebuildTag(tagName: string, attrs: Record<string, string>, body: string, original: string): string {
  // ::: container
  if (/^:{3,4}\s*\w+/.test(original)) {
    const colonMatch = original.match(/^(:{3,4})\s*/)
    const colons = colonMatch ? colonMatch[1] : ':::'
    const type = attrs.type || 'info'
    const title = attrs.title || ''
    // 输出额外属性（type 和 title 除外）
    const extraAttrs = Object.entries(attrs)
      .filter(([k]) => k !== 'type' && k !== 'title')
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ')
    const header = `${colons} ${type}${extraAttrs ? ' ' + extraAttrs : ''}${title ? ' ' + title : ''}`
    return header + '\n' + body + (body ? '\n' : '') + colons
  }

  // ``` code fence
  if (/^```/.test(original)) {
    const lang = attrs.lang || ''
    return '```' + lang + '\n' + body + '\n```'
  }

  const isSelfClosing = /\/>\s*$/.test(original)
  // 保留原始的闭标签格式
  const closeMatch = original.match(/(<\/[^>]+>\s*)$/)

  const attrParts = Object.entries(attrs)
    .filter(([k]) => k !== 'type' && k !== 'title' && k !== 'lang')
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')

  // 自闭合标签：<Badge type="tip" text="推荐" />
  if (isSelfClosing) {
    return `<${tagName}${attrParts ? ' ' + attrParts : ''} />`
  }

  const newOpen = `<${tagName}${attrParts ? ' ' + attrParts : ''}>`
  const newClose = closeMatch ? closeMatch[1] : `</${tagName}>`

  return newOpen + body + newClose
}

export function ComponentAttrEditor({ tag, from, to, view, onClose }: ComponentAttrEditorProps) {
  const comp = tagMap[tag]
  const [attrs, setAttrs] = useState<Record<string, string>>({})
  const [body, setBody] = useState('')
  const [originalText, setOriginalText] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  // 解析选中区域的标签
  useEffect(() => {
    if (!view || !tag) return
    const text = view.state.doc.sliceString(from, to)
    const parsed = parseTag(text)
    if (parsed) {
      setAttrs({ ...parsed.attrs })
      setBody(parsed.body)
      setOriginalText(parsed.fullMatch)
    }
  }, [view, tag, from, to])

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // 应用属性修改到编辑器
  const applyChanges = useCallback(() => {
    if (!view || !tag || !originalText) return
    const newText = rebuildTag(tag, attrs, body, originalText)
    if (newText === originalText) return
    view.dispatch({
      changes: { from, to, insert: newText },
    })
  }, [view, tag, attrs, body, originalText, from, to])

  const handleAttrChange = (key: string, value: string) => {
    setAttrs((prev) => ({ ...prev, [key]: value }))
  }

  if (!comp) return null

  const isIcon = tag === 'Icon'
  const iconPreviewName = isIcon ? (attrs.name || 'material-symbols:star') : ''

  return (
    <div
      ref={panelRef}
      className="absolute z-40 w-72 rounded-lg border border-slate-200 bg-white shadow-xl"
      style={{ top: 8, right: 8 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
            &lt;{tag}&gt;
          </span>
          <span className="text-xs text-slate-500">{comp.name}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Icon live preview */}
      {isIcon && iconPreviewName && (
        <div className="flex justify-center items-center py-4 bg-slate-50 border-b border-slate-100">
          <img
            src={`https://api.iconify.design/${encodeURIComponent(iconPreviewName)}.svg`}
            alt="预览"
            style={{ width: 48, height: 48 }}
          />
        </div>
      )}

      {/* Attrs */}
      <div className="max-h-80 overflow-y-auto p-3 space-y-2.5">
        {comp.attrs?.map((attr) => {
          const isColor = attr.key.includes('color') || attr.key === 'color'
          const isIconName = isIcon && attr.key === 'name'

          return (
          <div key={attr.key}>
            <label className="mb-1 block text-[11px] font-medium text-slate-500">
              {attr.label}
              {attr.required && <span className="ml-0.5 text-red-400">*</span>}
            </label>
            {isIconName ? (
              // Icon name: grid picker + custom input
              <div>
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {ICON_GRID.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleAttrChange('name', name)}
                      className={`flex items-center justify-center rounded p-1.5 transition-colors cursor-pointer ${
                        attrs.name === name
                          ? 'bg-indigo-100 ring-1 ring-indigo-300'
                          : 'hover:bg-slate-100'
                      }`}
                      title={name}
                    >
                      <img
                        src={`https://api.iconify.design/${encodeURIComponent(name)}.svg`}
                        alt={name}
                        style={{ width: 24, height: 24 }}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={attrs.name ?? ''}
                    onChange={(e) => handleAttrChange('name', e.target.value)}
                    placeholder="自定义图标名称（如 skill-icons:vscode-dark）"
                    className="flex-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-500 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                  />
                  <a
                    href="https://icon-sets.iconify.design/"
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-[10px] text-indigo-500 hover:text-indigo-700 whitespace-nowrap"
                  >
                    更多 →
                  </a>
                </div>
              </div>
            ) : attr.options ? (
              <select
                value={attrs[attr.key] ?? attr.default ?? ''}
                onChange={(e) => handleAttrChange(attr.key, e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
              >
                <option value="">默认</option>
                {attr.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : isColor ? (
              // Color input with palette
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={attrs[attr.key] || '#6c5ce7'}
                    onChange={(e) => handleAttrChange(attr.key, e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={attrs[attr.key] ?? attr.default ?? ''}
                    onChange={(e) => handleAttrChange(attr.key, e.target.value)}
                    placeholder={attr.default}
                    className="flex-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                  />
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleAttrChange(attr.key, c)}
                      className="w-4 h-4 rounded-sm border border-slate-200 cursor-pointer hover:scale-125 transition-transform"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={attrs[attr.key] ?? attr.default ?? ''}
                onChange={(e) => handleAttrChange(attr.key, e.target.value)}
                placeholder={attr.default}
                className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
              />
            )}
          </div>
        )})}

        {/* Body editor */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-500">内容</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-3 py-2">
        <button
          onClick={applyChanges}
          className="w-full rounded bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 transition-colors cursor-pointer"
        >
          应用修改
        </button>
      </div>
    </div>
  )
}
