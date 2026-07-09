/**
 * label-title — 标签标题
 * body_format: fields
 *   label, title
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleLabel, moduleTitle } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px">`
  if (f.label) html += moduleLabel(esc(f.label), accent)
  if (f.title) html += moduleTitle(esc(f.title), { color: '#1a1a1a', size: '24px', weight: '800' })
  html += `</section>`
  return html
}

export const labelTitleModule: LayoutModule = {
  spec: { name: 'label-title', category: 'opening', serves: ['attention'], bodyFormat: 'fields', label: '标签标题' },
  renderer: buildModuleRenderer(
    { name: 'label-title', category: 'opening', serves: ['attention'], bodyFormat: 'fields', label: '标签标题' },
    render,
  ),
}
