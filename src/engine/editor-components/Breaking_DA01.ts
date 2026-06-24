import { leaf } from '@engine/utils/helpers'
import type { ThemeColors } from '@engine/composables/useTheme'
import { color, fontSize, fontWeight, letterSpacing, lineHeight, neutral, radius, spacing } from '@engine/tokens'

/**
 * Breaking_DA01 - 突发/重大更新卡片（默认A型01号样式）
 *
 * 编辑器语法：
 *   <breaking badge="NEW" title="标题" subtitle="副标题" chips="标签1|标签2" color="#e74c3c">
 *   正文内容
 *   </breaking>
 *
 * 属性：
 *   badge    - 标签文字（如：NEW、HOT、更新）
 *   title    - 标题
 *   subtitle - 副标题
 *   chips    - 关键词标签，| 分隔
 *   color    - 自定义颜色（默认使用主题色）
 */

export const Breaking_DA01 = {
  id: 'Breaking_DA01',
  name: '突发卡片',
  tag: 'breaking',
  attrs: [
    { key: 'badge', label: '标签', required: false, default: '' },
    { key: 'title', label: '标题', required: false, default: '' },
    { key: 'subtitle', label: '副标题', required: false, default: '' },
    { key: 'chips', label: '关键词（|分隔）', required: false, default: '' },
    { key: 'color', label: '自定义颜色', required: false, default: '' },
  ],
  example: `<breaking badge="NEW" title="功能全集文档上线" subtitle="支持一键复制，即装即用" chips="高效|美观" color="#e74c3c">
这个组件适合用于文章开头，展示最重要的核心结论或更新摘要。
</breaking>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const accent = attrs.color || t.accent

    function withAlpha(c: string, alpha: number): string {
      if (/^#[0-9a-fA-F]{3,8}$/.test(c)) {
        const hex = c.length === 4 ? '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c.slice(0, 7)
        const aHex = Math.round(alpha * 255)
          .toString(16)
          .padStart(2, '0')
        return hex + aHex
      }
      if (typeof document !== 'undefined') {
        const el = document.createElement('div')
        el.style.color = c
        document.body.appendChild(el)
        const computed = getComputedStyle(el).color
        document.body.removeChild(el)
        const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (m) return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`
      }
      return c
    }

    const light = attrs.color ? withAlpha(accent, 0.15) : t.light
    const border = attrs.color ? withAlpha(accent, 0.2) : t.border

    let html = `<section style="margin:${spacing[10]} 0px;padding:${spacing[12]} ${spacing[9]};background:radial-gradient(circle 60px at 92% 30px,${light} 96%,transparent 100%),linear-gradient(135deg,${light},rgba(255,255,255,0.8));border:1px solid ${border};border-radius:${radius['4xl']}">`

    if (attrs.badge)
      html += `<span style="display:inline-block;padding:${spacing[1]} ${spacing[5]};background:${accent};color:${color.surface};border-radius:${radius.md};font-size:${fontSize.xs};font-weight:${fontWeight.bold};letter-spacing:${letterSpacing.widest};margin-bottom:${spacing[5]}">${leaf(attrs.badge)}</span>`
    if (attrs.title)
      html += `<p style="margin:0px 0px ${spacing[3]};font-size:${fontSize['5xl']};font-weight:${fontWeight.extrabold};color:${neutral.gray1000};line-height:${lineHeight.normal}">${leaf(attrs.title)}</p>`
    if (attrs.subtitle)
      html += `<p style="margin:0px 0px ${spacing[5]};font-size:${fontSize.md};color:${neutral.gray600}">${leaf(attrs.subtitle)}</p>`
    if (attrs.chips) {
      html += `<section style="display:flex;gap:${spacing[3]};flex-wrap:wrap;margin-bottom:${spacing[5]}">`
      attrs.chips.split('|').forEach((c) => {
        html += `<span style="display:inline-block;padding:${spacing[1]} ${spacing[5]};border-radius:${radius['2xl']};font-size:${fontSize.xs};font-weight:${fontWeight.semibold};background:rgba(255,255,255,0.8);color:${accent};border:1px solid ${border}">${leaf('#' + c.trim())}</span>`
      })
      html += `</section>`
    }
    if (body.trim())
      html += `<section style="font-size:${fontSize.md};color:${neutral.gray700};line-height:${lineHeight.loosest};margin-top:${spacing[3]}">${leaf(body.trim())}</section>`
    html += `</section>`
    return html
  },
}
