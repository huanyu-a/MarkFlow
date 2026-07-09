/**
 * hero — 开篇主视觉
 * body_format: fields
 *   eyebrow, title, subtitle, cta_text
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, moduleLabel, moduleTitle, moduleSubtitle, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 32px;padding:36px 28px;background:linear-gradient(135deg,${accent}10 0%,${accent}05 100%);border-radius:16px;border:1px solid ${accent}22;text-align:center;position:relative;overflow:hidden">`
  // 装饰圆
  html += `<section style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:${accent}0d;border-radius:50%"></section>`
  if (f.label) html += moduleLabel(esc(f.label), accent)
  if (f.title) html += moduleTitle(esc(f.title), { color: '#1a1a1a', size: '28px', weight: '900', align: 'center' })
  if (f.subtitle) html += moduleSubtitle(esc(f.subtitle), { color: '#64748b', size: '15px', align: 'center' })
  if (f.cta_text) {
    html += `<p style="margin:20px 0px 0px;font-size:13px;font-weight:700;letter-spacing:1.2px;color:${accent};text-transform:uppercase">${esc(f.cta_text)}</p>`
  }
  html += `</section>`
  return html
}

export const heroModule: LayoutModule = {
  spec: {
    name: 'hero',
    category: 'opening',
    serves: ['attention', 'readability'],
    bodyFormat: 'fields',
    label: '开篇主视觉',
    fields: [
      { name: 'label', required: true, description: '标签/徽章文字' },
      { name: 'title', required: true, description: '主标题' },
      { name: 'subtitle', required: false, description: '副标题' },
      { name: 'cta_text', required: false, description: '引导文案' },
    ],
  },
  renderer: buildModuleRenderer(
    { name: 'hero', category: 'opening', serves: ['attention'], bodyFormat: 'fields', label: '开篇主视觉' },
    render,
  ),
}
