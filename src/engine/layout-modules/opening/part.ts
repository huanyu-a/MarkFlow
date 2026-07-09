/**
 * part — 章节分隔
 * body_format: fields
 *   eyebrow, title, body
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleLabel, moduleTitle } from '../buildRenderer'
import { inlineFormat } from '../../utils/inlineFormat'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  let html = `<section style="margin:36px 0px 24px;text-align:center">`
  if (f.label) html += moduleLabel(esc(f.label), accent)
  if (f.title) html += moduleTitle(esc(f.title), { color: '#1a1a1a', size: '26px', weight: '900', align: 'center' })
  if (f.body) {
    html += `<section style="margin-top:14px;font-size:15px;color:#64748b;line-height:1.8;letter-spacing:0.3px;text-align:justify">${inlineFormat(f.body, ctx.t)}</section>`
  }
  html += `<section style="margin:20px auto 0px;width:48px;height:3px;border-radius:2px;background:${accent}"></section>`
  html += `</section>`
  return html
}

export const partModule: LayoutModule = {
  spec: {
    name: 'part',
    category: 'opening',
    serves: ['readability'],
    bodyFormat: 'fields',
    label: '章节分隔',
    fields: [
      { name: 'label', required: true, description: '标签/徽章文字' },
      { name: 'title', required: true, description: '主标题' },
      { name: 'body', required: false, description: '正文内容' },
    ],
  },
  renderer: buildModuleRenderer(
    { name: 'part', category: 'opening', serves: ['readability'], bodyFormat: 'fields', label: '章节分隔' },
    render,
  ),
}
