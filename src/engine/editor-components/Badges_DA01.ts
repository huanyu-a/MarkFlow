import { leaf } from '@engine/utils/helpers'
import type { ThemeColors } from '@engine/composables/useTheme'
import { fontSize, fontWeight, lineHeight, radius, spacing } from '@engine/tokens'

/**
 * Badges_DA01 - 彩色标签徽章（默认A型01号样式）
 *
 * 编辑器语法：
 *   <badges tone="accent">Vue|TypeScript|Vite|Tailwind</badges>
 *   <badges color="#fff" bg="#333">自定义颜色标签</badges>
 *
 * 属性：
 *   tone - 风格色调：accent（主题色）、green（绿色）、yellow（黄色）、dark（深色）
 *   color - 自定义文字颜色（优先于 tone）
 *   bg - 自定义背景颜色（优先于 tone）
 *
 * body 内容用 | 分隔每个标签文字。
 */

export const Badges_DA01 = {
  id: 'Badges_DA01',
  name: '彩色标签徽章',
  tag: 'badges',
  attrs: [
    {
      key: 'tone',
      label: '风格色调',
      required: false,
      default: 'accent',
      options: ['accent', 'green', 'yellow', 'dark'],
    },
    { key: 'color', label: '文字颜色', required: false, default: '' },
    { key: 'bg', label: '背景颜色', required: false, default: '' },
  ],
  example: `<badges tone="accent" color="#2e7d32" bg="#e8f5e9">Vue|TypeScript|Vite|Tailwind</badges>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const items = body
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)

    const tone = attrs.tone || 'accent'
    const tones: Record<string, { bg: string; color: string; border: string }> = {
      green: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
      yellow: { bg: '#fff9c4', color: '#f57f17', border: '#fff176' },
      dark: { bg: '#263238', color: '#eceff1', border: '#455a64' },
      accent: { bg: t.accent + '18', color: t.accent, border: t.accent + '50' },
    }
    const c = tones[tone] || tones.accent

    const finalColor = attrs.color || c.color
    const finalBg = attrs.bg || c.bg
    const finalBorder = attrs.bg ? attrs.bg + '50' : c.border

    let html = `<section style="display:flex;gap:${spacing[3]};flex-wrap:wrap;margin:${spacing[6]} 0px;align-items:center">`
    items.forEach((item) => {
      html += `<span style="display:inline-flex;align-items:center;gap:${spacing[1]};padding:${spacing[1]} ${spacing[5]};border-radius:${radius.full};font-size:${fontSize.base};font-weight:${fontWeight.semibold};background:${finalBg};color:${finalColor};border:1px solid ${finalBorder};line-height:${lineHeight.loosest};white-space:nowrap">${leaf(item)}</span>`
    })
    html += `</section>`
    return html
  },
}
