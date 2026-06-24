/**
 * 颜色工具函数 - 公共模块
 *
 * 提供颜色名 → hex 映射、hex → rgba 浅色背景生成等通用能力。
 * 所有组件共享此模块，避免重复定义。
 */

/** 常见颜色名 → hex 映射表 */
export const NAMED_COLORS: Record<string, string> = {
  // 基础色
  red: '#e74c3c',
  orange: '#f39c12',
  yellow: '#f1c40f',
  green: '#27ae60',
  blue: '#3498db',
  purple: '#9b59b6',
  pink: '#e91e8a',
  cyan: '#00bcd4',
  teal: '#009688',
  indigo: '#3f51b5',
  gray: '#9e9e9e',
  grey: '#9e9e9e',
  black: '#222222',
  white: '#ffffff',
  // 扩展色
  crimson: '#dc143c',
  coral: '#ff6f61',
  tomato: '#ff6347',
  salmon: '#fa8072',
  gold: '#ffd700',
  lime: '#32cd32',
  navy: '#1a237e',
  maroon: '#800000',
  olive: '#808000',
  aqua: '#00ffff',
  fuchsia: '#ff00ff',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  plum: '#dda0dd',
  sienna: '#a0522d',
  chocolate: '#d2691e',
  wheat: '#f5deb3',
  tan: '#d2b48c',
  violet: '#ee82ee',
  peach: '#ffdab9',
  mint: '#98ff98',
  lavender: '#e6e6fa',
  beige: '#f5f5dc',
}

/**
 * 将任意颜色值（hex / 颜色名）解析为 standard hex
 * @param color - 颜色值，如 '#e74c3c'、'red'、'rgb(231,76,60)'
 * @returns 标准 hex 字符串，如 '#e74c3c'；无法解析时返回原值
 */
export function resolveColor(color: string): string {
  if (!color) return color
  // 已经是 hex
  if (color.startsWith('#')) return color
  // rgb/rgba → hex
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0')
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0')
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  // 颜色名 → hex
  return NAMED_COLORS[color.toLowerCase()] || color
}

/**
 * 从颜色值生成低不透明度的浅色背景
 * @param color - 任意颜色值
 * @param opacity - 不透明度，默认 0.12
 * @returns rgba 字符串
 */
export function colorToAlpha(color: string, opacity = 0.12): string {
  const hex = resolveColor(color)
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${opacity})`
  }
  return `rgba(0,0,0,${opacity})`
}

/**
 * 将颜色值加深指定比例
 * @param color - 任意颜色值
 * @param amount - 加深比例，默认 0.15
 * @returns 加深后的 hex 字符串
 */
export function darkenColor(color: string, amount = 0.15): string {
  const hex = resolveColor(color)
  if (hex.startsWith('#') && hex.length === 7) {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount))
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount))
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount))
    return `#${Math.min(r, 255).toString(16).padStart(2, '0')}${Math.min(g, 255).toString(16).padStart(2, '0')}${Math.min(b, 255).toString(16).padStart(2, '0')}`
  }
  return hex
}
