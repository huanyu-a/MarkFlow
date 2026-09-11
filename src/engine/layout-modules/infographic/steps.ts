/**
 * steps — 横向步骤卡片
 * body_format: rows
 *   序号 | 步骤名 | 步骤说明
 *
 * 横向 flex 排列，圆形序号（accent 背景白字），卡片间连接线装饰。
 * 超出容器宽度时横向滚动。
 *
 * 防御：body 行缺少 `|` 管道分隔（即非「序号 | 步骤名 | 说明」格式）时，
 * 不做卡片渲染（避免整段长文本被塞进 38px 圆形序号导致溢出），
 * 降级为普通段落渲染，并通过 warning 上报。
 */
import type { BlockRenderer, BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { extractModuleBody, parseBody, renderMarkdownBody, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;display:flex;flex-wrap:nowrap;gap:0px;overflow-x:auto;padding:12px 0px 8px">`
  rows.forEach((row, idx) => {
    const num = (row[0] ?? String(idx + 1)).trim()
    const name = (row[1] ?? '').trim()
    const desc = (row[2] ?? '').trim()
    const isLast = idx === rows.length - 1
    html += `<section style="flex:1 0 150px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;position:relative;padding:0px 14px">`
    // 圆形序号
    html += `<section style="width:38px;height:38px;border-radius:50%;background:${accent};color:#ffffff;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-bottom:14px;box-shadow:0 2px 6px ${accent}44;z-index:1;position:relative">${esc(num)}</section>`
    // 连接线
    if (!isLast) {
      html += `<section style="position:absolute;top:18px;left:52px;right:-14px;height:2px;background:linear-gradient(90deg,${accent}66,${accent}22);z-index:0"></section>`
    }
    if (name) html += `<p style="margin:0px 0px 6px;font-size:14px;font-weight:700;color:#1a1a1a;line-height:1.35">${esc(name)}</p>`
    if (desc) html += `<p style="margin:0px;font-size:12px;color:#64748b;line-height:1.6">${esc(desc)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

/** 自定义 renderer：在标准 buildModuleRenderer 流程前增加管道格式防御 */
export const stepsModule: LayoutModule = {
  spec: { name: 'steps', category: 'infographic', serves: ['readability'], bodyFormat: 'rows', label: '步骤卡片' },
  renderer: {
    name: 'layout-steps',
    // 与 buildModuleRenderer 的默认 priority 保持一致（在 callout/quote 之后、heading 之前匹配）
    priority: 20,
    // (?![-\w])：不吞掉统一组件 :::steps-horizontal / :::steps-vertical
    match: (line) => /^:::\s*steps(?![-\w])/.test(line),
    render: (ctx: BlockRenderContext, _line: string, lines: string[], i: number) => {
      const extracted = extractModuleBody(lines, i)
      if (!extracted) return null
      // 防御：任一内容行缺少 `|` 管道分隔即视为格式错误，整体降级为段落渲染
      const contentLines = extracted.body.split('\n').filter((l) => l.trim())
      const malformed =
        contentLines.length > 0 &&
        contentLines.some((l) => !l.replace(/^-\s+/, '').includes('|'))
      if (malformed) {
        return {
          html: renderMarkdownBody(extracted.body, ctx),
          next: extracted.next,
          warning: ':::steps 容器内缺少「序号 | 步骤名 | 说明」管道格式，已降级为普通段落渲染',
        }
      }
      const layoutBody = parseBody(extracted.body, 'rows')
      return { html: render(layoutBody, ctx), next: extracted.next, warning: extracted.warning }
    },
  } satisfies BlockRenderer,
}
