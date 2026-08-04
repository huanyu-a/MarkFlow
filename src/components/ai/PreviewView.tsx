import { useMemo } from 'react'
import type { ThemeColors } from '@engine'
import type { ResolvedTokens } from '@engine/tokens'
import { UI_LABELS } from '@/lib/uiLabels'
import { renderMarkdown } from '@/lib/render/markdown'
import { sanitizeHtml } from '@/lib/htmlSanitizer'
import {
  AiStar,
  Columns2,
  FileText,
  Check,
  RotateCcw,
  X,
} from '@/components/ui/Icon'

interface PreviewViewProps {
  streamingResult: string
  isRunning: boolean
  previewMode: 'rendered' | 'raw'
  beforeContent: string
  colors: ThemeColors
  themeTokens: ResolvedTokens | undefined
  onApply: () => void
  onDiscard: () => void
  onRerun: () => void
  onChangeMode: (mode: 'rendered' | 'raw') => void
}

export function PreviewView({
  streamingResult,
  isRunning,
  previewMode,
  beforeContent,
  colors,
  themeTokens,
  onApply,
  onDiscard,
  onRerun,
  onChangeMode,
}: PreviewViewProps) {
  const originalRendered = useMemo(() => {
    if (!beforeContent) return null
    try {
      return renderMarkdown(beforeContent, colors, undefined, undefined, themeTokens)
    } catch {
      return null
    }
  }, [beforeContent, colors, themeTokens])

  const resultRendered = useMemo(() => {
    if (!streamingResult.trim()) return null
    // 去除可能的代码块包裹
    let content = streamingResult.trim()
    const fenceMatch = content.match(/^```(?:markdown|md|html)?\s*\n([\s\S]*?)\n```\s*$/i)
    if (fenceMatch) content = fenceMatch[1].trim()
    try {
      return renderMarkdown(content, colors, undefined, undefined, themeTokens)
    } catch {
      return null
    }
  }, [streamingResult, colors, themeTokens])

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between shrink-0 px-3 py-2 border-b border-slate-100">
        <span className="text-[12px] font-semibold text-slate-700 flex items-center gap-1.5">
          <AiStar size={13} className="text-[var(--accent)]" />
          {UI_LABELS.aiTypeset.previewTitle}
          {isRunning && <span className="text-[10px] text-slate-400 animate-pulse">生成中…</span>}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeMode('rendered')}
            title="渲染对比"
            className={`rounded p-1 transition-colors cursor-pointer ${
              previewMode === 'rendered' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Columns2 size={14} />
          </button>
          <button
            onClick={() => onChangeMode('raw')}
            title="纯文本"
            className={`rounded p-1 transition-colors cursor-pointer ${
              previewMode === 'raw' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText size={14} />
          </button>
        </div>
      </div>

      {/* 渲染对比视图：原始 vs AI 结果，单容器同步滚动 */}
      {previewMode === 'rendered' ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            {/* 左：原始内容 */}
            <div>
              <div className="sticky top-0 z-[1] bg-slate-50/95 border-b border-slate-100 px-3 py-1 text-[10px] font-medium text-slate-400">
                排版前
              </div>
              <div
                className="p-3 text-[12px] leading-relaxed text-slate-600"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(originalRendered?.html ?? '<p class="text-slate-300">无内容</p>') }}
              />
            </div>
            {/* 右：AI 结果 */}
            <div>
              <div className="sticky top-0 z-[1] bg-[var(--accent)]/5 border-b border-slate-100 px-3 py-1 text-[10px] font-medium text-[var(--accent)]">
                排版后
              </div>
              <div
                className="p-3 text-[12px] leading-relaxed text-slate-600"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(resultRendered?.html ?? '<p class="text-slate-300">渲染中…</p>') }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <pre className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap break-words font-mono">
            {streamingResult}
          </pre>
        </div>
      )}

      {/* 底部操作栏 */}
      {!isRunning && (
        <div className="flex items-center gap-2 shrink-0 border-t border-slate-100 px-3 py-2">
          <button
            onClick={onApply}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] py-1.5 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Check size={14} /> {UI_LABELS.aiTypeset.applyButton}
          </button>
          <button
            onClick={onRerun}
            className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw size={12} /> {UI_LABELS.aiTypeset.retryButton}
          </button>
          <button
            onClick={onDiscard}
            className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X size={12} /> 丢弃
          </button>
        </div>
      )}
    </div>
  )
}
