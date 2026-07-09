/**
 * toc — 阅读导航
 * body_format: rows
 *   序号 | 章节名 | 一句话说明
 * 支持行内标题 :::toc[阅读导航]
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext, _raw: string): string {
  const rows = body.rows
  const accent = ctx.t.accent
  // 从容器行提取标题（:::toc[标题] 形式由 match 处理，这里 rows 不含容器行）
  let html = `<section style="margin:0px 0px 28px;padding:24px 20px;background:#fafafe;border-radius:14px;border:1px solid #e2e8f0">`
  html += `<p style="margin:0px 0px 14px;font-size:12px;letter-spacing:2.8px;text-transform:uppercase;font-weight:800;color:${accent};line-height:1.4">READING PATH</p>`
  html += `<p style="margin:0px 0px 18px;font-size:16px;font-weight:700;color:#1a1a1a">阅读导航</p>`
  html += `<section style="display:flex;flex-direction:column;gap:14px">`
  rows.forEach((row, idx) => {
    const cells = row.length >= 3 ? row.slice(0, 3) : row
    const num = cells[0] ?? String(idx + 1).padStart(2, '0')
    const title = cells[1] ?? ''
    const desc = cells[2] ?? ''
    html += `<section style="display:flex;align-items:flex-start;gap:14px">`
    html += `<span style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:32px;height:32px;border-radius:50%;background:${accent}15;color:${accent};font-size:13px;font-weight:800;letter-spacing:0.5px">${esc(num)}</span>`
    html += `<section style="flex:1;min-width:0">`
    html += `<p style="margin:0px 0px 2px;font-size:15px;font-weight:700;color:#1a1a1a;line-height:1.4">${esc(title)}</p>`
    if (desc) html += `<p style="margin:0px;font-size:13px;color:#94a3b8;line-height:1.5">${esc(desc)}</p>`
    html += `</section></section>`
  })
  html += `</section></section>`
  return html
}

export const tocModule: LayoutModule = {
  spec: { name: 'toc', category: 'opening', serves: ['readability'], bodyFormat: 'rows', label: '阅读导航' },
  renderer: buildModuleRenderer(
    { name: 'toc', category: 'opening', serves: ['readability'], bodyFormat: 'rows', label: '阅读导航' },
    render,
  ),
}
