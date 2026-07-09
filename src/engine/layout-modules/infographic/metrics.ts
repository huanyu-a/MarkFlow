/**
 * metrics — 指标卡片矩阵
 * body_format: rows
 *   指标名 | 数值 | 说明 | 颜色(accent|default)
 *
 * 每行一张横向指标卡片，grid 自适应排列。
 * accent 行数值用主题色大字（32px/900），default 行用深灰。
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import { isAccentRow, rowContent } from '../parse'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;display:flex;flex-wrap:wrap;gap:14px">`
  rows.forEach((row) => {
    const cells = rowContent(row)
    const accentRow = isAccentRow(row)
    const name = cells[0] ?? ''
    const value = cells[1] ?? ''
    const desc = cells[2] ?? ''
    const cardBg = accentRow ? accent : '#f8fafc'
    const cardBorder = accentRow ? accent : '#e2e8f0'
    const valueColor = accentRow ? '#ffffff' : accent
    const nameColor = accentRow ? 'rgba(255,255,255,0.85)' : '#64748b'
    const descColor = accentRow ? 'rgba(255,255,255,0.75)' : '#94a3b8'
    html += `<section style="flex:1 1 calc(25% - 14px);min-width:140px;padding:18px 16px;background:${cardBg};border-radius:14px;border:1px solid ${cardBorder};position:relative;overflow:hidden">`
    if (name) html += `<p style="margin:0px 0px 8px;font-size:11px;letter-spacing:2px;font-weight:700;color:${nameColor};text-transform:uppercase;line-height:1.4">${esc(name)}</p>`
    if (value) html += `<p style="margin:0px 0px 6px;font-size:32px;font-weight:900;color:${valueColor};line-height:1.1">${esc(value)}</p>`
    if (desc) html += `<p style="margin:0px;font-size:13px;color:${descColor};line-height:1.5">${esc(desc)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const metricsModule: LayoutModule = {
  spec: { name: 'metrics', category: 'infographic', serves: ['attention'], bodyFormat: 'rows', label: '指标卡片' },
  renderer: buildModuleRenderer(
    { name: 'metrics', category: 'infographic', serves: ['attention'], bodyFormat: 'rows', label: '指标卡片' },
    render,
  ),
}
