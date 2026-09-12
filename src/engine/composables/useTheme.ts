// 框架无关的主题模块（替换 r-markdown 中依赖 Vue 的 useTheme 组合式函数）。
// 渲染引擎仅需要 ThemeColors 类型与主题数据/纯工具函数，状态管理交给 React 侧。

export interface ThemeColors {
  accent: string
  dark: string
  light: string
  border: string
  rgb: string
}

// 说明：预设主题色已并入 src/engine/themes.ts 的 THEME_PROFILES（主题 = 配色 + 排版轴），
// 此处不再保留独立的 THEMES 色板，避免两套主题数据源各自演化。

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
