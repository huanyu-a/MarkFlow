/**
 * Compare_DA01 - 左右对比（默认A型01号样式）
 *
 * 编辑器语法：
 *   <compare left-label="BEFORE" left-title="旧版" right-label="AFTER" right-title="新版">
 *   <left>
 *   左侧内容（支持图片、文字等）
 *   </left>
 *   <right>
 *   右侧内容（支持图片、文字等）
 *   </right>
 *   </compare>
 *
 * 属性：
 *   left-label  - 左侧标签（如 BEFORE）
 *   left-title  - 左侧标题
 *   right-label - 右侧标签（如 AFTER）
 *   right-title - 右侧标题
 *   color       - 自定义颜色（默认使用主题色）
 *   direction   - 布局方向：horizontal（默认）/ vertical（竖向）
 */
import { leaf, esc } from '@engine/utils/helpers'
import { resolveColor } from '@engine/utils/colorUtils'
import type { ThemeColors } from '@engine/composables/useTheme'
import { color, fontSize, fontWeight, letterSpacing, lineHeight, neutral, radius, spacing } from '@engine/tokens'
import { inlineFormat } from '@engine/utils/inlineFormat'

export const Compare_DA01 = {
  id: 'Compare_DA01',
  name: '对比',
  tag: 'compare',
  attrs: [
    { key: 'left-label', label: '左侧标签', required: false, default: '' },
    { key: 'left-title', label: '左侧标题', required: false, default: '' },
    { key: 'right-label', label: '右侧标签', required: false, default: '' },
    { key: 'right-title', label: '右侧标题', required: false, default: '' },
    { key: 'color', label: '自定义颜色', required: false, default: '' },
    {
      key: 'direction',
      label: '布局方向',
      required: false,
      default: 'horizontal',
      options: ['horizontal', 'vertical'],
    },
  ],
  example: `<compare left-label="BEFORE" left-title="旧版绿色" right-label="AFTER" right-title="新版靛青" color="#7c3aed" direction="horizontal">
<left>
旧版界面设计较为传统
![旧版](https://picsum.photos/400/120?random=3)[100% 120px]
交互体验一般
</left>
<right>
新版采用全新设计语言
![新版](https://picsum.photos/400/120?random=4)
用户体验大幅提升
</right>
</compare>`,

  parseSides(body: string): { left: string; right: string } {
    const leftMatch = body.match(/<left>([\s\S]*?)<\/left>/)
    const rightMatch = body.match(/<right>([\s\S]*?)<\/right>/)
    return {
      left: leftMatch ? leftMatch[1].trim() : '',
      right: rightMatch ? rightMatch[1].trim() : '',
    }
  },

  render(
    attrs: Record<string, string>,
    body: string,
    t: ThemeColors,
    ...rest: unknown[]
  ): string {
    const inlineRenderer = rest[0] as ((md: string) => string) | undefined
    const hex = resolveColor(attrs.color || t.accent)
    const direction = attrs.direction || 'horizontal'
    const isVertical = direction === 'vertical'
    const { left, right } = this.parseSides(body)

    const renderContent = (md: string): string => {
      if (!md) return ''
      const lines = md.split('\n').filter((l) => l.trim())
      return lines
        .map((line) => {
          const trimmed = line.trim()
          const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\[([^\]]+)\])?$/)
          if (imgMatch) {
            const [, alt, src, size] = imgMatch
            if (size) {
              const parts = size.split(/\s+/)
              return `<img src="${esc(src)}" alt="${esc(alt)}" style="width:${parts[0] || '100%'};max-height:${parts[1] || '120px'};border-radius:${radius.md};display:block;margin:${spacing[1]} 0">`
            }
            return `<img src="${esc(src)}" alt="${esc(alt)}" style="width:100%;max-height:120px;border-radius:${radius.md};display:block;margin:${spacing[1]} 0">`
          }
          const rendered = inlineRenderer ? inlineRenderer(trimmed) : inlineFormat(trimmed, t)
          return `<p style="margin:${spacing[1]} 0;font-size:${fontSize.md};color:${color.inkMuted};line-height:${lineHeight.relaxed}">${rendered}</p>`
        })
        .join('')
    }

    const renderSide = (
      label: string,
      title: string,
      content: string,
      labelColor: string,
    ): string => {
      let html = ''
      if (label) {
        html += `<p style="margin:0px 0px ${spacing[1]};font-size:${fontSize['2xs']};font-weight:${fontWeight.bold};color:${labelColor};letter-spacing:${letterSpacing['2xl']}">${leaf(label)}</p>`
      }
      if (title) {
        html += `<p style="margin:0px 0px ${spacing[3]};font-size:${fontSize.md};font-weight:${fontWeight.bold};color:${color.textTertiary}">${leaf(title)}</p>`
      }
      html += renderContent(content)
      return html
    }

    const cardStyle = `padding:${spacing[7]};background:${neutral.gray50};border-radius:${radius['2xl']}`

    if (isVertical) {
      return `<section style="display:flex;flex-direction:column;gap:${spacing[5]};margin:${spacing[9]} 0px"><section style="${cardStyle}">${renderSide(attrs['left-label'] || '', attrs['left-title'] || '', left, neutral.gray500)}</section><section style="${cardStyle}">${renderSide(attrs['right-label'] || '', attrs['right-title'] || '', right, hex)}</section></section>`
    }

    return `<section style="display:flex;gap:${spacing[7]};margin:${spacing[9]} 0px"><section style="flex:1;min-width:0;${cardStyle}">${renderSide(attrs['left-label'] || '', attrs['left-title'] || '', left, neutral.gray500)}</section><section style="flex:1;min-width:0;${cardStyle}">${renderSide(attrs['right-label'] || '', attrs['right-title'] || '', right, hex)}</section></section>`
  },
}
