import { describe, it, expect } from 'vitest'
import {
  THEME_PROFILES,
  THEME_CATEGORIES,
  getThemeProfile,
  getDefaultThemeProfile,
  getThemesByCategory,
  resolveThemeProfile,
} from './themes'
import { resolveTokens } from './tokens'

describe('THEME_PROFILES', () => {
  it('应有 48 套主题', () => {
    expect(THEME_PROFILES.length).toBe(48)
  })

  it('每个主题 ID 唯一', () => {
    const ids = new Set(THEME_PROFILES.map((p) => p.id))
    expect(ids.size).toBe(THEME_PROFILES.length)
  })

  it('每个主题都有必需字段', () => {
    for (const p of THEME_PROFILES) {
      expect(p.id, `theme ${p.id}`).toBeTruthy()
      expect(p.name, `theme ${p.id}`).toBeTruthy()
      expect(p.category, `theme ${p.id}`).toBeTruthy()
      expect(p.accent, `theme ${p.id}`).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(p.dark, `theme ${p.id}`).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('所有 category 都在 THEME_CATEGORIES 中', () => {
    const valid = new Set(THEME_CATEGORIES.map((c) => c.id))
    for (const p of THEME_PROFILES) {
      expect(valid.has(p.category), `theme ${p.id} category ${p.category}`).toBe(true)
    }
  })

  it('每个分类下的主题数接近（8±2）', () => {
    for (const cat of THEME_CATEGORIES) {
      const count = getThemesByCategory(cat.id).length
      expect(count, `category ${cat.id}`).toBeGreaterThanOrEqual(6)
      expect(count, `category ${cat.id}`).toBeLessThanOrEqual(12)
    }
  })
})

describe('getThemeProfile / getDefaultThemeProfile', () => {
  it('能按 id 取到主题', () => {
    expect(getThemeProfile('bytedance')?.name).toBe('字节跳动')
    expect(getThemeProfile('elegant-gold')?.name).toBe('优雅金')
  })

  it('未知 id 返回 undefined', () => {
    expect(getThemeProfile('nonexistent')).toBeUndefined()
  })

  it('getDefaultThemeProfile 返回 default', () => {
    expect(getDefaultThemeProfile().id).toBe('default')
  })
})

describe('resolveThemeProfile → resolveTokens', () => {
  it('产出合法的 ResolvedTokens', () => {
    const profile = getThemeProfile('default')!
    const overrides = resolveThemeProfile(profile)
    const tokens = resolveTokens(overrides)

    expect(tokens.headingSizes[1]).toMatch(/px$/)
    expect(tokens.headingSizes[6]).toMatch(/px$/)
    expect(parseInt(tokens.headingSizes[1])).toBeGreaterThan(parseInt(tokens.headingSizes[2]))
    expect(tokens.bodyFontSize).toMatch(/px$/)
    expect(tokens.bodyLineHeight).toBeTruthy()
    expect(tokens.radiusMap.lg).toMatch(/px$/)
    expect(tokens.spacingMultiplier).toBeGreaterThan(0)
    expect(tokens.quote.bg).toBeTruthy()
    expect(tokens.quote.borderRadius).toMatch(/px$/)
  })

  it('headingScale 会缩放标题字号', () => {
    const small = resolveTokens(resolveThemeProfile(getThemeProfile('linear')!))
    const large = resolveTokens(resolveThemeProfile(getThemeProfile('apple')!))
    expect(parseInt(small.headingSizes[1])).toBeLessThan(parseInt(large.headingSizes[1]))
  })

  it('无 overrides 时 resolveTokens 兜底为默认值', () => {
    const tokens = resolveTokens()
    expect(tokens.headingSizes[1]).toBeTruthy()
    expect(tokens.bodyFontSize).toMatch(/px$/)
    expect(tokens.headingWeight).toBeTruthy()
    expect(tokens.headingColor).toBe('textPrimary')
  })

  it('radiusLevel 改变圆角映射', () => {
    const sharp = resolveTokens(resolveThemeProfile(getThemeProfile('notion')!))
    const round = resolveTokens(resolveThemeProfile(getThemeProfile('apple')!))
    expect(parseInt(sharp.radiusMap['2xl'])).toBeLessThan(parseInt(round.radiusMap['2xl']))
  })

  it('headingColor 被透传', () => {
    const accentTitle = resolveTokens(resolveThemeProfile(getThemeProfile('bytedance')!))
    expect(accentTitle.headingColor).toBe('accent')
  })
})
