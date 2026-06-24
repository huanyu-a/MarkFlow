/**
 * 渲染引擎设计令牌
 *
 * 说明：
 * - 本文件只导出 TypeScript 常量，供渲染引擎在生成内联 style 字符串时引用。
 * - 引擎输出需要复制到微信公众号、知乎、小红书等第三方平台，因此不能依赖
 *   Tailwind 类名或 CSS 变量，最终仍以内联 style 形式输出。
 * - 命名尽量与 src/index.css 中 @theme 定义的语义 token 保持一致，便于 UI 层
 *   与引擎层在未来统一。
 */

// ── 颜色 ───────────────────────────────────────────────

/** 项目中性色板（对应引擎中实际使用的灰阶） */
export const neutral = {
  white: '#ffffff',
  black: '#000000',

  // 灰阶（数值越大越深）
  gray50: '#fafafe', // rgb(250,251,254)
  gray100: '#f8fafc', // rgb(248,250,252)
  gray150: '#f7f8fc', // rgb(247,248,252)
  gray200: '#eeeeee', // rgb(238,238,238)
  gray250: '#e5e7eb', // rgb(229,231,235)
  gray300: '#e2e8f0', // rgb(226,232,240)
  gray350: '#dddddd', // rgb(221,221,221)
  gray400: '#cbd5e1', // rgb(203,213,225)
  gray500: '#94a3b8', // rgb(148,163,184)
  gray600: '#64748b', // rgb(100,116,139)
  gray700: '#475569', // rgb(71,85,105)
  gray750: '#374151', // rgb(55,65,81)
  gray800: '#334155', // rgb(51,65,85)
  gray850: '#1e293b', // rgb(30,41,59)
  gray900: '#1f2937', // rgb(31,41,55)
  gray950: '#111827', // rgb(17,24,39)
  gray1000: '#1a1a1a', // rgb(26,26,26)
} as const

/** 语义化颜色 token（与 index.css @theme 对齐） */
export const color = {
  surface: neutral.white,
  surfaceSubtle: neutral.gray100,
  surfaceMuted: '#f1f5f9',

  borderDefault: neutral.gray300,
  borderSubtle: '#f1f5f9',

  inkStrong: neutral.gray900,
  ink: neutral.gray700,
  inkMuted: neutral.gray600,
  inkFaint: neutral.gray500,

  // 常用深色文字
  textPrimary: neutral.gray950,
  textSecondary: neutral.gray850,
  textTertiary: neutral.gray800,
  textQuaternary: neutral.gray750,

  // 状态色
  errorBg: '#fef2f2',
  errorBorder: '#dc5050',
  errorText: '#781e1e',
  warning: '#f5a623',
  danger: '#e74c3c',
} as const

// ── 字号 ───────────────────────────────────────────────

export const fontSize = {
  '2xs': '10px',
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '15px',
  xl: '16px',
  '2xl': '17px',
  '3xl': '18px',
  '4xl': '20px',
  '5xl': '22px',
  '6xl': '24px',
  '7xl': '28px',
  '8xl': '30px',
  '9xl': '34px',
  '10xl': '40px',
  '11xl': '48px',
  '12xl': '60px',
} as const

// ── 间距 ───────────────────────────────────────────────

export const spacing = {
  0: '0px',
  1: '4px',
  2: '6px',
  3: '8px',
  4: '10px',
  5: '12px',
  6: '14px',
  7: '16px',
  8: '18px',
  9: '20px',
  10: '24px',
  11: '28px',
  12: '30px',
  13: '32px',
  14: '40px',
  15: '48px',
} as const

// ── 圆角 ───────────────────────────────────────────────

export const radius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '10px',
  '2xl': '12px',
  '3xl': '14px',
  '4xl': '16px',
  full: '999px',
} as const

// ── 阴影 ───────────────────────────────────────────────

export const shadow = {
  sm: `${neutral.gray950}0d 0px 10px 24px`, // rgba(15,23,42,0.05)
  md: `${neutral.gray950}0d 0px 10px 24px`, // 与 sm 同值，实际项目中多处使用同一阴影
  lg: `${neutral.gray950}29 0px 12px 24px`, // rgba(15,23,42,0.16)
  float: `${neutral.gray950}0a 0px 12px 30px`, // rgba(15,23,42,0.04)
} as const

/** 常用 box-shadow 原始字符串（保持与现有代码一致） */
export const shadowRaw = {
  card: 'rgba(15,23,42,0.05) 0px 10px 24px',
  cardHover: 'rgba(15,23,42,0.08) 0px 12px 30px',
  float: 'rgba(15,23,42,0.16) 0px 12px 24px',
} as const

// ── 行高 ───────────────────────────────────────────────

export const lineHeight = {
  tight: '1.2',
  snug: '1.35',
  normal: '1.4',
  relaxed: '1.5',
  loose: '1.6',
  looser: '1.7',
  loosest: '1.8',
  document: '1.85',
  heading: '1.9',
} as const

// ── 字重 ───────────────────────────────────────────────

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const

// ── 字间距 ─────────────────────────────────────────────

export const letterSpacing = {
  tighter: '-1px',
  tight: '-0.5px',
  normal: '0',
  wide: '0.3px',
  wider: '0.5px',
  widest: '1px',
  xl: '1.2px',
  '2xl': '2px',
  '3xl': '2.4px',
  '4xl': '2.8px',
  '5xl': '3px',
} as const

// ── 辅助函数 ───────────────────────────────────────────

/**
 * 将样式对象序列化为内联 style 字符串。
 * 键支持 camelCase，会自动转为 kebab-case。
 * 值为 undefined / null / 空字符串时被忽略。
 */
export function style(
  styles: Record<string, string | number | undefined | null>,
): string {
  return Object.entries(styles)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      const key = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
      return `${key}:${v}`
    })
    .join(';')
}

/**
 * 按主题色生成半透明背景（用于步骤、徽章等强调背景）。
 * 与 useTheme.ts 中 makeColors 的 light 字段逻辑保持一致。
 */
export function alphaAccent(accent: string, alphaHex: string): string {
  return `${accent}${alphaHex}`
}
