/**
 * manifesto — 宣言式大标题
 * body_format: fields
 *   eyebrow, title
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleLabel, moduleSubtitle, moduleTitle } from '../buildRenderer'
import type { LayoutModule, LayoutModuleSpec } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:36px 0px 32px;padding:48px 32px;background:#f8fafc;border-radius:16px;text-align:center;border:1px solid #e2e8f0">`
  if (f.label) html += moduleLabel(esc(f.label), accent)
  if (f.title) html += moduleTitle(esc(f.title), { color: ctx.t.dark, size: '32px', weight: '900', align: 'center' })
  if (f.subtitle) html += `<section style="margin:12px 0px 0px">${moduleSubtitle(esc(f.subtitle), { color: '#64748b', size: '15px', align: 'center' })}</section>`
  html += `<section style="margin:24px auto 0px;width:48px;height:3px;border-radius:2px;background:${accent}"></section>`
  html += `</section>`
  return html
}

// spec 单一来源：consumedFields 必须在传给 buildModuleRenderer 的对象上才生效
const spec: LayoutModuleSpec = {
  name: 'manifesto',
  category: 'judgment',
  serves: ['memorability'],
  bodyFormat: 'fields',
  label: '宣言式大标题',
  fields: [
    { name: 'label', required: true, description: '标签/徽章文字' },
    { name: 'title', required: true, description: '主标题' },
    { name: 'subtitle', required: false, description: '副标题' },
  ],
  consumedFields: ['label', 'title', 'subtitle'],
}

export const manifestoModule: LayoutModule = {
  spec,
  renderer: buildModuleRenderer(spec, render),
}
