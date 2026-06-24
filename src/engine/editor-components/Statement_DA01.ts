import { leaf } from '@engine/utils/helpers'
import type { ThemeColors } from '@engine/composables/useTheme'

/**
 * Statement_DA01 - 居中强调语（默认A型01号样式）
 *
 * 编辑器语法：
 *   <statement>这是一段居中的强调文字。</statement>
 *
 * 属性：
 *   color - 文字颜色（可选，默认 rgb(51,65,85)）
 *
 * body 内容居中显示，字号较大加粗，适合金句或核心观点。
 */

export const Statement_DA01 = {
  id: 'Statement_DA01',
  name: '居中强调语',
  tag: 'statement',
  attrs: [{ key: 'color', label: '文字颜色', required: false, default: '' }],
  example: `<statement color="#7c3aed">这是一段居中的强调文字，适合用来突出核心观点或结论。</statement>`,

  render(attrs: Record<string, string>, body: string, _t: ThemeColors): string {
    const color = attrs.color || 'rgb(51,65,85)'
    return `<section style="margin:20px 0px"><p style="text-align:center;font-size:18px;font-weight:700;color:${color};line-height:1.6">${leaf(body)}</p></section>`
  },
}
