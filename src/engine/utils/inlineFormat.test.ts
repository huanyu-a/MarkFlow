import { describe, it, expect, vi } from 'vitest'
import { inlineFormat } from './inlineFormat'
import type { ThemeColors } from '../composables/useTheme'

// Mock getCachedImageUrl to avoid importing real imageStorage module
vi.mock('@/lib/editor/imageStorage', () => ({
  getCachedImageUrl: vi.fn(() => null),
}))

const t: ThemeColors = {
  accent: '#4F46E5',
  dark: '#3730A3',
  light: '#EEF2FF',
  border: '#E2E8F0',
  rgb: '79,70,229',
}

describe('inlineFormat - individual markers', () => {
  it('renders ==text== as gradient background highlight', () => {
    const result = inlineFormat('==重点==', t)
    expect(result).toContain('background:linear-gradient(120deg')
    expect(result).toContain('color:#4F46E5')
    expect(result).toContain('font-weight:700')
    expect(result).toContain('<span leaf="">重点</span>')
  })

  it('renders !!text!! as capsule tag', () => {
    const result = inlineFormat('!!标签!!', t)
    expect(result).toContain('border-radius:20px')
    expect(result).toContain('background:#EEF2FF')
    expect(result).toContain('color:#4F46E5')
    expect(result).toContain('border:1px solid #E2E8F0')
    expect(result).toContain('<span leaf="">标签</span>')
  })

  it('renders ^^text^^ as bold emphasis', () => {
    const result = inlineFormat('^^加重^^', t)
    expect(result).toContain('<strong')
    expect(result).toContain('color:#4F46E5')
    expect(result).toContain('<span leaf="">加重</span>')
  })

  it('renders ::text:: as soft light highlight', () => {
    const result = inlineFormat('::柔光::', t)
    expect(result).toContain('font-weight:700')
    expect(result).toContain('<span leaf="">柔光</span>')
    // lightenHex produces a lighter color, not the original accent
    expect(result).not.toContain('color:#4F46E5')
  })

  it('renders __text__ as themed underline', () => {
    const result = inlineFormat('__下划线__', t)
    expect(result).toContain('text-decoration:underline')
    expect(result).toContain('text-decoration-color:#4F46E5')
    expect(result).toContain('<span leaf="">下划线</span>')
  })
})

describe('inlineFormat - multiple markers combined', () => {
  it('renders multiple different markers in one string', () => {
    const result = inlineFormat('==高亮!!标签^^加重==', t)
    // == renders first, so the content inside should be processed
    expect(result).toContain('background:linear-gradient')
    expect(result).toContain('!!标签')
    expect(result).toContain('^^加重')
  })

  it('renders multiple instances of the same marker', () => {
    const result = inlineFormat('==第一个== 和 ==第二个==', t)
    expect(result).toContain('<span leaf="">第一个</span>')
    expect(result).toContain('<span leaf="">第二个</span>')
    // Two gradient backgrounds
    const gradientCount = (result.match(/linear-gradient/g) || []).length
    expect(gradientCount).toBe(2)
  })
})

describe('inlineFormat - nested markers', () => {
  it('handles ==**bold**== with inner bold marker', () => {
    const result = inlineFormat('==**粗体**==', t)
    expect(result).toContain('background:linear-gradient')
    expect(result).toContain('<strong')
    expect(result).toContain('粗体')
  })

  it('handles !!__underline__!! with inner underline', () => {
    const result = inlineFormat('!!__下划__!!', t)
    expect(result).toContain('border-radius:20px')
    expect(result).toContain('text-decoration:underline')
  })
})

describe('inlineFormat - empty content', () => {
  it('returns empty string for empty input', () => {
    const result = inlineFormat('', t)
    expect(result).toBe('')
  })

  it('does not create marker spans for empty content', () => {
    const result = inlineFormat('====', t)
    // ==== doesn't match ==([^=]+)== (needs at least one char), so no marker
    expect(result).not.toContain('linear-gradient')
  })

  it('does not create capsule for empty !! content', () => {
    const result = inlineFormat('!!!!', t)
    expect(result).not.toContain('border-radius:20px')
  })
})

describe('inlineFormat - plain text without markers', () => {
  it('returns plain text as-is without adding leaf spans', () => {
    const result = inlineFormat('Hello World', t)
    expect(result).toBe('Hello World')
  })

  it('does not add any special styling for plain text', () => {
    const result = inlineFormat('简单文本', t)
    expect(result).not.toContain('linear-gradient')
    expect(result).not.toContain('border-radius:20px')
    expect(result).not.toContain('text-decoration:underline')
  })
})

describe('inlineFormat - other markers', () => {
  it('renders ~~strikethrough~~', () => {
    const result = inlineFormat('~~删除~~', t)
    expect(result).toContain('<del')
    expect(result).toContain('<span leaf="">删除</span>')
  })

  it('renders ^superscript^', () => {
    const result = inlineFormat('^上标^', t)
    expect(result).toContain('<sup>')
    expect(result).toContain('<span leaf="">上标</span>')
  })

  it('renders ~subscript~', () => {
    const result = inlineFormat('~下标~', t)
    expect(result).toContain('<sub>')
    expect(result).toContain('<span leaf="">下标</span>')
  })

  it('renders **bold**', () => {
    const result = inlineFormat('**粗体**', t)
    expect(result).toContain('<strong')
    expect(result).toContain('粗体')
  })

  it('renders *italic*', () => {
    const result = inlineFormat('*斜体*', t)
    expect(result).toContain('<em>')
    expect(result).toContain('斜体')
  })
})

describe('inlineFormat - newlines', () => {
  it('converts newlines to <br>', () => {
    const result = inlineFormat('第一行\n第二行', t)
    expect(result).toContain('<br>')
  })
})
