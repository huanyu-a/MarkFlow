import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore, useContentStore, type RenderMode } from '@/lib/store'
import { callAiStream, isAiConfigReady, type AiCallConfig } from '@/lib/aiService'
import { getAllSkills, buildSkillsPrompt, buildModeContextPrompt } from '@/lib/aiSkills'
import { getSetCurrentContent } from './useAiTypesetContent'

const MODE_NAMES: Record<RenderMode, string> = {
  article: '长图文',
  document: 'A4 文档',
  card: '小红书卡片',
  html: 'HTML',
}

/** 所有技能内置，用户无需手动选择 */
const ALL_SKILLS = getAllSkills()
const ALL_SKILLS_PROMPT = buildSkillsPrompt(ALL_SKILLS)

/** 撤销/重做 历史栈上限 */
export const MAX_HISTORY = 50

export function useAiTypeset(mode: RenderMode, onToast: (msg: string) => void, autoRun?: boolean) {
  const aiConfig = useStore((s) => s.aiConfig)
  const colors = useStore((s) => s.colors)
  const themeTokens = useStore((s) => s.themeTokens)

  // AI 调用状态
  const [isRunning, setIsRunning] = useState(false)
  const [streamingResult, setStreamingResult] = useState('')
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // 当前内容：必须用响应式订阅（而非 getState 快照），
  // 否则面板打开期间编辑器继续输入时，运行/应用拿到的是过期内容
  const currentContent = useContentStore((s) => {
    switch (mode) {
      case 'article': return s.articleMarkdown
      case 'document': return s.documentMarkdown
      case 'card': return s.cardMarkdown
      case 'html': return s.html
    }
  })
  const setCurrentContent = getSetCurrentContent(mode)

  // ---- 撤销/重做 历史栈（past/future 双栈模型）----
  // pastStack 存放每次「应用」前的历史内容，futureStack 存放被撤销的内容；
  // 当前内容始终以 contentStore 为准，避免索引与内容错位
  const [pastStack, setPastStack] = useState<string[]>([])
  const [futureStack, setFutureStack] = useState<string[]>([])

  // ---- 预览模式 ----
  const [previewMode, setPreviewMode] = useState<'rendered' | 'raw'>('rendered')

  // AI 排版前的原始内容（用于对比）
  const [beforeContent, setBeforeContent] = useState('')

  // 撤销：把当前内容存入 future，恢复最近一次应用前的内容
  const handleUndo = useCallback(() => {
    if (pastStack.length === 0) return
    const prevContent = pastStack[pastStack.length - 1]
    setPastStack((s) => s.slice(0, -1))
    setFutureStack((f) => [currentContent, ...f])
    setCurrentContent(prevContent)
    onToast('已撤销')
  }, [pastStack, currentContent, setCurrentContent, onToast])

  // 重做：恢复最近一次被撤销的内容，当前内容退回 past
  const handleRedo = useCallback(() => {
    if (futureStack.length === 0) return
    const nextContent = futureStack[0]
    setFutureStack((f) => f.slice(1))
    setPastStack((s) => [...s, currentContent])
    setCurrentContent(nextContent)
    onToast('已重做')
  }, [futureStack, currentContent, setCurrentContent, onToast])

  const handleRun = useCallback(async () => {
    const fullConfig: AiCallConfig = {
      apiUrl: aiConfig.apiUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
    }
    if (!isAiConfigReady(fullConfig)) {
      setError('请先在「设置 → AI 配置」中配置 API 地址（本地 API 可留空 Key）')
      return
    }
    if (!currentContent.trim()) {
      setError('编辑器内容为空，请先输入内容')
      return
    }

    // 记录 AI 排版前的内容，用于对比
    setBeforeContent(currentContent)

    // 重入保护：上一次流未结束时先取消，避免两个流交替写入 streamingResult
    abortRef.current?.abort()

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
      // 与 abortRef 清理同口径守卫：重入时旧运行的 finally 不得覆盖
      // 新运行的 isRunning 状态（否则按钮从「停止」退回「运行」）
      if (abortRef.current === controller) {
        setIsRunning(false)
        abortRef.current = null
      }
    }
  }, [aiConfig, currentContent, mode])

  // 面板卸载（关闭）时中止进行中的流，避免 API 配额在后台被空耗，
  // 也防止重开面板 autoRun 时出现双流并行
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

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

    // 记录应用前的内容到 past 栈，清空 future（产生新历史后旧的重做分支作废）
    setPastStack((s) => [...s.slice(-(MAX_HISTORY - 1)), currentContent])
    setFutureStack([])

    setCurrentContent(result)
    setStreamingResult('')
    onToast('已应用 AI 排版结果')
  }, [streamingResult, setCurrentContent, onToast, currentContent])

  const handleDiscard = useCallback(() => {
    setStreamingResult('')
    setError('')
  }, [])

  const hasResult = streamingResult.trim().length > 0
  const configReady = isAiConfigReady(aiConfig)
  const canUndo = pastStack.length > 0
  const canRedo = futureStack.length > 0

  return {
    isRunning,
    streamingResult,
    error,
    pastStack,
    futureStack,
    previewMode,
    setPreviewMode,
    beforeContent,
    setBeforeContent,
    colors,
    themeTokens,
    handleRun,
    handleStop,
    handleUndo,
    handleRedo,
    handleApply,
    handleDiscard,
    hasResult,
    configReady,
    canUndo,
    canRedo,
  }
}
