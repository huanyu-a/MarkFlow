/**
 * faq — 问答列表
 * body_format: rows
 *   问题 | 回答
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px">`
  rows.forEach((row) => {
    const q = row[0] ?? ''
    const a = row[1] ?? ''
    html += `<section style="margin-bottom:16px;padding:18px 20px;background:#fff;border:1px solid #e2e8f0;border-radius:14px">`
    html += `<section style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">`
    html += `<span style="flex-shrink:0;width:28px;height:28px;border-radius:8px;background:${accent};color:#fff;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1">Q</span>`
    html += `<p style="margin:0px;font-size:16px;font-weight:700;color:#1a1a1a;line-height:1.5;letter-spacing:-0.3px">${esc(q)}</p>`
    html += `</section>`
    if (a) {
      html += `<p style="margin:0px 0px 0px 40px;font-size:14px;color:#64748b;line-height:1.7;letter-spacing:0.3px;text-align:justify">${esc(a)}</p>`
    }
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const faqModule: LayoutModule = {
  spec: { name: 'faq', category: 'conversion', serves: ['conversion'], bodyFormat: 'rows', label: '问答列表' },
  renderer: buildModuleRenderer(
    { name: 'faq', category: 'conversion', serves: ['conversion'], bodyFormat: 'rows', label: '问答列表' },
    render,
  ),
}
