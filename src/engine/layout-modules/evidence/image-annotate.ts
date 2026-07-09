/**
 * image-annotate — 图片标注
 * body_format: fields + rows
 *   fields: src, title, note
 *   rows: 序号 | x坐标(0-100) | y坐标(0-100) | 标签 | 说明
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleTitle } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px">`
  if (f.title) html += moduleTitle(esc(f.title), { color: '#1a1a1a', size: '18px', weight: '800' })
  if (f.src) {
    html += `<section style="position:relative;display:inline-block;max-width:100%;margin:0px 0px 12px;border-radius:12px;overflow:hidden">`
    html += `<img src="${esc(f.src)}" alt="${esc(f.title || '')}" style="max-width:100%;display:block;border-radius:12px">`
    rows.forEach((row, idx) => {
      const num = row[0] ?? `${idx + 1}`
      const x = row[1] ?? '50'
      const y = row[2] ?? '50'
      const label = row[3] ?? ''
      const desc = row[4] ?? ''
      const posX = Math.max(0, Math.min(100, parseFloat(x) || 0))
      const posY = Math.max(0, Math.min(100, parseFloat(y) || 0))
      const display = label || num
      html += `<span style="position:absolute;left:${posX}%;top:${posY}%;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;background:${accent};color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px ${accent}44;line-height:1" title="${esc(desc)}">${esc(display)}</span>`
    })
    html += `</section>`
  }
  // 标注说明列表
  if (rows.length > 0) {
    html += `<section style="display:flex;flex-direction:column;gap:8px">`
    rows.forEach((row, idx) => {
      const num = row[0] ?? `${idx + 1}`
      const label = row[3] ?? ''
      const desc = row[4] ?? ''
      const display = label || num
      html += `<section style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px;background:#f8fafc;border-radius:10px">`
      html += `<span style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:${accent}15;color:${accent};font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1">${esc(num)}</span>`
      html += `<section style="flex:1;min-width:0">`
      html += `<p style="margin:0px;font-size:14px;font-weight:700;color:#1a1a1a;line-height:1.4">${esc(display)}</p>`
      if (desc) html += `<p style="margin:4px 0px 0px;font-size:13px;color:#64748b;line-height:1.6">${esc(desc)}</p>`
      html += `</section>`
      html += `</section>`
    })
    html += `</section>`
  }
  if (f.note) {
    html += `<p style="margin:12px 0px 0px;font-size:13px;color:#94a3b8;line-height:1.6;font-style:italic">${esc(f.note)}</p>`
  }
  html += `</section>`
  return html
}

export const imageAnnotateModule: LayoutModule = {
  spec: { name: 'image-annotate', category: 'evidence', serves: ['readability'], bodyFormat: 'fields', label: '图片标注' },
  renderer: buildModuleRenderer(
    { name: 'image-annotate', category: 'evidence', serves: ['readability'], bodyFormat: 'fields', label: '图片标注' },
    render,
  ),
}
