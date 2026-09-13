import { describe, it, expect } from 'vitest'
import {
  THEME_PROFILES,
  THEME_CATEGORIES,
  findProfileByColors,
  getThemeProfile,
  getDefaultThemeProfile,
  getThemesByCategory,
  resolveThemeProfile,
} from './themes'
import { resolveTokens } from './tokens'

describe('THEME_PROFILES', () => {
  it('应有 64 套主题', () => {
    expect(THEME_PROFILES.length).toBe(64)
  })

  it('每个主题 ID 唯一', () => {
    const ids = new Set(THEME_PROFILES.map((p) => p.id))
    expect(ids.size).toBe(THEME_PROFILES.length)
  })

  it('accent+dark 配色组合唯一（防止主题风格之间出现重复色）', () => {
    const combos = THEME_PROFILES.map((p) => `${p.accent.toLowerCase()}|${p.dark.toLowerCase()}`)
    expect(new Set(combos).size).toBe(combos.length)
  })

  it('每个主题都有必需字段', () => {
    for (const p of THEME_PROFILES) {
      expect(p.id, `theme ${p.id}`).toBeTruthy()
      expect(p.name, `theme ${p.id}`).toBeTruthy()
      expect(p.category, `theme ${p.id}`).toBeTruthy()
      expect(p.accent, `theme ${p.id}`).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(p.dark, `theme ${p.id}`).toMatch(/^#[0-9a-fA-F]{6}$/)
      // spacingScale 死轴已删除，不得回潮
      expect(p, `theme ${p.id}`).not.toHaveProperty('spacingScale')
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

  it('重命名与重分类口径：分类含 vivid/retro 不含 dark，名称与渲染色相符', () => {
    const ids = THEME_CATEGORIES.map((c) => c.id)
    expect(ids).toContain('vivid')
    expect(ids).toContain('retro')
    expect(ids).not.toContain('dark')
    expect(getThemeProfile('elegant-purple')?.name).toBe('酒红')
    expect(getThemeProfile('mint-green')?.name).toBe('翡翠绿')
    expect(getThemeProfile('olive-journal')?.name).toBe('墨黑手记')
    expect(getThemeProfile('indigo')?.name).toBe('长春花蓝')
    expect(getThemeProfile('midnight')?.name).toBe('宝石蓝')
    expect(getThemeProfile('midnight')?.category).toBe('vivid')
    expect(getThemeProfile('sepia')?.category).toBe('retro')
    expect(getThemeProfile('bright-yellow')?.category).toBe('vivid')
  })

  it('未知 id 返回 undefined', () => {
    expect(getThemeProfile('nonexistent')).toBeUndefined()
  })

  it('getDefaultThemeProfile 返回 default', () => {
    expect(getDefaultThemeProfile().id).toBe('default')
  })

  it('findProfileByColors 按配色反查主题', () => {
    expect(findProfileByColors('#27ae60', '#1e8449')?.id).toBe('default')
    expect(findProfileByColors('#6c5ce7', '#5a4bd1')?.id).toBe('violet')
    expect(findProfileByColors('#123456', '#654321')).toBeUndefined()
  })

  it('findProfileByColors 对大写 hex 也能反查（旧配色 Tab 持久化大写值，如优雅绿 #556B2F）', () => {
    expect(findProfileByColors('#556B2F', '#3D4F1F')?.id).toBe('elegant-green')
    expect(findProfileByColors('#27AE60', '#1E8449')?.id).toBe('default')
    expect(findProfileByColors('', '')).toBeUndefined()
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
    // spacingMultiplier 死轴已删除，ResolvedTokens 不再包含该字段
    expect(tokens).not.toHaveProperty('spacingMultiplier')
    expect(tokens.quote.bg).toBeTruthy()
    expect(tokens.quote.borderRadius).toMatch(/px$/)
  })

  it('border-bg 风格的引用块开启 accentText，其余风格关闭', () => {
    const borderBg = resolveTokens(resolveThemeProfile(getThemeProfile('elegant-gold')!))
    expect(borderBg.quote.accentText).toBe(true)
    const border = resolveTokens(resolveThemeProfile(getThemeProfile('default')!))
    expect(border.quote.accentText).toBe(false)
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
