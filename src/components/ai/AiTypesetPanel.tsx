import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useStore, useContentStore, type RenderMode } from '@/lib/store'
import { callAiStream, isAiConfigReady, type AiCallConfig } from '@/lib/aiService'
import { getAllSkills, buildSkillsPrompt, buildModeContextPrompt } from '@/lib/aiSkills'
import { renderMarkdown } from '@/lib/render/markdown'
import { UI_LABELS } from '@/lib/uiLabels'
import { AiStar, Send, Check, X, RotateCcw, Undo2, Redo2, Columns2, FileText, Maximize2, Minimize2 } from '@/components/ui/Icon'
import { usePanelFullscreen } from '@/components/ui/ResizablePanel'

interface AiTypesetPanelProps {
  mode: RenderMode
  onToast: (msg: string) => void
  onClose: () => void
  /** 打开面板后自动开始 AI 排版 */
  autoRun?: boolean
}

const MODE_NAMES: Record<RenderMode, string> = {
  article: '长图文',
  document: 'A4 文档',
  card: '小红书卡片',
  html: 'HTML',
}

/** 所有技能内置，用户无需手动选择 */
const ALL_SKILLS = getAllSkills()
const ALL_SKILLS_PROMPT = buildSkillsPrompt(ALL_SKILLS)

/** 从 contentStore 获取当前模式的编辑器内容 */
function useCurrentContent(mode: RenderMode): string {
  const articleMarkdown = useContentStore((s) => s.articleMarkdown)
  const documentMarkdown = useContentStore((s) => s.documentMarkdown)
  const cardMarkdown = useContentStore((s) => s.cardMarkdown)
  const html = useContentStore((s) => s.html)
  switch (mode) {
    case 'article': return articleMarkdown
    case 'document': return documentMarkdown
    case 'card': return cardMarkdown
    case 'html': return html
  }
}

/** 从 contentStore 获取当前模式的内容设置函数 */
function useSetCurrentContent(mode: RenderMode): (v: string) => void {
  const setArticleMarkdown = useContentStore((s) => s.setArticleMarkdown)
  const setDocumentMarkdown = useContentStore((s) => s.setDocumentMarkdown)
  const setCardMarkdown = useContentStore((s) => s.setCardMarkdown)
  const setHtml = useContentStore((s) => s.setHtml)
  switch (mode) {
    case 'article': return setArticleMarkdown
    case 'document': return setDocumentMarkdown
    case 'card': return setCardMarkdown
    case 'html': return setHtml
  }
}

