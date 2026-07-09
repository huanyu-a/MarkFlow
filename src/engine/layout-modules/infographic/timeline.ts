/**
 * timeline — 纵向时间轴
 * body_format: rows
 *   时间点 | 事件标题 | 事件说明
 *
 * 左侧竖线 + accent 圆点，右侧内容卡片。纵向时间轴样式。
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;padding-left:28px;border-left:2px solid ${accent}40;position:relative">`
  rows.forEach((row) => {
    const time = (row[0] ?? '').trim()
    const title = (row[1] ?? '').trim()
    const desc = (row[2] ?? '').trim()
    html += `<section style="position:relative;margin-bottom:22px;padding-left:4px">`
    // accent 圆点
    html += `<section style="position:absolute;top:4px;left:-35px;width:14px;height:14px;border-radius:50%;background:${accent};border:3px solid #ffffff;box-shadow:0 0 0 2px ${accent};z-index:1"></section>`
    if (time) html += `<p style="margin:0px 0px 4px;font-size:12px;font-weight:700;color:${accent};letter-spacing:0.5px;line-height:1.4">${esc(time)}</p>`
    if (title) html += `<p style="margin:0px 0px 6px;font-size:15px;font-weight:700;color:#1a1a1a;line-height:1.4">${esc(title)}</p>`
    if (desc) html += `<p style="margin:0px;font-size:13px;color:#64748b;line-height:1.7">${esc(desc)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const timelineModule: LayoutModule = {
  spec: { name: 'timeline', category: 'infographic', serves: ['readability'], bodyFormat: 'rows', label: '时间轴' },
  renderer: buildModuleRenderer(
    { name: 'timeline', category: 'infographic', serves: ['readability'], bodyFormat: 'rows', label: '时间轴' },
    render,
  ),
}
