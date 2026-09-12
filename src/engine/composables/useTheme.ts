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

// 说明：lightenHex/darkenHex 已删除——渲染实际使用的是 utils/helpers.ts 中的同名实现，
// 这两个副本经 engine/index.ts 导出后无任何消费方。

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
