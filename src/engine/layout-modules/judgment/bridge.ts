/**
 * bridge — 转场卡片
 * body_format: fields
 *   from, to
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;padding:20px 24px;display:flex;align-items:center;justify-content:center;gap:16px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0">`
  if (f.from) {
    html += `<p style="margin:0px;font-size:14px;color:#94a3b8;font-weight:600;letter-spacing:0.3px">${esc(f.from)}</p>`
  }
  html += `<span style="flex-shrink:0;font-size:16px;color:${accent};font-weight:900">→</span>`
  if (f.to) {
    html += `<p style="margin:0px;padding:6px 14px;font-size:14px;color:#fff;font-weight:700;letter-spacing:0.3px;background:${accent};border-radius:8px">${esc(f.to)}</p>`
  }
  html += `</section>`
  return html
}

export const bridgeModule: LayoutModule = {
  spec: { name: 'bridge', category: 'judgment', serves: ['readability'], bodyFormat: 'fields', label: '转场卡片' },
  renderer: buildModuleRenderer(
    { name: 'bridge', category: 'judgment', serves: ['readability'], bodyFormat: 'fields', label: '转场卡片' },
    render,
  ),
}
