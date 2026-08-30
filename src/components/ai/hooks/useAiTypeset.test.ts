import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAiTypeset } from './useAiTypeset'

vi.mock('@/lib/store', () => {
  const contentState = {
    articleMarkdown: '',
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
      aiConfig: { apiUrl: '', apiKey: '', model: '' },
      colors: { accent: '#6c5ce7' },
      themeTokens: null,
    }),
    // 模拟真实 zustand store：既是 Hook，又带 getState()
    useContentStore: Object.assign(
      (selector: (state: any) => any) => selector(contentState),
      { getState: () => contentState },
    ),
  }
})

describe('useAiTypeset', () => {
  it('returns configReady false when aiConfig is empty', () => {
    const { result } = renderHook(() => useAiTypeset('article', () => {}))
    expect(result.current.configReady).toBe(false)
  })

  it('toggles preview mode', () => {
    const { result } = renderHook(() => useAiTypeset('article', () => {}))
    act(() => result.current.setPreviewMode('raw'))
    expect(result.current.previewMode).toBe('raw')
    act(() => result.current.setPreviewMode('rendered'))
    expect(result.current.previewMode).toBe('rendered')
  })
})
