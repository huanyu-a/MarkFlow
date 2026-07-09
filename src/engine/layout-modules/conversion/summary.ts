/**
 * summary — 文章要点总结
 * body_format: markdown
 *   多行 markdown 要点列表
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutBody } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;padding:24px 24px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px">`
  html += `<p style="margin:0px 0px 14px;font-size:13px;font-weight:800;color:${accent};letter-spacing:2px;text-transform:uppercase">本文要点</p>`
  // 用 accent 圆点列表渲染 markdown body
  const lines = body.markdown.split('\n').filter((l) => l.trim())
  lines.forEach((line) => {
    const trimmed = line.trim()
    // 剥除 markdown 列表前缀 (* 或 - 或数字.)
    const content = trimmed.replace(/^(\d+\.|[-*])\s*/, '')
    html += `<section style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start">`
    html += `<span style="flex-shrink:0;width:8px;height:8px;border-radius:50%;background:${accent};margin-top:8px"></span>`
    html += `<p style="margin:0px;font-size:15px;color:#1a1a1a;line-height:1.7;letter-spacing:0.3px">${esc(content)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const summaryModule: LayoutModule = {
  spec: { name: 'summary', category: 'conversion', serves: ['memorability'], bodyFormat: 'markdown', label: '文章要点' },
  renderer: buildModuleRenderer(
    { name: 'summary', category: 'conversion', serves: ['memorability'], bodyFormat: 'markdown', label: '文章要点' },
    render,
  ),
}
