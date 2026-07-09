/**
 * quote-card — 金句卡
 * :::quote-card
 * {"text":"结构先于风格","source":"内容设计原则"}
 * :::
 *
 * 浅色背景 + 大引号装饰 + 文字斜体 + 底部来源（灰色小字）。
 */
import type { BlockRenderer } from '../../utils/blockRenderRegistry'
import { esc } from '../buildRenderer'
import { parseJsonObject } from '../parse'
import type { LayoutModule } from '../types'

const quoteCardRenderer: BlockRenderer = {
  name: 'layout-quote-card',
  priority: 6,
  match: (line) => /^:::\s*quote-card\b/.test(line),
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
    const text = String(data.text ?? '')
    const source = String(data.source ?? '')
    let html = `<section style="margin:16px 0px;padding:28px 32px;background:linear-gradient(135deg,#fefce8 0%,#fef9c3 100%);border-radius:14px;position:relative;overflow:hidden">`
    html += `<span style="position:absolute;top:8px;left:16px;font-size:72px;line-height:1;color:${ctx.t.accent}30;font-family:Georgia,ser-serif">"</span>`
    html += `<p style="margin:0px;padding:0px 24px;font-size:18px;font-style:italic;color:#1e293b;line-height:1.7;letter-spacing:0.4px;position:relative;z-index:1;text-align:center">${esc(text)}</p>`
    if (source) {
      html += `<p style="margin:16px 0px 0px;text-align:right;font-size:13px;color:#94a3b8;letter-spacing:0.5px">— ${esc(source)}</p>`
    }
    html += `</section>`
    return { html, next: j + 1 }
  },
}

export const quoteCardModule: LayoutModule = {
  spec: { name: 'quote-card', category: 'sprint4', serves: ['memorability'], bodyFormat: 'json_object', label: '金句卡' },
  renderer: quoteCardRenderer,
}
