/**
 * image-steps — 图文步骤
 * body_format: rows
 *   步骤序号 | 步骤说明 | 图片URL
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px">`
  rows.forEach((row, idx) => {
    const num = row[0] ?? `${idx + 1}`
    const desc = row[1] ?? ''
    const img = row[2] ?? ''
    html += `<section style="display:flex;gap:16px;margin-bottom:${img ? '16px' : '12px'};align-items:flex-start">`
    // 序号圆圈
    html += `<section style="flex-shrink:0;display:flex;flex-direction:column;align-items:center">`
    html += `<span style="width:32px;height:32px;border-radius:50%;background:${accent};color:#fff;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1">${esc(num)}</span>`
    if (idx < rows.length - 1) {
      html += `<span style="width:2px;height:24px;background:${accent}33;margin-top:4px"></span>`
    }
    html += `</section>`
    // 内容
    html += `<section style="flex:1;min-width:0;padding-top:4px">`
    if (desc) html += `<p style="margin:0px;font-size:15px;color:#1a1a1a;font-weight:700;line-height:1.5">${esc(desc)}</p>`
    if (img) {
      html += `<section style="margin-top:10px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0">`
      html += `<img src="${esc(img)}" alt="${esc(desc || num)}" style="max-width:100%;display:block;border-radius:10px">`
      html += `</section>`
    }
    html += `</section>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const imageStepsModule: LayoutModule = {
  spec: { name: 'image-steps', category: 'evidence', serves: ['readability'], bodyFormat: 'rows', label: '图文步骤' },
  renderer: buildModuleRenderer(
    { name: 'image-steps', category: 'evidence', serves: ['readability'], bodyFormat: 'rows', label: '图文步骤' },
    render,
  ),
}
