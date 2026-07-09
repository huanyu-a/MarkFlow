/**
 * MarkFlow 主题画廊 — 48 套专业主题风格
 *
 * 设计哲学：主题 = 一组可覆盖基础 token 的增量值。
 * Renderer 在生成内联 style 时优先读 ctx.tokens（已 resolve 的主题值），
 * 未设置时回落 ctx.tokensRaw（基础静态令牌）。
 *
 * 每个主题沿 7 个变化轴参数化：
 *   - headingScale / headingWeight / headingColor   标题风格
 *   - bodySize / spacingScale                        正文与间距
 *   - radiusLevel                                    圆角档位
 *   - quoteStyle                                     引用块风格
 */

import { hexToRgb } from './composables/useTheme'

// ─── 类型 ──────────────────────────────────────────────

export type HeadingColorMode = 'textPrimary' | 'accent' | 'dark'
export type RadiusLevel = 'sharp' | 'default' | 'round'
export type QuoteStyle = 'border' | 'bg' | 'border-bg'
export type BodySize = '14' | '15' | '16'
export type SpacingScale = 0.8 | 1 | 1.2
export type HeadingScale = 0.85 | 1 | 1.15 | 1.3
export type HeadingWeight = 400 | 600 | 700 | 800 | 900

export interface ThemeProfile {
  id: string
  name: string
  category: ThemeCategoryId
  accent: string
  dark: string
  headingScale: HeadingScale
  headingWeight: HeadingWeight
  headingColor: HeadingColorMode
  bodySize: BodySize
  spacingScale: SpacingScale
  radiusLevel: RadiusLevel
  quoteStyle: QuoteStyle
}

export type ThemeCategoryId =
  | 'minimal'
  | 'business'
  | 'tech'
  | 'editorial'
  | 'warm'
  | 'dark'

export interface ThemeCategory {
  id: ThemeCategoryId
  name: string
  description: string
}

// resolveThemeProfile 产出的、可被 resolveTokens 消费的增量覆盖
export interface ThemeTokenOverrides {
  headingSizes: Record<1 | 2 | 3 | 4 | 5 | 6, string>
  headingWeight: string
  headingColor: HeadingColorMode
  bodyFontSize: string
  bodyLineHeight: string
  blockborderRadius: string
  blockBg: string
  blockBorder: string
  blockAccentText: boolean
  radiusMap: Record<string, string>
  spacingMultiplier: number
}

// ─── 分类元数据 ────────────────────────────────────────

export const THEME_CATEGORIES: ThemeCategory[] = [
  { id: 'minimal', name: '极简', description: '克制的留白与灰阶，适合长文阅读' },
  { id: 'business', name: '商务', description: '稳重的蓝灰调，报告与提案首选' },
  { id: 'tech', name: '科技', description: '高对比冷色调，代码感与现代感兼备' },
  { id: 'editorial', name: '文艺编辑', description: '杂志级排版，衬线与暖色调' },
  { id: 'warm', name: '温暖', description: '亲和力强的暖色调，生活与人文内容' },
  { id: 'dark', name: '暗色', description: '深色基底，视觉冲击与沉浸感' },
]

// ─── 48 套主题 ────────────────────────────────────────

