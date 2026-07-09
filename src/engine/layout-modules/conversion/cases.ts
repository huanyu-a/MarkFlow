/**
 * cases — 案例卡片
 * body_format: rows
 *   案例名 | 行业 | 结果描述
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;display:grid;grid-template-columns:repeat(2,1fr);gap:14px">`
  rows.forEach((row) => {
    const name = row[0] ?? ''
    const industry = row[1] ?? ''
    const result = row[2] ?? ''
    html += `<section style="padding:20px 18px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;position:relative;overflow:hidden">`
    // accent top bar
    html += `<section style="position:absolute;top:0;left:0;right:0;height:3px;background:${accent}"></section>`
    if (industry) {
      html += `<span style="display:inline-block;padding:3px 10px;font-size:11px;font-weight:700;color:${accent};background:${accent}0d;border-radius:999px;letter-spacing:0.5px;margin-bottom:10px">${esc(industry)}</span>`
    }
    if (name) html += `<p style="margin:0px 0px 8px;font-size:16px;font-weight:800;color:#1a1a1a;line-height:1.4;letter-spacing:-0.3px">${esc(name)}</p>`
    if (result) html += `<p style="margin:0px;font-size:13px;color:#64748b;line-height:1.6">${esc(result)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const casesModule: LayoutModule = {
  spec: { name: 'cases', category: 'conversion', serves: ['memorability'], bodyFormat: 'rows', label: '案例卡片' },
  renderer: buildModuleRenderer(
    { name: 'cases', category: 'conversion', serves: ['memorability'], bodyFormat: 'rows', label: '案例卡片' },
    render,
  ),
}
