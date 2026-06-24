import { leaf } from '@engine/utils/helpers'
import { resolveColor, darkenColor } from '@engine/utils/colorUtils'
import type { ThemeColors } from '@engine/composables/useTheme'
import { color, fontSize, fontWeight, letterSpacing, lineHeight, radius, spacing } from '@engine/tokens'

/**
 * CTA_DA01 - 行动号召卡片（默认A型01号样式）
 *
 * 编辑器语法：
 *   <cta label="GET STARTED" title="准备好开始你的创作了吗？" button="立即复制下方代码">
 *   </cta>
 *
 * 属性：
 *   label   - 标签文字（如 GET STARTED）
 *   title   - 标题
 *   button  - 按钮文字
 *   color   - 自定义颜色（默认使用主题色）
 *   light   - 浅色背景（设置为任意值启用浅色背景模式）
 */

export const CTA_DA01 = {
  id: 'CTA_DA01',
  name: '行动号召',
  tag: 'cta',
  attrs: [
    {
      key: 'label',
      label: '标签',
      required: false,
      default: '',
      description: '顶部引导标签，如 GET STARTED',
    },
    {
      key: 'title',
      label: '标题',
      required: false,
      default: '',
      description: '主标题文字，用于号召行动',
    },
    {
      key: 'button',
      label: '按钮文字',
      required: false,
      default: '',
      description: '按钮上显示的文字，如「立即复制下方代码」',
    },
    {
      key: 'color',
      label: '自定义颜色',
      required: false,
      default: '',
      description: '自定义颜色，填入 CSS 颜色值覆盖默认主题色，使用颜色单词或十六进制颜色值',
    },
    {
      key: 'light',
      label: '浅色背景',
      required: false,
      default: '',
      description: '设置为任意值启用浅色背景模式',
    },
  ],
  example: `<cta label="GET STARTED" title="准备好开始你的创作了吗？" button="立即复制下方代码" color="#6366f1" light="true"></cta>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const hex = resolveColor(attrs.color || t.accent)

    if (attrs.light) {
      const bg = `${hex}0f`

      let html = `<section style="margin:${spacing[10]} 0px;padding:${spacing[13]} ${spacing[9]};background:${bg};border-radius:${radius['4xl']};text-align:center">`

      if (attrs.label)
        html += `<p style="margin:0px 0px ${spacing[3]};font-size:${fontSize.xs};letter-spacing:${letterSpacing['5xl']};font-weight:${fontWeight.bold};color:${hex}">${leaf(attrs.label)}</p>`

      if (attrs.title)
        html += `<p style="margin:0px 0px ${spacing[7]};font-size:${fontSize['4xl']};font-weight:${fontWeight.extrabold};line-height:${lineHeight.normal};color:${color.textPrimary}">${leaf(attrs.title)}</p>`

      if (attrs.button)
        html += `<span style="display:inline-block;padding:${spacing[5]} ${spacing[9]};background:${hex};border-radius:${radius.lg};font-weight:${fontWeight.bold};letter-spacing:${letterSpacing.widest};color:${color.surface}">${leaf(attrs.button)}</span>`

      if (body.trim())
        html += `<section style="margin-top:${spacing[7]};font-size:${fontSize.md};color:${color.ink};line-height:${lineHeight.looser}">${leaf(body.trim())}</section>`

      html += `</section>`
      return html
    }

    const darkHex = darkenColor(hex)

    let html = `<section style="margin:${spacing[10]} 0px;padding:${spacing[13]} ${spacing[9]};background:linear-gradient(135deg,${hex},${darkHex});border-radius:${radius['4xl']};text-align:center;color:${color.surface}">`

    if (attrs.label)
      html += `<p style="margin:0px 0px ${spacing[3]};font-size:${fontSize.xs};letter-spacing:${letterSpacing['5xl']};font-weight:${fontWeight.bold};opacity:0.8">${leaf(attrs.label)}</p>`

    if (attrs.title)
      html += `<p style="margin:0px 0px ${spacing[7]};font-size:${fontSize['4xl']};font-weight:${fontWeight.extrabold};line-height:${lineHeight.normal}">${leaf(attrs.title)}</p>`

    if (attrs.button)
      html += `<span style="display:inline-block;padding:${spacing[5]} ${spacing[9]};background:rgba(255,255,255,0.2);border-radius:${radius.lg};font-weight:${fontWeight.bold};letter-spacing:${letterSpacing.widest};backdrop-filter:blur(4px)">${leaf(attrs.button)}</span>`

    if (body.trim())
      html += `<section style="margin-top:${spacing[7]};font-size:${fontSize.md};opacity:0.85;line-height:${lineHeight.looser}">${leaf(body.trim())}</section>`

    html += `</section>`
    return html
  },
}
