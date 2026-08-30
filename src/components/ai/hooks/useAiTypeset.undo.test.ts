import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAiTypeset } from './useAiTypeset'

// 可变内容 store：setArticleMarkdown 真实写入，模拟 zustand 行为
vi.mock('@/lib/store', () => {
  const contentState = {
    articleMarkdown: '# 原始内容',
    documentMarkdown: '',
    cardMarkdown: '',
    html: '',
    setArticleMarkdown: (v: string) => {
      contentState.articleMarkdown = v
    },
    setDocumentMarkdown: () => {},
    setCardMarkdown: () => {},
    setHtml: () => {},
  }
  return {
    useStore: (selector: (state: any) => any) => selector({
      aiConfig: { apiUrl: 'https://api.example.com', apiKey: 'sk-test', model: 'test' },
      colors: { accent: '#6c5ce7' },
      themeTokens: null,
    }),
    useContentStore: Object.assign(
      (selector: (state: any) => any) => selector(contentState),
      { getState: () => contentState },
    ),
  }
})

// AI 调用：直接吐出完整结果后结束
vi.mock('@/lib/aiService', () => ({
  callAiStream: vi.fn(
    (_config: unknown, _messages: unknown, onChunk: (c: string) => void) => {
      onChunk('# AI 排版结果')
      return Promise.resolve('# AI 排版结果')
    },
  ),
  isAiConfigReady: vi.fn(() => true),
}))

describe('useAiTypeset 撤销/重做（past/future 双栈回归）', () => {
  it('首次应用后即可撤销（旧实现 historyIndex>0 导致无法撤销）', async () => {
    const { result } = renderHook(() => useAiTypeset('article', () => {}))

    // 运行 AI 排版并等待流结束
    let run: Promise<void> = Promise.resolve()
    act(() => {
      run = result.current.handleRun()
    })
    await act(async () => {
      await run
    })
    expect(result.current.hasResult).toBe(true)

    // 应用：初始 canUndo=false，应用后第一件事就该能撤销
    expect(result.current.canUndo).toBe(false)
    act(() => {
      result.current.handleApply()
    })
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)

    // 撤销：恢复 AI 排版前的原始内容
    act(() => {
      result.current.handleUndo()
    })
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)

    // 重做：恢复 AI 结果
    act(() => {
      result.current.handleRedo()
    })
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('连续两次应用：撤销逐级回退、重做逐级前进', async () => {
    const { result } = renderHook(() => useAiTypeset('article', () => {}))

    // 第一次 AI 排版 + 应用
    let run1: Promise<void> = Promise.resolve()
    act(() => {
      run1 = result.current.handleRun()
    })
    await act(async () => {
      await run1
    })
    act(() => {
      result.current.handleApply()
    })

    // 第二次 AI 排版 + 应用（内容已变为第一次结果，AI 前缀追加产生不同内容）
    let run2: Promise<void> = Promise.resolve()
    act(() => {
      run2 = result.current.handleRun()
    })
    await act(async () => {
      await run2
    })
    act(() => {
      result.current.handleApply()
    })

    // 撤销第一次：回到第一次应用前的内容
    act(() => {
      result.current.handleUndo()
    })
    // 撤销第二次：回到原始内容
    act(() => {
      result.current.handleUndo()
    })
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)

    // 重做两次：逐级前进
    act(() => {
      result.current.handleRedo()
    })
    act(() => {
      result.current.handleRedo()
    })
    expect(result.current.canRedo).toBe(false)
    expect(result.current.canUndo).toBe(true)
  })
})
