/**
 * label-title — 标签标题
 * body_format: fields
 *   label, title
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleLabel, moduleSubtitle, moduleTitle } from '../buildRenderer'
import type { LayoutModule, LayoutModuleSpec } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px">`
  if (f.label) html += moduleLabel(esc(f.label), accent)
  if (f.title) html += moduleTitle(esc(f.title), { color: '#1a1a1a', size: '24px', weight: '800' })
  if (f.subtitle) html += `<section style="margin:-4px 0px 0px">${moduleSubtitle(esc(f.subtitle))}</section>`
  html += `</section>`
  return html
}

// spec 单一来源：consumedFields 必须在传给 buildModuleRenderer 的对象上才生效
const spec: LayoutModuleSpec = {
  name: 'label-title',
  category: 'opening',
  serves: ['attention'],
  bodyFormat: 'fields',
  label: '标签标题',
  consumedFields: ['label', 'title', 'subtitle'],
}

export const labelTitleModule: LayoutModule = {
  spec,
  renderer: buildModuleRenderer(spec, render),
}
