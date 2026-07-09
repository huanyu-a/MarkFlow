/**
 * manifesto — 宣言式大标题
 * body_format: fields
 *   eyebrow, title
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleLabel, moduleTitle } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:36px 0px 32px;padding:48px 32px;background:#f8fafc;border-radius:16px;text-align:center;border:1px solid #e2e8f0">`
  if (f.label) html += moduleLabel(esc(f.label), accent)
  if (f.title) html += moduleTitle(esc(f.title), { color: ctx.t.dark, size: '32px', weight: '900', align: 'center' })
  html += `<section style="margin:24px auto 0px;width:48px;height:3px;border-radius:2px;background:${accent}"></section>`
  html += `</section>`
  return html
}

export const manifestoModule: LayoutModule = {
  spec: {
    name: 'manifesto',
    category: 'judgment',
    serves: ['memorability'],
    bodyFormat: 'fields',
    label: '宣言式大标题',
    fields: [
      { name: 'label', required: true, description: '标签/徽章文字' },
      { name: 'title', required: true, description: '主标题' },
    ],
  },
  renderer: buildModuleRenderer(
    { name: 'manifesto', category: 'judgment', serves: ['memorability'], bodyFormat: 'fields', label: '宣言式大标题' },
    render,
  ),
}
