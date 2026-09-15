/**
 * subscribe — 关注引导卡片
 * body_format: fields
 *   title, subtitle, body, placeholder, btn
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleSubtitle } from '../buildRenderer'
import type { LayoutModule, LayoutModuleSpec } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;padding:36px 28px;background:linear-gradient(135deg,${accent}0a 0%,${accent}05 100%);border:1px solid ${accent}22;border-radius:16px;text-align:center">`
  if (f.title) html += `<p style="margin:0px 0px 10px;font-size:22px;font-weight:900;color:${ctx.t.dark};line-height:1.35;letter-spacing:-0.5px">${esc(f.title)}</p>`
  if (f.subtitle) html += `<section style="margin:-2px 0px 0px">${moduleSubtitle(esc(f.subtitle), { color: '#64748b', size: '14px', align: 'center' })}</section>`
  if (f.body) html += `<section style="margin:${f.subtitle ? '8px' : '0px'} 0px 0px">${moduleSubtitle(esc(f.body), { color: '#64748b', size: '14px', align: 'center' })}</section>`
  // 邮箱输入 + 订阅按钮（placeholder/btn 缺省时保留装饰性二维码占位）
  if (f.placeholder || f.btn) {
    html += `<section style="margin:24px auto 0px;max-width:320px;display:flex;gap:8px;align-items:stretch">`
    if (f.placeholder) {
      html += `<section style="flex:1;min-width:0;overflow-wrap:anywhere;padding:10px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;text-align:left">`
      html += `<p style="margin:0px;font-size:13px;color:#94a3b8;letter-spacing:0.3px">${esc(f.placeholder)}</p>`
      html += `</section>`
    }
    if (f.btn) {
      html += `<section style="flex-shrink:0;padding:10px 18px;background:${accent};border-radius:10px;display:flex;align-items:center;justify-content:center">`
      html += `<p style="margin:0px;font-size:14px;font-weight:700;color:#ffffff;letter-spacing:0.5px">${esc(f.btn)}</p>`
      html += `</section>`
    }
    html += `</section>`
    html += `<p style="margin:12px 0px 0px;font-size:12px;color:#94a3b8;letter-spacing:0.5px">输入邮箱即可完成订阅</p>`
  } else {
    // 装饰性二维码占位框
    html += `<section style="margin:24px auto 0px;width:100px;height:100px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;display:flex;align-items:center;justify-content:center">`
    html += `<section style="width:72px;height:72px;background:linear-gradient(135deg,#f8fafc,#e2e8f0);border-radius:8px;border:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:center">`
    html += `<span style="font-size:10px;color:#94a3b8;font-weight:600;letter-spacing:0.5px">QR</span>`
    html += `</section></section>`
    html += `<p style="margin:12px 0px 0px;font-size:12px;color:#94a3b8;letter-spacing:0.5px">长按识别二维码关注</p>`
  }
  html += `</section>`
  return html
}

// spec 单一来源：consumedFields 必须在传给 buildModuleRenderer 的对象上才生效
const spec: LayoutModuleSpec = {
  name: 'subscribe',
  category: 'brand',
  serves: ['conversion'],
  bodyFormat: 'fields',
  label: '关注引导卡片',
  consumedFields: ['title', 'subtitle', 'body', 'placeholder', 'btn'],
}

export const subscribeModule: LayoutModule = {
  spec,
  renderer: buildModuleRenderer(spec, render),
}
