/**
 * myth-fact — 辟谣卡片
 * body_format: rows
 *   myth|fact | 内容
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;display:grid;grid-template-columns:1fr 1fr;gap:14px">`
  rows.forEach((row) => {
    const type = row[0]?.trim().toLowerCase()
    const content = row.slice(1).join('|').trim()
    const isMyth = type === 'myth'
    const label = isMyth ? '误解' : '事实'
    const icon = isMyth ? '🚫' : '✓'
    const bg = isMyth ? '#fef2f2' : '#f0fdf4'
    const borderColor = isMyth ? '#fecaca' : '#bbf7d0'
    const accentColor = isMyth ? '#dc2626' : accent
    const textColor = isMyth ? '#7f1d1d' : '#14532d'
    html += `<section style="padding:18px 16px;background:${bg};border:1px solid ${borderColor};border-radius:14px;position:relative;overflow:hidden">`
    html += `<p style="margin:0px 0px 10px;font-size:11px;letter-spacing:2.4px;font-weight:800;color:${accentColor};text-transform:uppercase;line-height:1.4">${icon} ${esc(label)}</p>`
    html += `<p style="margin:0px;font-size:14px;color:${textColor};line-height:1.7;letter-spacing:0.3px">${esc(content)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const mythFactModule: LayoutModule = {
  spec: { name: 'myth-fact', category: 'judgment', serves: ['memorability'], bodyFormat: 'rows', label: '辟谣卡片' },
  renderer: buildModuleRenderer(
    { name: 'myth-fact', category: 'judgment', serves: ['memorability'], bodyFormat: 'rows', label: '辟谣卡片' },
    render,
  ),
}
