/**
 * people — 人物卡横向排列
 * body_format: rows
 *   姓名 | 职位 | 简介
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;display:flex;flex-wrap:wrap;gap:14px">`
  rows.forEach((row) => {
    const name = row[0]?.trim() ?? ''
    const role = row[1]?.trim() ?? ''
    const desc = row[2]?.trim() ?? ''
    const initial = esc(name.charAt(0).toUpperCase() || '?')
    html += `<section style="flex:1;min-width:140px;padding:18px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;text-align:center">`
    html += `<section style="margin:0px auto 12px;width:48px;height:48px;border-radius:50%;background:${accent}15;border:2px solid ${accent}22;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:${accent}">${initial}</section>`
    if (name) html += `<p style="margin:0px 0px 4px;font-size:15px;font-weight:800;color:${ctx.t.dark};line-height:1.3">${esc(name)}</p>`
    if (role) html += `<p style="margin:0px 0px 8px;font-size:11px;font-weight:700;color:${accent};letter-spacing:1.2px;text-transform:uppercase">${esc(role)}</p>`
    if (desc) html += `<p style="margin:0px;font-size:12px;color:#94a3b8;line-height:1.6;letter-spacing:0.3px">${esc(desc)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const peopleModule: LayoutModule = {
  spec: { name: 'people', category: 'brand', serves: ['memorability'], bodyFormat: 'rows', label: '人物卡横向排列' },
  renderer: buildModuleRenderer(
    { name: 'people', category: 'brand', serves: ['memorability'], bodyFormat: 'rows', label: '人物卡横向排列' },
    render,
  ),
}
