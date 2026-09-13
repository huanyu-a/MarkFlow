/**
 * audience-fit — 受众匹配
 * body_format: rows
 *   fit|not-fit | 受众名称 | 描述（推荐，受众名加粗）
 *   fit|not-fit | 描述（兼容，仅有描述列时直接渲染描述）
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;display:flex;flex-direction:column;gap:10px">`
  rows.forEach((row) => {
    const type = row[0]?.trim().toLowerCase()
    const rest = row.slice(1).map((c) => c.trim()).filter(Boolean)
    const name = rest.length >= 2 ? rest[0] : ''
    const desc = rest.length >= 2 ? rest.slice(1).join('：') : rest.join('')
    const isFit = type === 'fit'
    const icon = isFit ? '✓' : '✗'
    const iconColor = isFit ? accent : '#dc2626'
    const iconBg = isFit ? `${accent}12` : '#fef2f2'
    const borderColor = isFit ? `${accent}44` : '#fecaca'
    html += `<section style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:${iconBg};border:1px solid ${borderColor};border-radius:12px">`
    html += `<span style="flex-shrink:0;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;color:${iconColor};font-size:14px;font-weight:900;border:1.5px solid ${iconColor}">${icon}</span>`
    html += `<p style="margin:0px;font-size:14px;color:#334155;line-height:1.7;letter-spacing:0.3px">${name ? `<span style="font-weight:800;color:#1a1a1a">${esc(name)}</span>　` : ''}${esc(desc)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const audienceFitModule: LayoutModule = {
  spec: { name: 'audience-fit', category: 'judgment', serves: ['readability'], bodyFormat: 'rows', label: '受众匹配' },
  renderer: buildModuleRenderer(
    { name: 'audience-fit', category: 'judgment', serves: ['readability'], bodyFormat: 'rows', label: '受众匹配' },
    render,
  ),
}
