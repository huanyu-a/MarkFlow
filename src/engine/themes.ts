/**
 * MarkFlow 主题画廊 — 64 套专业主题风格
 *
 * 设计哲学：主题 = 一组可覆盖基础 token 的增量值。
 * Renderer 在生成内联 style 时优先读 ctx.tokens（已 resolve 的主题值），
 * 未设置时回落 ctx.tokensRaw（基础静态令牌）。
 *
 * 注意：引擎不支持暗色渲染（公众号粘贴也要求白底），所有主题均为白底输出，
 * 「高亮」分组只是高饱和亮色 accent，并非暗色主题。
 *
 * 每个主题沿 6 个变化轴参数化：
 *   - headingScale / headingWeight / headingColor   标题风格
 *   - bodySize                                       正文字号
 *   - radiusLevel                                    圆角档位
 *   - quoteStyle                                     引用块风格
 */

// ─── 类型 ──────────────────────────────────────────────

export type HeadingColorMode = 'textPrimary' | 'accent'
export type RadiusLevel = 'sharp' | 'default' | 'round'
export type QuoteStyle = 'border' | 'bg' | 'border-bg'
export type BodySize = '14' | '15' | '16'
export type HeadingScale = 1 | 1.15 | 1.3
export type HeadingWeight = 600 | 700 | 800 | 900

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
  radiusLevel: RadiusLevel
  quoteStyle: QuoteStyle
}

export type ThemeCategoryId =
  | 'minimal'
  | 'business'
  | 'tech'
  | 'editorial'
  | 'retro'
  | 'warm'
  | 'vivid'

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
}

// ─── 分类元数据 ────────────────────────────────────────

export const THEME_CATEGORIES: ThemeCategory[] = [
  { id: 'minimal', name: '极简', description: '版式克制、装饰最少的通用风格，品牌色轻点缀' },
  { id: 'business', name: '商务', description: '成熟品牌调性，从财报蓝到消费品牌色，报告提案皆宜' },
  { id: 'tech', name: '科技', description: '互联网与数码产品气质的配色，代码感与现代感兼备' },
  { id: 'editorial', name: '文艺编辑', description: '内容平台原生观感与杂志感配色，阅读体验优先' },
  { id: 'retro', name: '复古人文', description: '低饱和复古色与人文气息，适合历史、文化、生活方式内容' },
  { id: 'warm', name: '温暖', description: '生活化的亲和配色，暖调为主，兼有柔和粉紫与清新绿' },
  { id: 'vivid', name: '高亮', description: '高饱和强对比的亮色，视觉冲击强。注：正文仍为白底输出，并非暗色渲染' },
]

// ─── 64 套主题 ────────────────────────────────────────

