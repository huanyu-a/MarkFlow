import { describe, it, expect } from 'vitest'
import { generateFallbackHtml, isSafeColorValue, escapeHtml } from './StyleThumbnail'
import type { DesignStyle } from '@/data/designPrompts'

function makeStyle(overrides: Partial<DesignStyle> = {}): DesignStyle {
  return {
    id: 'test-style',
    name: '测试风格·Brand',
    category: '测试/子类',
    outputType: '长页',
    visualTone: '极简',
    family: 'heiti',
    displayLevel: 'primary',
    style: '测试指令',
    accent: '#6366f1',
    description: '一个测试用的风格描述',
    ...overrides,
  } as DesignStyle
}

describe('isSafeColorValue', () => {
  it('放行常见合法颜色', () => {
    expect(isSafeColorValue('#6366f1')).toBe(true)
    expect(isSafeColorValue('#fff')).toBe(true)
    expect(isSafeColorValue('#ff2442')).toBe(true)
    expect(isSafeColorValue('rgba(99, 102, 241, 0.5)')).toBe(true)
    expect(isSafeColorValue('rgb(99,102,241)')).toBe(true)
    expect(isSafeColorValue('red')).toBe(true)
    expect(isSafeColorValue('transparent')).toBe(true)
  })

  it('拒绝注入载荷与非颜色字符串', () => {
    expect(isSafeColorValue('"><img src=x onerror=alert(1)>')).toBe(false)
    expect(isSafeColorValue('red;}</div><script>alert(1)</script>')).toBe(false)
    expect(isSafeColorValue('')).toBe(false)
    expect(isSafeColorValue('#6366f1; background:url(javascript:alert(1))')).toBe(false)
    expect(isSafeColorValue('expression(alert(1))')).toBe(false)
  })
})

describe('generateFallbackHtml 转义与净化', () => {
  it('name / description / category 均转义，不产生可执行标记', () => {
    const html = generateFallbackHtml(
      makeStyle({
        name: '<img src=x onerror=alert(1)>',
        description: '"><svg onload=alert(2)>',
        category: '报告/财务',
      }),
    )
    // 实体转义后不再存在真实标签
    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('<svg')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('&lt;svg onload=alert(')
  })

  it('恶意 accent 被收敛为兜底色，不进入 HTML', () => {
    const payload = 'red;}<img src=x onerror=alert(1)>'
    const html = generateFallbackHtml(makeStyle({ accent: payload, outputType: '幻灯片' }))
    expect(html).not.toContain('onerror')
    expect(html).not.toContain(payload)
    expect(html).toContain('#6366f1')

    const html2 = generateFallbackHtml(makeStyle({ accent: payload, outputType: '报告' }))
    expect(html2).not.toContain('onerror')
    expect(html2).toContain('#6366f1')
  })

  it('合法 accent 原样保留（视觉不受影响）', () => {
    const html = generateFallbackHtml(makeStyle({ accent: '#ff2442' }))
    expect(html).toContain('#ff2442')
  })

  it('escapeHtml 处理五个核心字符', () => {
    expect(escapeHtml('<>"&')).toBe('&lt;&gt;&quot;&amp;')
  })
})
