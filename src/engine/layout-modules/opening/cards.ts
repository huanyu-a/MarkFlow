/**
 * cards — 开篇卡片矩阵
 * body_format: rows
 *   卡片标题 | 副标题 | 说明 | 颜色(accent|default)
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
    const colorFlag = row[row.length - 1]?.toLowerCase()
    const isAccent = colorFlag === 'accent'
    const cells = colorFlag === 'accent' || colorFlag === 'default' ? row.slice(0, -1) : row
    const title = cells[0] ?? ''
    const subtitle = cells[1] ?? ''
    const desc = cells[2] ?? ''
    const bg = isAccent ? accent : '#f8fafc'
    const textColor = isAccent ? '#ffffff' : '#1a1a1a'
    const subColor = isAccent ? 'rgba(255,255,255,0.85)' : '#64748b'
    html += `<section style="padding:18px 16px;background:${bg};border-radius:14px;border:1px solid ${isAccent ? accent : '#e2e8f0'};position:relative;overflow:hidden">`
    html += `<p style="margin:0px 0px 4px;font-size:11px;letter-spacing:2px;font-weight:800;color:${isAccent ? 'rgba(255,255,255,0.85)' : accent};text-transform:uppercase;line-height:1.4">${esc(title)}</p>`
    if (subtitle) html += `<p style="margin:0px 0px 8px;font-size:16px;font-weight:800;color:${textColor};line-height:1.3;letter-spacing:-0.3px">${esc(subtitle)}</p>`
    if (desc) html += `<p style="margin:0px;font-size:13px;color:${subColor};line-height:1.6">${esc(desc)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const cardsModule: LayoutModule = {
  spec: { name: 'cards', category: 'opening', serves: ['attention'], bodyFormat: 'rows', label: '开篇卡片矩阵' },
  renderer: buildModuleRenderer(
    { name: 'cards', category: 'opening', serves: ['attention'], bodyFormat: 'rows', label: '开篇卡片矩阵' },
    render,
  ),
}
