/**
 * Breaking_DA01 - 突发/重大更新卡片（默认A型01号样式）
 *
 * 统一语法（::: 容器）：
 *   :::breaking badge="NEW" title="标题" subtitle="副标题" chips="标签1|标签2"
 *   正文内容，支持 **markdown** 行内格式。
 *   :::
 *
 * 属性：
 *   badge    - 标签文字（如：NEW、HOT、更新）
 *   title    - 标题
 *   subtitle - 副标题
 *   chips    - 关键词标签，| 分隔
 *   color    - 自定义颜色（默认使用主题色）
 */
import { leaf } from '@engine/utils/helpers'
import { inlineFormat } from '@engine/utils/inlineFormat'
import { color, fontSize, fontWeight, letterSpacing, lineHeight, neutral, radius, spacing } from '@engine/tokens'
import type { ThemeColors } from '@engine/composables/useTheme'
import { buildUnifiedRenderer, parseBody, type UnifiedComponentDef, type ParsedBody } from './unifiedRender'

export const Breaking_DA01: UnifiedComponentDef = {
  spec: {
    name: 'breaking',
    label: '突发卡片',
    bodyFormat: 'markdown',
  example: `:::breaking badge="重磅发布" title="MarkFlow v2.0 功能全集上线" subtitle="52 套专业主题 + 61 个排版组件，支持公众号、A4 文档、小红书卡片、自由画布四种输出模式" chips="模块化排版|52套主题|多场景导出|免费使用"
这个组件适合放在文章开头，用一句话告诉读者：这篇文章能给你什么。
:::`,
    fields: [
      { name: 'badge', required: false, description: '标签' },
      { name: 'title', required: false, description: '标题' },
      { name: 'subtitle', required: false, description: '副标题' },
      { name: 'chips', required: false, description: '关键词（|分隔）' },
      { name: 'color', required: false, description: '自定义颜色' },
    ],
  },

  render(attrs: Record<string, string>, _rawBody: string, body: ParsedBody, t: ThemeColors) {
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
    if (body.markdown.trim())
      html += `<section style="font-size:${fontSize.md};color:${neutral.gray700};line-height:${lineHeight.loosest};margin-top:${spacing[3]}">${inlineFormat(body.markdown, t)}</section>`
    html += `</section>`
    return html
  },

  renderLegacy(attrs, body, t) {
    return this.render(attrs, body, parseBody(body, this.spec.bodyFormat), t)
  },
}

export const breakingRenderer = buildUnifiedRenderer(Breaking_DA01)
