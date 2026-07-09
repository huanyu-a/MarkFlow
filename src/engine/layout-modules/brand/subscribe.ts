/**
 * subscribe — 关注引导卡片
 * body_format: fields
 *   title, body
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleSubtitle } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;padding:36px 28px;background:linear-gradient(135deg,${accent}0a 0%,${accent}05 100%);border:1px solid ${accent}22;border-radius:16px;text-align:center">`
  if (f.title) html += `<p style="margin:0px 0px 10px;font-size:22px;font-weight:900;color:${ctx.t.dark};line-height:1.35;letter-spacing:-0.5px">${esc(f.title)}</p>`
  if (f.body) html += moduleSubtitle(esc(f.body), { color: '#64748b', size: '14px', align: 'center' })
  // 装饰性二维码占位框
  html += `<section style="margin:24px auto 0px;width:100px;height:100px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;display:flex;align-items:center;justify-content:center">`
  html += `<section style="width:72px;height:72px;background:linear-gradient(135deg,#f8fafc,#e2e8f0);border-radius:8px;border:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:center">`
  html += `<span style="font-size:10px;color:#94a3b8;font-weight:600;letter-spacing:0.5px">QR</span>`
  html += `</section></section>`
  html += `<p style="margin:12px 0px 0px;font-size:12px;color:#94a3b8;letter-spacing:0.5px">长按识别二维码关注</p>`
  html += `</section>`
  return html
}

export const subscribeModule: LayoutModule = {
  spec: { name: 'subscribe', category: 'brand', serves: ['conversion'], bodyFormat: 'fields', label: '关注引导卡片' },
  renderer: buildModuleRenderer(
    { name: 'subscribe', category: 'brand', serves: ['conversion'], bodyFormat: 'fields', label: '关注引导卡片' },
    render,
  ),
}