export function AiTypesetPanel({ mode, onToast, onClose, autoRun }: AiTypesetPanelProps) {
  // AI 配置统一从 store 读取（在设置弹窗中配置）
  const aiConfig = useStore((s) => s.aiConfig)
  const colors = useStore((s) => s.colors)
  const { fullscreen, toggleFullscreen } = usePanelFullscreen()

  // AI 调用状态
  const [isRunning, setIsRunning] = useState(false)
  const [streamingResult, setStreamingResult] = useState('')
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // 当前内容
  const currentContent = useCurrentContent(mode)
  const setCurrentContent = useSetCurrentContent(mode)

  // ---- 撤销/重做 历史栈 ----
  const [historyStack, setHistoryStack] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // ---- 预览模式 ----
  const [previewMode, setPreviewMode] = useState<'rendered' | 'raw'>('rendered') // rendered: 渲染对比, raw: 纯文本

  // AI 排版前的原始内容（用于对比）
  const beforeContentRef = useRef('')

  // 渲染原始内容和 AI 结果的 HTML
  const originalRendered = useMemo(() => {
    if (!beforeContentRef.current) return null
    try {
      return renderMarkdown(beforeContentRef.current, colors)
    } catch {
      return null
    }
  }, [beforeContentRef.current, colors])

  const resultRendered = useMemo(() => {
    if (!streamingResult.trim()) return null
    // 去除可能的代码块包裹
    let content = streamingResult.trim()
    const fenceMatch = content.match(/^```(?:markdown|md|html)?\s*\n([\s\S]*?)\n```\s*$/i)
    if (fenceMatch) content = fenceMatch[1].trim()
    try {
      return renderMarkdown(content, colors)
    } catch {
      return null
    }
  }, [streamingResult, colors])

  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return
    const prevIndex = historyIndex - 1
    const prevContent = historyStack[prevIndex]
    setCurrentContent(prevContent)
    setHistoryIndex(prevIndex)
    onToast('已撤销')
  }, [historyIndex, historyStack, setCurrentContent, onToast])

  // 重做
  const handleRedo = useCallback(() => {
    if (historyIndex >= historyStack.length - 1) return
    const nextIndex = historyIndex + 1
    const nextContent = historyStack[nextIndex]
    setCurrentContent(nextContent)
    setHistoryIndex(nextIndex)
    onToast('已重做')
  }, [historyIndex, historyStack, setCurrentContent, onToast])

  const handleRun = useCallback(async () => {
    const fullConfig: AiCallConfig = {
      apiUrl: aiConfig.apiUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
    }
    if (!isAiConfigReady(fullConfig)) {
      setError('请先在「设置 → AI 配置」中配置 API 地址和 Key')
      return
    }
    if (!currentContent.trim()) {
      setError('编辑器内容为空，请先输入内容')
      return
    }

    // 记录 AI 排版前的内容，用于对比
    beforeContentRef.current = currentContent

    setIsRunning(true)
    setStreamingResult('')
    setError('')

    const controller = new AbortController()
    abortRef.current = controller

    const modeContext = buildModeContextPrompt(mode)
    const systemPrompt = `${modeContext}\n\n## 可用排版技能\n\n${ALL_SKILLS_PROMPT}`

    try {
      await callAiStream(
        fullConfig,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `以下是我的${MODE_NAMES[mode]}内容，请使用排版技能对其进行增强排版。\n\n【重要】输出格式要求：\n- 如果原文已有 # 标题，则保留原标题，不要重新生成；如果原文没有标题，则在第一行用 # 生成一个简洁有力的标题（不超过20字）\n- 在标题之后、正文之前，用 > 引用块 生成一句话摘要（提炼核心观点，不超过50字）\n- 摘要之后为正文内容\n\n以下是原文：\n\n${currentContent}` },
        ],
        (chunk) => setStreamingResult((prev) => prev + chunk),
        controller.signal,
      )
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message || 'AI 调用失败')
      }
    } finally {
      setIsRunning(false)
      abortRef.current = null
    }
  }, [aiConfig, currentContent, mode])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  // 自动运行：打开面板后立即发起 AI 排版
  const hasAutoRunRef = useRef(false)
  useEffect(() => {
    if (autoRun && !hasAutoRunRef.current) {
      hasAutoRunRef.current = true
      handleRun()
    }
  }, [autoRun, handleRun])

  const handleApply = useCallback(() => {
    if (!streamingResult.trim()) return
    // 去除 AI 返回中可能包裹的 ```markdown ... ``` 代码块标记
    let result = streamingResult.trim()
    const fenceMatch = result.match(/^```(?:markdown|md|html)?\s*\n([\s\S]*?)\n```\s*$/i)
    if (fenceMatch) result = fenceMatch[1].trim()

    // 保存当前内容到历史栈（用于撤销）
    const newStack = historyStack.slice(0, historyIndex + 1)
    newStack.push(currentContent)
    setHistoryStack(newStack)
    setHistoryIndex(newStack.length - 1)

    setCurrentContent(result)
    setStreamingResult('')
    onToast('已应用 AI 排版结果')
  }, [streamingResult, setCurrentContent, onToast, historyStack, historyIndex, currentContent])

  const handleDiscard = useCallback(() => {
    setStreamingResult('')
    setError('')
  }, [])

  const hasResult = streamingResult.trim().length > 0
  const configReady = isAiConfigReady(aiConfig)
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < historyStack.length - 1

  return (
    <>
      <div className="flex h-full flex-col bg-white">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <AiStar size={15} className="text-[var(--accent)]" />
            {UI_LABELS.aiTypeset.title}
          </h3>
          {/* 撤销/重做按钮 */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              title="撤销"
              className={`rounded p-1.5 transition-colors cursor-pointer ${
                canUndo
                  ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  : 'text-slate-200 cursor-not-allowed'
              }`}
            >
              <Undo2 size={15} />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              title="重做"
              className={`rounded p-1.5 transition-colors cursor-pointer ${
                canRedo
                  ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  : 'text-slate-200 cursor-not-allowed'
              }`}
            >
              <Redo2 size={15} />
            </button>
            <button
              onClick={toggleFullscreen}
              title={fullscreen ? '退出全屏' : '全屏'}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {hasResult ? (
            /* 有结果时：预览占满全部空间 */
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
                    onClick={() => setPreviewMode('rendered')}
                    title="渲染对比"
                    className={`rounded p-1 transition-colors cursor-pointer ${
                      previewMode === 'rendered' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Columns2 size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewMode('raw')}
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
                        dangerouslySetInnerHTML={{ __html: originalRendered?.html ?? '<p class="text-slate-300">无内容</p>' }}
                      />
                    </div>
                    {/* 右：AI 结果 */}
                    <div>
                      <div className="sticky top-0 z-[1] bg-[var(--accent)]/5 border-b border-slate-100 px-3 py-1 text-[10px] font-medium text-[var(--accent)]">
                        排版后
                      </div>
                      <div
                        className="p-3 text-[12px] leading-relaxed text-slate-600"
                        dangerouslySetInnerHTML={{ __html: resultRendered?.html ?? '<p class="text-slate-300">渲染中…</p>' }}
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
                    onClick={handleApply}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] py-1.5 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Check size={14} /> {UI_LABELS.aiTypeset.applyButton}
                  </button>
                  <button
                    onClick={() => { setStreamingResult(''); handleRun() }}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} /> {UI_LABELS.aiTypeset.retryButton}
                  </button>
                  <button
                    onClick={handleDiscard}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <X size={12} /> 丢弃
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* 无结果时：配置提示 + 操作按钮 */
            <div className="flex flex-col items-center justify-center gap-3 p-4 overflow-y-auto h-full">
              {!configReady && (
                <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700 flex items-start gap-2">
                  <AiStar size={14} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    请先在<strong>「设置 → AI 配置」</strong>中配置 API 地址和 Key 后使用。
                  </span>
                </div>
              )}
              <button
                onClick={isRunning ? handleStop : handleRun}
                className={`flex items-center justify-center gap-2 w-48 rounded-lg py-2.5 text-[13px] font-bold transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                    : 'bg-[var(--accent)] text-white shadow-sm hover:opacity-90'
                }`}
              >
                {isRunning ? (
                  <><X size={15} /> {UI_LABELS.aiTypeset.stopButton}</>
                ) : (
                  <><Send size={15} /> {UI_LABELS.aiTypeset.runButton}</>
                )}
              </button>
              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-600">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </>
  )
}
