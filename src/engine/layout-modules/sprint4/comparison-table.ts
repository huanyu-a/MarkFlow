/**
 * comparison-table — 左右对比列
 * :::comparison-table
 * {"left":{"title":"A","items":["x","y"]},"right":{"title":"B","items":["m","n"]}}
 * :::
 *
 * 左列 title 蓝底 + items 列表，右列 title 主题色底 + items 列表。
 */
import type { BlockRenderer } from '../../utils/blockRenderRegistry'
import { esc } from '../buildRenderer'
import { parseJsonObject } from '../parse'
import type { LayoutModule } from '../types'

const comparisonTableRenderer: BlockRenderer = {
  name: 'layout-comparison-table',
  priority: 6,
  match: (line) => /^:::\s*comparison-table\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const bodyLines: string[] = []
    let j = i + 1
    while (j < lines.length && !/^:::\s*$/.test(lines[j])) {
      bodyLines.push(lines[j])
      j++
    }
    if (j >= lines.length) return null
    const body = bodyLines.join('\n').trim()
    const data = parseJsonObject(body)
    if (!data) {
      return {
        html: '<section style="padding:12px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;color:#781e1e;font-size:13px">⚠️ JSON 解析失败，请检查语法</section>',
        next: j + 1,
      }
    }
    const left = (data.left as Record<string, unknown>) ?? {}
    const right = (data.right as Record<string, unknown>) ?? {}
    const leftTitle = String(left.title ?? '')
    const rightTitle = String(right.title ?? '')
    const leftItems = Array.isArray(left.items) ? left.items.map(String) : []
    const rightItems = Array.isArray(right.items) ? right.items.map(String) : []
    const maxRows = Math.max(leftItems.length, rightItems.length, 1)
    let html = `<section style="margin:16px 0px;display:grid;grid-template-columns:1fr 1fr;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">`
    // 左列
    html += `<section style="display:flex;flex-direction:column">`
    html += `<section style="padding:14px 18px;background:#3b82f6;text-align:center">`
    html += `<p style="margin:0px;font-size:16px;font-weight:800;color:#fff;letter-spacing:0.5px">${esc(leftTitle)}</p>`
    html += `</section>`
    for (let r = 0; r < maxRows; r++) {
      const item = leftItems[r] ?? ''
      const bg = r % 2 === 0 ? '#eff6ff' : '#dbeafe'
      html += `<section style="padding:12px 18px;background:${bg};border-top:1px solid #bfdbfe;flex:1;display:flex;align-items:center">`
      html += `<p style="margin:0px;font-size:14px;color:#1e40af;line-height:1.6">${esc(item)}</p>`
      html += `</section>`
    }
    html += `</section>`
    // 右列
    html += `<section style="display:flex;flex-direction:column;border-left:1px solid #e2e8f0">`
    html += `<section style="padding:14px 18px;background:${ctx.t.accent};text-align:center">`
    html += `<p style="margin:0px;font-size:16px;font-weight:800;color:#fff;letter-spacing:0.5px">${esc(rightTitle)}</p>`
    html += `</section>`
    for (let r = 0; r < maxRows; r++) {
      const item = rightItems[r] ?? ''
      const bg = r % 2 === 0 ? '#f8fafc' : '#f1f5f9'
      html += `<section style="padding:12px 18px;background:${bg};border-top:1px solid #e2e8f0;flex:1;display:flex;align-items:center">`
      html += `<p style="margin:0px;font-size:14px;color:#334155;line-height:1.6">${esc(item)}</p>`
      html += `</section>`
    }
    html += `</section>`
    html += `</section>`
    return { html, next: j + 1 }
  },
}

export const comparisonTableModule: LayoutModule = {
  spec: { name: 'comparison-table', category: 'sprint4', serves: ['readability'], bodyFormat: 'json_object', label: '对比表' },
  renderer: comparisonTableRenderer,
}
