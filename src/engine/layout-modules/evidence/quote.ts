/**
 * quote — 引用强调
 * body_format: rows
 *   引用内容 | 来源 | 作者
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;padding:24px 28px 24px 36px;background:${accent}08;border-left:4px solid ${accent};border-radius:0px 14px 14px 0px;position:relative">`
  // 大引号装饰
  html += `<span style="position:absolute;top:8px;left:12px;font-size:56px;line-height:1;font-weight:900;color:${accent}22;font-family:Georgia,serif">"</span>`
  rows.forEach((row) => {
    const quote = row[0] ?? ''
    const source = row[1] ?? ''
    const author = row[2] ?? ''
    if (quote) {
      html += `<p style="margin:0px 0px 12px;font-size:16px;color:#1a1a1a;line-height:1.8;letter-spacing:0.3px;font-style:italic;text-align:justify;padding-left:28px">${esc(quote)}</p>`
    }
    if (source || author) {
      const credit = [author, source].filter(Boolean).join(' · ')
      html += `<p style="margin:0px;font-size:13px;color:#64748b;line-height:1.6;text-align:right;padding-left:28px">— ${esc(credit)}</p>`
    }
  })
  html += `</section>`
  return html
}

export const quoteModule: LayoutModule = {
  spec: { name: 'quote', category: 'evidence', serves: ['memorability'], bodyFormat: 'rows', label: '引用强调' },
  renderer: buildModuleRenderer(
    { name: 'quote', category: 'evidence', serves: ['memorability'], bodyFormat: 'rows', label: '引用强调' },
    render,
  ),
}