export const THEME_PROFILES: ThemeProfile[] = [
  // ── 极简 (9) ──
  { id: 'default', name: '默认', category: 'minimal', accent: '#27ae60', dark: '#1e8449', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'notion', name: 'Notion', category: 'minimal', accent: '#000000', dark: '#1a1a1a', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'stripe', name: 'Stripe', category: 'minimal', accent: '#635bff', dark: '#4f46e5', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', radiusLevel: 'default', quoteStyle: 'bg' },
  { id: 'linear', name: 'Linear', category: 'minimal', accent: '#5e6ad2', dark: '#4a55c7', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '14', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'apple', name: 'Apple', category: 'minimal', accent: '#1d1d1f', dark: '#000000', headingScale: 1.3, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'vercel', name: 'Vercel', category: 'minimal', accent: '#171717', dark: '#0a0a0a', headingScale: 1.15, headingWeight: 800, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'figma', name: 'Figma', category: 'minimal', accent: '#7c3aed', dark: '#5b21b6', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border-bg' },
  { id: 'github', name: 'GitHub', category: 'minimal', accent: '#0969da', dark: '#0550ae', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'neutral-grey', name: '中性灰', category: 'minimal', accent: '#888888', dark: '#666666', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },

  // ── 商务 (10) ──
  { id: 'bytedance', name: '字节跳动', category: 'business', accent: '#3350ff', dark: '#1e3afa', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'bytedance-pro', name: 'BytePro', category: 'business', accent: '#2563eb', dark: '#1d4ed8', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border-bg' },
  { id: 'nike', name: 'Nike', category: 'business', accent: '#f97316', dark: '#ea580c', headingScale: 1.3, headingWeight: 900, headingColor: 'textPrimary', bodySize: '16', radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'cocacola', name: 'Coca-Cola', category: 'business', accent: '#dc2626', dark: '#b91c1c', headingScale: 1.15, headingWeight: 800, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'round', quoteStyle: 'border' },
  { id: 'spotify', name: 'Spotify', category: 'business', accent: '#1db954', dark: '#169c46', headingScale: 1.3, headingWeight: 800, headingColor: 'accent', bodySize: '16', radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'airbnb', name: 'Airbnb', category: 'business', accent: '#ff5a5f', dark: '#e04854', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', radiusLevel: 'default', quoteStyle: 'bg' },
  { id: 'salesforce', name: 'Salesforce', category: 'business', accent: '#00a1e0', dark: '#0084bd', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'goldman', name: 'Goldman', category: 'business', accent: '#1e3a5f', dark: '#0f2744', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'indigo', name: '长春花蓝', category: 'business', accent: '#667eea', dark: '#536DFE', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'business-red', name: '商务红', category: 'business', accent: '#e74c3c', dark: '#c0392b', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },

  // ── 科技 (11) ──（含原「配色」Tab 独有色并入的 violet / tech-blue）
  { id: 'sspai', name: '少数派', category: 'tech', accent: '#d63333', dark: '#b82a2a', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'sspai-blue', name: 'SSPai Blue', category: 'tech', accent: '#2f6fed', dark: '#1d4fb8', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border-bg' },
  { id: 'openai', name: 'OpenAI', category: 'tech', accent: '#10a37f', dark: '#0d8c6d', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'dashboard', name: 'Dashboard', category: 'tech', accent: '#06b6d4', dark: '#0891b2', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '14', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'nvidia', name: 'NVIDIA', category: 'tech', accent: '#76b900', dark: '#659f00', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'react', name: 'React', category: 'tech', accent: '#61dafb', dark: '#4fb8d9', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'bg' },
  { id: 'tailwind', name: 'Tailwind', category: 'tech', accent: '#0ea5e9', dark: '#0284c7', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'teal', name: '正青', category: 'tech', accent: '#0d9488', dark: '#0f766e', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '14', radiusLevel: 'default', quoteStyle: 'border-bg' },
  // 摸鱼绿 #059669 (对应 theme-moyu-green)
  { id: 'moyu-green', name: '摸鱼绿', category: 'tech', accent: '#059669', dark: '#047857', headingScale: 1, headingWeight: 700, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'violet', name: '紫罗兰', category: 'tech', accent: '#6c5ce7', dark: '#5a4bd1', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'tech-blue', name: '科技蓝', category: 'tech', accent: '#0984e3', dark: '#0769b5', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },

  // ── 文艺编辑 (6) ──
  { id: 'clean-grey', name: '冷淡灰', category: 'editorial', accent: '#64748b', dark: '#475569', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'sharp', quoteStyle: 'border' },
  // 石墨极简 #52525B (对应 theme-graphite-minimal)
  { id: 'graphite-minimal', name: '石墨极简', category: 'editorial', accent: '#52525B', dark: '#3f3f46', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'wechat-native', name: '微信原生', category: 'editorial', accent: '#07c160', dark: '#06ad56', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', radiusLevel: 'default', quoteStyle: 'bg' },
  { id: 'markdown', name: 'Markdown', category: 'editorial', accent: '#555555', dark: '#333333', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'zhihu', name: '知乎蓝', category: 'editorial', accent: '#0066ff', dark: '#0052cc', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'juejin', name: '掘金蓝', category: 'editorial', accent: '#1e80ff', dark: '#006fe6', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },

  // ── 复古人文 (8) ──
  { id: 'elegant-gold', name: '优雅金', category: 'retro', accent: '#b8860b', dark: '#8b6508', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', radiusLevel: 'round', quoteStyle: 'border-bg' },
  { id: 'elegant-green', name: '优雅绿', category: 'retro', accent: '#556b2f', dark: '#3d4f1f', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', radiusLevel: 'round', quoteStyle: 'border-bg' },
  { id: 'elegant-purple', name: '酒红', category: 'retro', accent: '#722f37', dark: '#5a252c', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', radiusLevel: 'round', quoteStyle: 'border-bg' },
  // 橄榄手记 #1e1f23 (对应 theme-olive-journal，更名墨黑手记以匹配近黑渲染色)
  { id: 'olive-journal', name: '墨黑手记', category: 'retro', accent: '#1e1f23', dark: '#17181b', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', radiusLevel: 'default', quoteStyle: 'border' },
  // 留白禅意 #4A5D52 (对应 theme-zen-whitespace)
  { id: 'zen-whitespace', name: '留白禅意', category: 'retro', accent: '#4A5D52', dark: '#3b4a42', headingScale: 1, headingWeight: 600, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'matcha', name: '抹茶', category: 'retro', accent: '#80b918', dark: '#6a9b14', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'coffee', name: '咖啡棕', category: 'retro', accent: '#8b5c39', dark: '#6b4423', headingScale: 1, headingWeight: 600, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'sepia', name: '复古纸', category: 'retro', accent: '#a8763e', dark: '#865c2b', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', radiusLevel: 'round', quoteStyle: 'border-bg' },

  // ── 温暖 (11) ──
  { id: 'coral-pink', name: '珊瑚粉', category: 'warm', accent: '#ff6b6b', dark: '#e05555', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'warm-yellow', name: '暖橙', category: 'warm', accent: '#e67e22', dark: '#d35400', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'vercel-gradient', name: '琥珀橙', category: 'warm', accent: '#f59e0b', dark: '#d97706', headingScale: 1.3, headingWeight: 800, headingColor: 'textPrimary', bodySize: '16', radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'vivid-orange', name: '活力橙', category: 'warm', accent: '#f39c12', dark: '#e67e22', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'sunset', name: '落日橙', category: 'warm', accent: '#ff7849', dark: '#e56a3b', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '16', radiusLevel: 'round', quoteStyle: 'border-bg' },
  { id: 'peach', name: '蜜桃', category: 'warm', accent: '#fd79a8', dark: '#e84393', headingScale: 1.15, headingWeight: 700, headingColor: 'textPrimary', bodySize: '16', radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'rose-pink', name: '玫红', category: 'warm', accent: '#e84393', dark: '#d63384', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'soft-purple', name: '柔光紫', category: 'warm', accent: '#a29bfe', dark: '#6c5ce7', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'lavender', name: '薰衣草', category: 'warm', accent: '#b794f4', dark: '#9f7aea', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '16', radiusLevel: 'round', quoteStyle: 'bg' },
  { id: 'mint-green', name: '翡翠绿', category: 'warm', accent: '#00b894', dark: '#00a381', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'claude', name: 'Claude', category: 'warm', accent: '#cc785c', dark: '#a8604a', headingScale: 1, headingWeight: 700, headingColor: 'textPrimary', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border-bg' },

  // ── 高亮 (9)：高饱和亮色 accent，白底输出，并非暗色主题 ──
  { id: 'midnight', name: '宝石蓝', category: 'vivid', accent: '#3b82f6', dark: '#2563eb', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'dark-purple', name: '亮紫', category: 'vivid', accent: '#8b5cf6', dark: '#7c3aed', headingScale: 1.15, headingWeight: 700, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'neon-green', name: '荧光绿', category: 'vivid', accent: '#22c55e', dark: '#16a34a', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'cyber-pink', name: '荧光粉', category: 'vivid', accent: '#ec4899', dark: '#db2777', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'github-dark', name: 'GitHub 蓝', category: 'vivid', accent: '#58a6ff', dark: '#1f6feb', headingScale: 1, headingWeight: 600, headingColor: 'accent', bodySize: '15', radiusLevel: 'sharp', quoteStyle: 'border' },
  { id: 'discord', name: 'Discord', category: 'vivid', accent: '#5865f2', dark: '#4752c4', headingScale: 1, headingWeight: 700, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'bg' },
  { id: 'amber-dark', name: '琥珀亮', category: 'vivid', accent: '#fbbf24', dark: '#b45309', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'red-dark', name: '正红', category: 'vivid', accent: '#ef4444', dark: '#dc2626', headingScale: 1.15, headingWeight: 800, headingColor: 'accent', bodySize: '15', radiusLevel: 'default', quoteStyle: 'border' },
  { id: 'bright-yellow', name: '明黄', category: 'vivid', accent: '#eab308', dark: '#a16207', headingScale: 1.15, headingWeight: 800, headingColor: 'textPrimary', bodySize: '14', radiusLevel: 'default', quoteStyle: 'border-bg' },
  // ── gzh-design-skill 主题来源注释（原归属记录，分类已按色彩特征重新归位）──
  // 红白 #DC2626 - 与 cocacola (accent: #dc2626) 完全一致，去重不新增
  // 摸鱼票据 #059669 - 与摸鱼绿同色，去重不新增
  // 锤子风格 #B3593B - 跳过：源仓库中为第 7 套主题（theme-hammer），与现有 cocacola(#dc2626) 风格定位重叠且暖砖红配色可用 cocacola 替代
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

/** 按配色（accent+dark）反查主题，用于持久化状态恢复时消解 accent 与 profile 的冲突。
 * 历史持久化值可能为大写 hex（如旧配色 Tab 的 #556B2F），比较前统一小写。
 * 注意：3 组同 accent 色对为提升 swatch 区分度错开过色值（tailwind/琥珀亮/Vercel），
 * 旧持久化色对将反查失败回落 custom，属已知可接受代价。 */
export function findProfileByColors(accent: string, dark: string): ThemeProfile | undefined {
  if (!accent || !dark) return undefined
  const a = accent.toLowerCase()
  const d = dark.toLowerCase()
  return THEME_PROFILES.find((p) => p.accent.toLowerCase() === a && p.dark.toLowerCase() === d)
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
  }
}
