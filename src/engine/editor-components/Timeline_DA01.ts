/**
 * Timeline_DA01 - 时间线（默认A型01号样式）
 *
 * 编辑器语法：
 *   <timeline>
 *   - 2024年01月 | 项目启动 | 完成团队组建和需求分析 | ![新版](https://example.com/v1.jpg)[100% 120px]
 *   - 2024年06月 | 一期上线 | 核心功能发布，用户突破1万
 *   - 2025年01月 | 二期迭代 | 新增AI辅助功能，用户突破10万 | ![二期](https://example.com/v2.jpg)[100% 120px]
 *   </timeline>
 *
 * 格式：- 日期 | 标题 | 描述 | ![alt](url)[宽 高]（图片可选）
 *
 * 属性：
 *   color?: string  - 时间线颜色（默认使用主题色）
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import { resolveColor, colorToAlpha } from '@engine/utils/colorUtils'
import { leaf, parseAttrs } from '@engine/utils/helpers'
import { Img_DA01 } from '@engine/editor-components/Img_DA01'

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

function parseTimelineItems(body: string): TimelineItem[] {
  const items: TimelineItem[] = []
  const lines = body.split('\n').filter((l) => l.trim())

  for (const line of lines) {
    // 1) 匹配：- date | title | desc | <img ... />
    const customImgMatch = line.match(
      /^-\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*<img\s+(.*?)\s*\/?\s*>\s*$/,
    )
    if (customImgMatch) {
      items.push({
        date: customImgMatch[1].trim(),
        title: customImgMatch[2].trim(),
        desc: customImgMatch[3].trim(),
        image: null,
        customImgAttrs: parseAttrs(customImgMatch[4]),
      })
      continue
    }

    // 2) 匹配：- date | title | desc | ![alt](url)[w h]
    const mdImgMatch = line.match(
      /^-\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*!\[(.*?)\]\((.*?)\)\[(\S+)\s+(\S+)\]\s*$/,
    )
    if (mdImgMatch) {
      items.push({
        date: mdImgMatch[1].trim(),
        title: mdImgMatch[2].trim(),
        desc: mdImgMatch[3].trim(),
        image: { alt: mdImgMatch[4], src: mdImgMatch[5], width: mdImgMatch[6], height: mdImgMatch[7] },
        customImgAttrs: null,
      })
      continue
    }

    // 3) 匹配：- date | title | desc（无图片）
    const m = line.match(/^-\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*$/)
    if (m) {
      items.push({
        date: m[1].trim(),
        title: m[2].trim(),
        desc: m[3].trim(),
        image: null,
        customImgAttrs: null,
      })
    }
  }
  return items
}

export const Timeline_DA01 = {
  id: 'Timeline_DA01',
  name: '时间线',
  tag: 'timeline',
  attrs: [{ key: 'color', label: '自定义颜色', required: false, default: '' }],
  example: `<timeline color="#3b82f6">
- 2024年01月 | 项目启动 | 完成团队组建和需求分析 | ![新版](https://picsum.photos/400/120?random=1)[100% 120px]
- 2024年06月 | 一期上线 | 核心功能发布，用户突破1万
- 2025年01月 | 二期迭代 | 新增AI辅助功能，用户突破10万 | ![二期](https://picsum.photos/400/120?random=2)[100% 120px]
</timeline>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const hex = resolveColor(attrs.color || t.accent)
    // 先解析所有 items（parseTimelineItems 已支持自定义 <img> 和 markdown 图片）
    const items = parseTimelineItems(body)

    // 逐行扫描 body，按原始顺序构建 fragment 流
    type Fragment = { type: 'img'; imgHtml: string } | { type: 'item'; itemIndex: number }
    const fragments: Fragment[] = []
    let itemIdx = 0
    const bodyLines = body.split('\n')

    for (const line of bodyLines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // 独立 <img> 行（整行就是 <img ... /> 标签）
      const customImgMatch = trimmed.match(/^<img\s+(.*?)\s*\/?\s*>$/i)
      if (customImgMatch) {
        const imgAttrs = parseAttrs(customImgMatch[1])
        fragments.push({ type: 'img', imgHtml: Img_DA01.render(imgAttrs, '', t, '12px') })
        continue
      }

      // timeline item 行（以 '- ' 开头，对应 parseTimelineItems 已解析的条目）
      if (/^-\s/.test(trimmed) && itemIdx < items.length) {
        fragments.push({ type: 'item', itemIndex: itemIdx })
        itemIdx++
      }
    }

    if (fragments.length === 0) return ''

    const dotBg = colorToAlpha(hex, 0.15)
    const lineColor = colorToAlpha(hex, 0.3)

    const rows = fragments.map((frag) => {
      if (frag.type === 'img') {
        return `<section style="margin-bottom:32px;">${frag.imgHtml}</section>`
      }

      const item = items[frag.itemIndex]
      const isLast = frag.itemIndex === items.length - 1

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
        ${rows}
      </section>`
  },
}
