// 框架无关的主题模块（替换 r-markdown 中依赖 Vue 的 useTheme 组合式函数）。
// 渲染引擎仅需要 ThemeColors 类型与主题数据/纯工具函数，状态管理交给 React 侧。

export interface ThemeColors {
  accent: string
  dark: string
  light: string
  border: string
  rgb: string
}

/** 预设主题色（accent 主色 / dark 深色） */
export const THEMES = [
  { accent: '#6c5ce7', dark: '#5a4bd1' },
  { accent: '#667eea', dark: '#536DFE' },
  { accent: '#e74c3c', dark: '#c0392b' },
  { accent: '#27ae60', dark: '#1e8449' },
  { accent: '#f39c12', dark: '#e67e22' },
  { accent: '#e84393', dark: '#d63384' },
  { accent: '#00b894', dark: '#00a381' },
  { accent: '#0984e3', dark: '#0769b5' },
  { accent: '#fd79a8', dark: '#e84393' },
  { accent: '#a29bfe', dark: '#6c5ce7' },
  { accent: '#888888', dark: '#666666' },
  { accent: '#000000', dark: '#1a1a1a' },
  { accent: '#1e3a5f', dark: '#0f2744' },
  { accent: '#722f37', dark: '#5a252c' },
  { accent: '#556B2F', dark: '#3d4f1f' },
]

export function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function lightenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lr = Math.round(r + (255 - r) * factor)
  const lg = Math.round(g + (255 - g) * factor)
  const lb = Math.round(b + (255 - b) * factor)
  return '#' + ((1 << 24) + (lr << 16) + (lg << 8) + lb).toString(16).slice(1)
}

export function darkenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const dr = Math.round(r * (1 - factor))
  const dg = Math.round(g * (1 - factor))
  const db = Math.round(b * (1 - factor))
  return '#' + ((1 << 24) + (dr << 16) + (dg << 8) + db).toString(16).slice(1)
}

/** 根据主色与深色生成完整的 ThemeColors（供渲染引擎使用） */
export function makeColors(accent: string, dark: string): ThemeColors {
  return {
    accent,
    dark,
    light: accent + '26',
    border: accent + '33',
    rgb: hexToRgb(accent),
  }
}
