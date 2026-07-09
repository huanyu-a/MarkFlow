/**
 * steps — 横向步骤卡片
 * body_format: rows
 *   序号 | 步骤名 | 步骤说明
 *
 * 横向 flex 排列，圆形序号（accent 背景白字），卡片间连接线装饰。
 * 超出容器宽度时横向滚动。
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
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

export const stepsModule: LayoutModule = {
  spec: { name: 'steps', category: 'infographic', serves: ['readability'], bodyFormat: 'rows', label: '步骤卡片' },
  renderer: buildModuleRenderer(
    { name: 'steps', category: 'infographic', serves: ['readability'], bodyFormat: 'rows', label: '步骤卡片' },
    render,
  ),
}
