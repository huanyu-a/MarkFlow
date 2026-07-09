/**
 * verdict — 判断强调卡片
 * body_format: fields
 *   eyebrow, title, body, note
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleLabel, moduleTitle } from '../buildRenderer'
import { inlineFormat } from '../../utils/inlineFormat'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;padding:28px 24px;background:${accent}08;border-left:4px solid ${accent};border-radius:0px 14px 14px 0px;text-align:center">`
  if (f.label) html += moduleLabel(esc(f.label), accent)
  if (f.title) html += moduleTitle(esc(f.title), { color: ctx.t.dark, size: '28px', weight: '900', align: 'center' })
  if (f.body) {
    html += `<section style="margin:12px auto 0px;max-width:520px;font-size:15px;color:#475569;line-height:1.8;letter-spacing:0.3px;text-align:justify">${inlineFormat(f.body, ctx.t)}</section>`
  }
  if (f.note) {
    html += `<p style="margin:16px 0px 0px;font-size:13px;color:#94a3b8;line-height:1.6;font-style:italic">${esc(f.note)}</p>`
  }
  html += `</section>`
  return html
}

export const verdictModule: LayoutModule = {
  spec: { name: 'verdict', category: 'judgment', serves: ['memorability'], bodyFormat: 'fields', label: '判断强调卡片' },
  renderer: buildModuleRenderer(
    { name: 'verdict', category: 'judgment', serves: ['memorability'], bodyFormat: 'fields', label: '判断强调卡片' },
    render,
  ),
}
