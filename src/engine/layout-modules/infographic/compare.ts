/**
 * compare — 双栏对比
 * body_format: rows
 *   维度 | A方描述 | B方描述 | 颜色(accent|default)
 *
 * 三列表格样式：左列维度加粗，中右两列对比。
 * accent 行右侧（B方）主题色高亮，无表格线，卡片背景区分。
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import { isAccentRow, rowContent } from '../parse'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  const light = ctx.t.light
  let html = `<section style="margin:0px 0px 28px;display:flex;flex-direction:column;gap:12px">`
  rows.forEach((row) => {
    const cells = rowContent(row)
    const accentRow = isAccentRow(row)
    const dim = cells[0] ?? ''
    const aDesc = cells[1] ?? ''
    const bDesc = cells[2] ?? ''
    const borderColor = accentRow ? accent : '#e2e8f0'
    const rowBg = accentRow ? accent : '#ffffff'
    const dimColor = accentRow ? '#ffffff' : '#1a1a1a'
    const aColor = accentRow ? 'rgba(255,255,255,0.85)' : '#475569'
    const bColor = accentRow ? '#ffffff' : '#475569'
    const bBg = accentRow ? 'rgba(255,255,255,0.18)' : light
    html += `<section style="display:grid;grid-template-columns:120px 1fr 1fr;border:1px solid ${borderColor};border-radius:14px;overflow:hidden;background:${rowBg}">`
    html += `<p style="margin:0px;padding:14px 14px;font-size:13px;font-weight:800;color:${dimColor};border-right:1px solid ${borderColor};line-height:1.5">${esc(dim)}</p>`
    html += `<p style="margin:0px;padding:14px 14px;font-size:13px;color:${aColor};border-right:1px solid ${borderColor};line-height:1.6">${esc(aDesc)}</p>`
    html += `<p style="margin:0px;padding:14px 14px;font-size:13px;font-weight:${accentRow ? '700' : '400'};color:${bColor};background:${bBg};line-height:1.6">${esc(bDesc)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const compareModule: LayoutModule = {
  spec: { name: 'compare', category: 'infographic', serves: ['readability'], bodyFormat: 'rows', label: '双栏对比' },
  renderer: buildModuleRenderer(
    { name: 'compare', category: 'infographic', serves: ['readability'], bodyFormat: 'rows', label: '双栏对比' },
    render,
  ),
}
