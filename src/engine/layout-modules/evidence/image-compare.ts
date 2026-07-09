/**
 * image-compare — 图片对比
 * body_format: fields
 *   before, after, label_before, label_after
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  const before = f.before?.trim()
  const after = f.after?.trim()
  const labelBefore = (f.label_before || 'Before').trim()
  const labelAfter = (f.label_after || 'After').trim()
  let html = `<section style="margin:0px 0px 28px">`
  html += `<section style="display:grid;grid-template-columns:1fr 1fr;gap:12px">`
  // Before
  html += `<section style="position:relative;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">`
  if (before) {
    html += `<section style="position:absolute;top:12px;left:12px;z-index:2">`
    html += `<span style="display:inline-block;padding:5px 14px;background:${accent};color:#fff;font-size:12px;font-weight:700;border-radius:999px;letter-spacing:0.5px">${esc(labelBefore)}</span>`
    html += `</section>`
    html += `<img src="${esc(before)}" alt="${esc(labelBefore)}" style="max-width:100%;display:block;border-radius:12px">`
  }
  html += `</section>`
  // After
  html += `<section style="position:relative;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">`
  if (after) {
    html += `<section style="position:absolute;top:12px;left:12px;z-index:2">`
    html += `<span style="display:inline-block;padding:5px 14px;background:${accent};color:#fff;font-size:12px;font-weight:700;border-radius:999px;letter-spacing:0.5px">${esc(labelAfter)}</span>`
    html += `</section>`
    html += `<img src="${esc(after)}" alt="${esc(labelAfter)}" style="max-width:100%;display:block;border-radius:12px">`
  }
  html += `</section>`
  html += `</section>`
  html += `</section>`
  return html
}

export const imageCompareModule: LayoutModule = {
  spec: { name: 'image-compare', category: 'evidence', serves: ['readability'], bodyFormat: 'fields', label: '图片对比' },
  renderer: buildModuleRenderer(
    { name: 'image-compare', category: 'evidence', serves: ['readability'], bodyFormat: 'fields', label: '图片对比' },
    render,
  ),
}
