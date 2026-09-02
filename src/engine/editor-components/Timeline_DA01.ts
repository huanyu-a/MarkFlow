/**
 * Timeline_DA01 - 时间线（默认A型01号样式）
 *
 * 统一语法（::: 容器）：
 *   :::timeline
 *   - 2024年01月 | 项目启动 | 完成团队组建和需求分析 | ![新版](https://example.com/v1.jpg)[100% 120px]
 *   - 2024年06月 | 一期上线 | 核心功能发布，用户突破1万
 *   - 2025年01月 | 二期迭代 | 新增AI辅助功能，用户突破10万
 *   :::
 *
 * 格式：- 日期 | 标题 | 描述 | ![alt](url)[宽 高]（图片可选）
 *
 * 属性：
 *   color?: string  - 时间线颜色（默认使用主题色）
 */
import { resolveColor, colorToAlpha } from '@engine/utils/colorUtils'
import { leaf, parseAttrs } from '@engine/utils/helpers'
import { Img_DA01 } from '@engine/editor-components/Img_DA01'
import type { ThemeColors } from '@engine/composables/useTheme'
import { buildUnifiedRenderer, parseBody, type UnifiedComponentDef, type ParsedBody } from './unifiedRender'

interface TimelineImage {
  src: string
  alt: string
  width: string
  height: string
}

interface TimelineItem {
  date: string
  title: string
  desc: string
  image: TimelineImage | null
  customImgAttrs: Record<string, string> | null
}

/** 从 body.rows 重建时间线 items（行格式：- 时间点 | 标题 | 说明 | 可选图片） */
function buildTimelineItems(rows: string[][]): TimelineItem[] {
  const items: TimelineItem[] = []
  for (const r of rows) {
    if (r.length < 3) continue
    // r[0] 可能携带行首 "- " 列表标记，需要剥离
    const dateRaw = r[0].replace(/^-\s*/, '')
    const title = r[1]
    const desc = r[2]
    const imgSpec = (r[3] || '').trim()

    let image: TimelineImage | null = null
    let customImgAttrs: Record<string, string> | null = null

    if (imgSpec) {
      // markdown 图片：![alt](url)[w h]
      const mdImgMatch = imgSpec.match(/^!\[(.*?)\]\((.*?)\)\[(\S+)\s+(\S+)\]$/)
      if (mdImgMatch) {
        image = { alt: mdImgMatch[1], src: mdImgMatch[2], width: mdImgMatch[3], height: mdImgMatch[4] }
      } else {
        // 自定义 <img ... />
        const customImgMatch = imgSpec.match(/^<img\s+(.*?)\s*\/?\s*>$/i)
        if (customImgMatch) {
          customImgAttrs = parseAttrs(customImgMatch[1])
        }
      }
    }

    items.push({ date: dateRaw, title, desc, image, customImgAttrs })
  }
  return items
}

export const Timeline_DA01: UnifiedComponentDef = {
  spec: {
    name: 'timeline',
    label: '时间线',
    bodyFormat: 'rows',
    example: `:::timeline
- 2024年01月 | 项目启动 | 完成团队组建和需求分析 | ![新版](https://robocopmao.github.io/r-markdown/banner4.webp)[100% 120px]
- 2024年06月 | 一期上线 | 核心功能发布，用户突破1万
- 2025年01月 | 二期迭代 | 新增AI辅助功能，用户突破10万 | ![二期](https://robocopmao.github.io/r-markdown/banner4.webp)[100% 120px]
:::`,
    fields: [
      { name: 'color', required: false, description: '自定义颜色' },
    ],
  },

  render(attrs: Record<string, string>, _rawBody: string, body: ParsedBody, t: ThemeColors) {
    const hex = resolveColor(attrs.color || t.accent)
    const items = buildTimelineItems(body.rows)

    if (items.length === 0) return ''

    const dotBg = colorToAlpha(hex, 0.15)
    const lineColor = colorToAlpha(hex, 0.3)

    const rowsHtml = items
      .map((item, idx) => {
        const isLast = idx === items.length - 1

        let imageHtml = ''
        if (item.customImgAttrs) {
          imageHtml = Img_DA01.render(item.customImgAttrs, '', t, '12px')
        } else if (item.image) {
          const imgStyle: string[] = ['border-radius:12px', 'display:block', 'margin-top:12px']
          if (item.image.width) imgStyle.push(`width:${item.image.width}`)
          if (item.image.height) imgStyle.push(`height:${item.image.height}`, 'object-fit:cover')
          imageHtml = `<img src="${item.image.src}" alt="${item.image.alt}" style="${imgStyle.join(';')};" />`
        }

        const dotHtml = `<section style="float:left;width:12px;height:12px;border-radius:50%;background:${hex};box-shadow:0 0 0 4px ${dotBg};margin:5px 0 0 4px;"></section>`
        const borderStyle = isLast
          ? 'border-left:2px solid transparent;'
          : `border-left:2px solid ${lineColor};`

        return `
        <section style="margin-bottom:${isLast ? '0' : '32px'};overflow:hidden;">
          ${dotHtml}
          <section style="margin-left:9px;${borderStyle}padding-left:18px;">
            <section style="margin:0 0 6px;font-size:13px;font-weight:700;color:${hex};letter-spacing:0.5px;">${leaf(item.date)}</section>
            <section style="margin:0 0 6px;font-size:17px;font-weight:800;color:rgb(17,24,39);line-height:1.4;">${leaf(item.title)}</section>
            <section style="margin:0;font-size:14px;color:rgb(100,116,139);line-height:1.6;">${leaf(item.desc)}</section>
            ${imageHtml}
          </section>
        </section>`
      })
      .join('')

    return `
      <section style="margin:24px 0;padding:24px;background:linear-gradient(135deg, rgba(255,255,255,0.8), rgba(248,250,252,0.6));border:1px solid rgba(0,0,0,0.06);border-radius:16px;">
        ${rowsHtml}
      </section>`
  },

  renderLegacy(attrs, body, t) {
    // 标签路径（<timeline>...</timeline>）传入原始文本，需按 spec 的 rows 格式解析后再渲染
    return this.render(attrs, body, parseBody(body, this.spec.bodyFormat), t)
  },
}

export const timelineRenderer = buildUnifiedRenderer(Timeline_DA01)
