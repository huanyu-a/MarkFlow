import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAiTypeset } from './useAiTypeset'

// 重入场景专用 mock：配置就绪 + 内容非空 + callAiStream 可控挂起
vi.mock('@/lib/store', () => {
  const contentState = {
    articleMarkdown: '# 已有内容',
    documentMarkdown: '',
    cardMarkdown: '',
    html: '',
    setArticleMarkdown: () => {},
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

vi.mock('@/lib/aiService', () => ({
  callAiStream: vi.fn(
    (_config: unknown, _messages: unknown, _onChunk: unknown, signal?: AbortSignal) =>
      new Promise<string>((resolve) => {
        if (signal) {
          signal.addEventListener('abort', () => resolve(''), { once: true })
        }
        ;(globalThis as any).__resolveStreams.push(resolve)
      }),
  ),
  isAiConfigReady: vi.fn(() => true),
}))

describe('useAiTypeset handleRun 重入保护', () => {
  it('重入时旧流被中止，isRunning 全程保持 true（P1-1 回归）', async () => {
    ;(globalThis as any).__resolveStreams = []
    const { result } = renderHook(() => useAiTypeset('article', () => {}))

    // 第一次运行（不等待完成，流挂起）
    let run1: Promise<void> = Promise.resolve()
    act(() => {
      run1 = result.current.handleRun()
    })
    await act(async () => {})
    expect(result.current.isRunning).toBe(true)
    expect((globalThis as any).__resolveStreams.length).toBe(1)

    // 重入：第二次运行应先 abort 旧流
    let run2: Promise<void> = Promise.resolve()
    act(() => {
      run2 = result.current.handleRun()
    })
    await act(async () => {})

    expect((globalThis as any).__resolveStreams.length).toBe(2)
    // 旧流的 finally 不得把新运行的 isRunning 置为 false（P1-1）
    expect(result.current.isRunning).toBe(true)

    // 结束第二次流
    await act(async () => {
      ;(globalThis as any).__resolveStreams[1]('done')
      await run2
    })
    expect(result.current.isRunning).toBe(false)
    await act(async () => {
      await run1
    })
  })
})
