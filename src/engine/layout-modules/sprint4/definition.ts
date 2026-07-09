/**
 * definition — 术语定义卡
 * :::definition
 * {"term":"OKR","def":"目标与关键结果","termLabel":"术语"}
 * :::
 *
 * 左侧 term（大字加粗）+ 右侧 def 说明。
 */
import type { BlockRenderer } from '../../utils/blockRenderRegistry'
import { esc } from '../buildRenderer'
import { parseJsonObject } from '../parse'
import type { LayoutModule } from '../types'

const definitionRenderer: BlockRenderer = {
  name: 'layout-definition',
  priority: 6,
  match: (line) => /^:::\s*definition\b/.test(line),
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
    const term = String(data.term ?? '')
    const def = String(data.def ?? '')
    const termLabel = String(data.termLabel ?? '')
    let html = `<section style="margin:16px 0px;display:flex;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">`
    html += `<section style="flex:0 0 160px;padding:18px 16px;background:${ctx.t.accent};display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px">`
    if (termLabel) {
      html += `<p style="margin:0px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,0.75)">${esc(termLabel)}</p>`
    }
    html += `<p style="margin:0px;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px">${esc(term)}</p>`
    html += `</section>`
    html += `<section style="flex:1;padding:18px 20px;background:#fff;display:flex;align-items:center">`
    html += `<p style="margin:0px;font-size:15px;color:#475569;line-height:1.75;letter-spacing:0.3px">${esc(def)}</p>`
    html += `</section>`
    html += `</section>`
    return { html, next: j + 1 }
  },
}

export const definitionModule: LayoutModule = {
  spec: { name: 'definition', category: 'sprint4', serves: ['readability'], bodyFormat: 'json_object', label: '术语定义卡' },
  renderer: definitionRenderer,
}