export const THEME_PROFILES: ThemeProfile[] = [
  // ── 极简 (8) ──
  { id: 'default', name: '默认', category: 'minimal', accent: '#27ae60', dark: '#1e8449', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'notion', name: 'Notion', category: 'minimal', accent: '#000000', dark: '#1a1a1a', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'stripe', name: 'Stripe', category: 'minimal', accent: '#635bff', dark: '#4f46e5', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'bg' },
  { id: 'linear', name: 'Linear', category: 'minimal', accent: '#5e6ad2', dark: '#4a55c7', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '14', spacingScale: 0.8, radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'apple', name: 'Apple', category: 'minimal', accent: '#1d1d1f', dark: '#000000', headingScale: 1.3, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', spacingScale: 1.2, radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'vercel', name: 'Vercel', category: 'minimal', accent: '#000000', dark: '#111111', headingScale: 1.15, headingWeight: 800, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'figma', name: 'Figma', category: 'minimal', accent: '#7c3aed', dark: '#5b21b6', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border-bg' },
  { id: 'github', name: 'GitHub', category: 'minimal', accent: '#0969da', dark: '#0550ae', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'sharp', quoteStyle: 'border' },

  // ── 商务 (8) ──
  { id: 'bytedance', name: '字节跳动', category: 'business', accent: '#3350ff', dark: '#1e3afa', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'bytedance-pro', name: 'BytePro', category: 'business', accent: '#2563eb', dark: '#1d4ed8', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border-bg' },
  { id: 'nike', name: 'Nike', category: 'business', accent: '#f97316', dark: '#ea580c', headingScale: 1.3, headingWeight: 900, headingColor: 'textPrimary', bodySize: '16', spacingScale: 1.2, radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'cocacola', name: 'Coca-Cola', category: 'business', accent: '#dc2626', dark: '#b91c1c', headingScale: 1.15, headingWeight: 800, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'round', quoteStyle: 'border' },
  { id: 'spotify', name: 'Spotify', category: 'business', accent: '#1db954', dark: '#169c46', headingScale: 1.3, headingWeight: 800, headingColor: 'accent', bodySize: '16', spacingScale: 1.2, radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'airbnb', name: 'Airbnb', category: 'business', accent: '#ff5a5f', dark: '#e04854', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'bg' },
  { id: 'salesforce', name: 'Salesforce', category: 'business', accent: '#00a1e0', dark: '#0084bd', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'goldman', name: 'Goldman', category: 'business', accent: '#1e3a5f', dark: '#0f2744', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'sharp', quoteStyle: 'border' },

  // ── 科技 (8) ──
  { id: 'sspai', name: '少数派', category: 'tech', accent: '#d63333', dark: '#b82a2a', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'sspai-blue', name: 'SSPai Blue', category: 'tech', accent: '#2f6fed', dark: '#1d4fb8', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border-bg' },
  { id: 'claude', name: 'Claude', category: 'tech', accent: '#cc785c', dark: '#a8604a', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border-bg' },
  { id: 'openai', name: 'OpenAI', category: 'tech', accent: '#10a37f', dark: '#0d8c6d', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'dashboard', name: 'Dashboard', category: 'tech', accent: '#06b6d4', dark: '#0891b2', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '14', spacingScale: 0.8, radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'nvidia', name: 'NVIDIA', category: 'tech', accent: '#76b900', dark: '#659f00', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'react', name: 'React', category: 'tech', accent: '#61dafb', dark: '#4fb8d9', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'bg' },
  { id: 'tailwind', name: 'Tailwind', category: 'tech', accent: '#06b6d4', dark: '#0891b2', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'sharp', quoteStyle: 'border' },

  // ── 文艺编辑 (8) ──
  { id: 'elegant-gold', name: '优雅金', category: 'editorial', accent: '#b8860b', dark: '#8b6508', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', spacingScale: 1.2, radiusLevel: 'round', quoteStyle: 'border-bg' },
  { id: 'elegant-green', name: '优雅绿', category: 'editorial', accent: '#556b2f', dark: '#3d4f1f', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', spacingScale: 1.2, radiusLevel: 'round', quoteStyle: 'border-bg' },
  { id: 'elegant-purple', name: '优雅紫', category: 'editorial', accent: '#722f37', dark: '#5a252c', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', spacingScale: 1.2, radiusLevel: 'round', quoteStyle: 'border-bg' },
  { id: 'clean-grey', name: '冷淡灰', category: 'editorial', accent: '#64748b', dark: '#475569', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'wechat-native', name: '微信原生', category: 'editorial', accent: '#07c160', dark: '#06ad56', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'bg' },
  { id: 'markdown', name: 'Markdown', category: 'editorial', accent: '#555555', dark: '#333333', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'zhihu', name: '知乎蓝', category: 'editorial', accent: '#0066ff', dark: '#0052cc', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'juejin', name: '掘金蓝', category: 'editorial', accent: '#1e80ff', dark: '#006fe6', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },

  // ── 温暖 (8) ──
  { id: 'coral-pink', name: '珊瑚粉', category: 'warm', accent: '#ff6b6b', dark: '#e05555', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', spacingScale: 1, radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'warm-yellow', name: '暖阳黄', category: 'warm', accent: '#e67e22', dark: '#d35400', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', spacingScale: 1, radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'soft-purple', name: '柔光紫', category: 'warm', accent: '#a29bfe', dark: '#6c5ce7', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', spacingScale: 1.2, radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'vercel-gradient', name: '渐变橙', category: 'warm', accent: '#f59e0b', dark: '#d97706', headingScale: 1.3, headingWeight: 800, headingColor: 'textPrimary', bodySize: '16', spacingScale: 1.2, radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'lavender', name: '薰衣草', category: 'warm', accent: '#b794f4', dark: '#9f7aea', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', spacingScale: 1.2, radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'matcha', name: '抹茶', category: 'warm', accent: '#80b918', dark: '#6a9b14', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', spacingScale: 1, radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'peach', name: '蜜桃', category: 'warm', accent: '#fd79a8', dark: '#e84393', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', spacingScale: 1, radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'sunset', name: '落日橙', category: 'warm', accent: '#ff7849', dark: '#e56a3b', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '16', spacingScale: 1, radiusLevel: 'round', quoteStyle: 'border-bg' },

  // ── 暗色 (8) ──
  { id: 'midnight', name: '午夜蓝', category: 'dark', accent: '#3b82f6', dark: '#2563eb', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'dark-purple', name: '暗夜紫', category: 'dark', accent: '#8b5cf6', dark: '#7c3aed', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'neon-green', name: '霓虹绿', category: 'dark', accent: '#22c55e', dark: '#16a34a', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'cyber-pink', name: '赛博粉', category: 'dark', accent: '#ec4899', dark: '#db2777', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'github-dark', name: 'GitHub Dark', category: 'dark', accent: '#58a6ff', dark: '#1f6feb', headingScale: 1, headingWeight: 600, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'discord', name: 'Discord', category: 'dark', accent: '#5865f2', dark: '#4752c4', headingScale: 1, headingWeight: 700, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'bg' },
  { id: 'amber-dark', name: '琥珀暗', category: 'dark', accent: '#f59e0b', dark: '#d97706', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'red-dark', name: '暗夜红', category: 'dark', accent: '#ef4444', dark: '#dc2626', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', spacingScale: 1, radiusLevel: 'default', quoteStyle: 'border' },
]

// ─── 索引与工具 ────────────────────────────────────────

const THEME_MAP = new Map<string, ThemeProfile>(THEME_PROFILES.map((p) => [p.id, p]))

export function getThemeProfile(id: string): ThemeProfile | undefined {
  return THEME_MAP.get(id)
}

export function getDefaultThemeProfile(): ThemeProfile {
  return THEME_MAP.get('default')!
}

export function getThemesByCategory(category: ThemeCategoryId): ThemeProfile[] {
  return THEME_PROFILES.filter((p) => p.category === category)
}

// ─── resolveThemeProfile ───────────────────────────────
//
// 把「变化轴」映射为一组可覆盖基础 token 的增量值。
// Renderer 不直接消费 ThemeProfile，只消费 ThemeTokenOverrides + 基础令牌。

// 基础 heading 字号（与 tokens.ts fontSize 对齐）
const BASE_HEADING_SIZES: Record<1 | 2 | 3 | 4 | 5 | 6, number> = {
  1: 24, // 6xl
  2: 20, // 4xl
  3: 17, // 2xl
  4: 15, // lg
  5: 13, // base
  6: 12, // sm
}

const RADIUS_PRESETS: Record<RadiusLevel, Record<string, string>> = {
  sharp: { sm: '2px', md: '3px', lg: '4px', xl: '5px', '2xl': '6px', '3xl': '8px', '4xl': '8px' },
  default: { sm: '4px', md: '6px', lg: '8px', xl: '10px', '2xl': '12px', '3xl': '14px', '4xl': '16px' },
  round: { sm: '6px', md: '10px', lg: '14px', xl: '18px', '2xl': '22px', '3xl': '26px', '4xl': '32px' },
}

export function resolveThemeProfile(profile: ThemeProfile): ThemeTokenOverrides {
  const headingSizes = {} as Record<1 | 2 | 3 | 4 | 5 | 6, string>
  for (const lvl of [1, 2, 3, 4, 5, 6] as const) {
    headingSizes[lvl] = `${Math.round(BASE_HEADING_SIZES[lvl] * profile.headingScale)}px`
  }

  // 引用块风格
  const radiusPreset = RADIUS_PRESETS[profile.radiusLevel]
  let blockborderRadius = radiusPreset.lg
  let blockBg = 'transparent'
  let blockBorder = 'currentColor'
  let blockAccentText = false

  switch (profile.quoteStyle) {
    case 'border':
      blockBorder = 'currentColor'
      blockBg = 'transparent'
      blockborderRadius = radiusPreset.lg
      break
    case 'bg':
      blockBg = 'currentColor'
      blockBorder = 'transparent'
      blockborderRadius = radiusPreset.lg
      break
    case 'border-bg':
      blockBg = 'currentColor'
      blockBorder = 'currentColor'
      blockborderRadius = radiusPreset.lg
      blockAccentText = true
      break
  }

  return {
    headingSizes,
    headingWeight: `${profile.headingWeight}`,
    headingColor: profile.headingColor,
    bodyFontSize: `${profile.bodySize}px`,
    bodyLineHeight: profile.bodySize === '16' ? '1.85' : '1.8',
    blockborderRadius,
    blockBg,
    blockBorder,
    blockAccentText,
    radiusMap: radiusPreset,
    spacingMultiplier: profile.spacingScale,
  }
}

// ─── 主题色工具（供 UI 层生成预览等） ──────────────────

export function themeAccentRgb(accent: string): string {
  return hexToRgb(accent)
}
