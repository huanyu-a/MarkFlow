/**
 * question — 问答手风琴列表
 * :::question
 * [{"q":"为什么？","a":"因为..."}]
 * :::
 *
 * Q 加粗 + 浅色背景圆角，A 文字。
 */
import type { BlockRenderer } from '../../utils/blockRenderRegistry'
import { esc } from '../buildRenderer'
import { parseJsonArray } from '../parse'
import type { LayoutModule } from '../types'

const questionRenderer: BlockRenderer = {
  name: 'layout-question',
  priority: 6,
  match: (line) => /^:::\s*question\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const bodyLines: string[] = []
    let j = i + 1
    while (j < lines.length && !/^:::\s*$/.test(lines[j])) {
      bodyLines.push(lines[j])
      j++
    }
    if (j >= lines.length) return null
    const body = bodyLines.join('\n').trim()
    const data = parseJsonArray(body)
    if (!data) {
      return {
        html: '<section style="padding:12px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;color:#781e1e;font-size:13px">⚠️ JSON 解析失败，请检查语法</section>',
        next: j + 1,
      }
    }
    const items = data.filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    if (items.length === 0) {
      return {
        html: '<section style="padding:12px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;color:#781e1e;font-size:13px">⚠️ JSON 解析失败，请检查语法</section>',
        next: j + 1,
      }
    }
    let html = `<section style="margin:16px 0px;display:flex;flex-direction:column;gap:10px">`
    items.forEach((item) => {
      const q = String(item.q ?? '')
      const a = String(item.a ?? '')
      html += `<section style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">`
      html += `<section style="padding:14px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0">`
      html += `<p style="margin:0px;font-size:15px;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:8px"><span style="color:${ctx.t.accent}">Q:</span> ${esc(q)}</p>`
      html += `</section>`
      html += `<section style="padding:14px 18px;background:#fff">`
      html += `<p style="margin:0px;font-size:14px;color:#475569;line-height:1.75;letter-spacing:0.3px">${esc(a)}</p>`
      html += `</section>`
      html += `</section>`
    })
    html += `</section>`
    return { html, next: j + 1 }
  },
}

export const questionModule: LayoutModule = {
  spec: { name: 'question', category: 'sprint4', serves: ['readability'], bodyFormat: 'json_array', label: '问答列表' },
  renderer: questionRenderer,
}
