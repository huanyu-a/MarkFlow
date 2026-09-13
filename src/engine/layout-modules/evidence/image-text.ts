/**
 * image-text — 图文混排
 * body_format: fields
 *   src, title, body, layout（left=图左文右[默认] / right=图右文左）
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleTitle } from '../buildRenderer'
import { inlineFormat } from '../../utils/inlineFormat'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const img = f.src?.trim()
  // layout: right → 图右文左（flex 反转），left 为默认
  const reverse = (f.layout ?? '').trim().toLowerCase() === 'right'
  let html = `<section style="margin:0px 0px 28px">`
  if (f.title) html += moduleTitle(esc(f.title), { color: '#1a1a1a', size: '18px', weight: '800' })
  html += `<section style="display:flex;gap:20px;align-items:flex-start${reverse ? ';flex-direction:row-reverse' : ''}">`
  if (img) {
    html += `<section style="flex:0 0 40%;max-width:280px;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">`
    html += `<img src="${esc(img)}" alt="${esc(f.title || '')}" style="width:100%;display:block;border-radius:12px">`
    html += `</section>`
  }
  html += `<section style="flex:1;min-width:0">`
  if (f.body) {
    html += `<section style="font-size:15px;color:#475569;line-height:1.8;letter-spacing:0.3px;text-align:justify">${inlineFormat(f.body, ctx.t)}</section>`
  }
  html += `</section>`
  html += `</section>`
  html += `</section>`
  return html
}

export const imageTextModule: LayoutModule = {
  spec: { name: 'image-text', category: 'evidence', serves: ['readability'], bodyFormat: 'fields', label: '图文混排', consumedFields: ['src', 'title', 'body', 'layout'] },
  renderer: buildModuleRenderer(
    { name: 'image-text', category: 'evidence', serves: ['readability'], bodyFormat: 'fields', label: '图文混排' },
    render,
  ),
}
