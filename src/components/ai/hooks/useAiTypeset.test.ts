import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAiTypeset } from './useAiTypeset'

vi.mock('@/lib/store', () => ({
  useStore: (selector: (state: any) => any) => selector({
    aiConfig: { apiUrl: '', apiKey: '', model: '' },
    colors: { accent: '#6c5ce7' },
    themeTokens: null,
  }),
  useContentStore: (selector: (state: any) => any) => selector({
    articleMarkdown: '',
    documentMarkdown: '',
    cardMarkdown: '',
    html: '',
    setArticleMarkdown: () => {},
    setDocumentMarkdown: () => {},
    setCardMarkdown: () => {},
    setHtml: () => {},
  }),
}))

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
