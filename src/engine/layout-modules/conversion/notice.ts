/**
 * notice — 重要通知
 * body_format: fields
 *   title, body
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import { inlineFormat } from '../../utils/inlineFormat'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;padding:28px 24px;background:${accent}08;border-left:4px solid ${accent};border-radius:0px 14px 14px 0px;text-align:center">`
  html += `<p style="margin:0px 0px 8px;font-size:20px;line-height:1">📢</p>`
  if (f.title) {
    html += `<p style="margin:0px 0px 12px;font-size:18px;font-weight:800;color:#1a1a1a;line-height:1.4;letter-spacing:-0.3px">${esc(f.title)}</p>`
  }
  if (f.body) {
    html += `<p style="margin:0px;font-size:15px;color:#475569;line-height:1.8;letter-spacing:0.3px;text-align:justify">${inlineFormat(f.body, ctx.t)}</p>`
  }
  html += `</section>`
  return html
}

export const noticeModule: LayoutModule = {
  spec: { name: 'notice', category: 'conversion', serves: ['readability'], bodyFormat: 'fields', label: '重要通知' },
  renderer: buildModuleRenderer(
    { name: 'notice', category: 'conversion', serves: ['readability'], bodyFormat: 'fields', label: '重要通知' },
    render,
  ),
}
