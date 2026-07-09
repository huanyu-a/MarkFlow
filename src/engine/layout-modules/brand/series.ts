/**
 * series — 系列说明卡片
 * body_format: fields
 *   name, episode, topic
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleSubtitle } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;padding:32px 28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;text-align:center">`
  if (f.title) html += `<p style="margin:0px 0px 10px;font-size:26px;font-weight:900;color:${ctx.t.dark};line-height:1.3;letter-spacing:-0.5px">${esc(f.title)}</p>`
  if (f.episode) {
    html += `<p style="margin:0px auto 14px;display:inline-block;padding:4px 14px;font-size:11px;font-weight:800;color:#fff;background:${accent};letter-spacing:2.4px;text-transform:uppercase;border-radius:999px">${esc(f.episode)}</p>`
  }
  if (f.topic) html += moduleSubtitle(esc(f.topic), { color: '#64748b', size: '14px', align: 'center' })
  html += `<section style="margin:20px auto 0px;width:48px;height:3px;border-radius:2px;background:${accent}33"></section>`
  html += `</section>`
  return html
}

export const seriesModule: LayoutModule = {
  spec: { name: 'series', category: 'brand', serves: ['readability'], bodyFormat: 'fields', label: '系列说明卡片' },
  renderer: buildModuleRenderer(
    { name: 'series', category: 'brand', serves: ['readability'], bodyFormat: 'fields', label: '系列说明卡片' },
    render,
  ),
}
