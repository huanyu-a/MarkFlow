/**
 * stat-row — 横向数据指标行
 * :::stat-row
 * [{"label":"完读率","value":"79%"},{"label":"时间","value":"35","unit":"分钟"}]
 * :::
 *
 * grid 排列，每项 label 小字 + value 大字（accent 色）+ unit。
 */
import type { BlockRenderer } from '../../utils/blockRenderRegistry'
import { esc } from '../buildRenderer'
import { parseJsonArray } from '../parse'
import type { LayoutModule } from '../types'

const statRowRenderer: BlockRenderer = {
  name: 'layout-stat-row',
  priority: 6,
  match: (line) => /^:::\s*stat-row\b/.test(line),
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
    const colCount = items.length
    let html = `<section style="margin:16px 0px;padding:20px;background:#fff;border:1px solid #e2e8f0;border-radius:12px">`
    html += `<section style="display:grid;grid-template-columns:repeat(${colCount},1fr);gap:16px">`
    items.forEach((item) => {
      const label = String(item.label ?? '')
      const value = String(item.value ?? '')
      const unit = String(item.unit ?? '')
      html += `<section style="text-align:center">`
      if (label) {
        html += `<p style="margin:0px 0px 4px;font-size:12px;color:#94a3b8;letter-spacing:0.5px">${esc(label)}</p>`
      }
      html += `<p style="margin:0px;font-size:26px;font-weight:800;color:${ctx.t.accent};line-height:1.2">${esc(value)}`
      if (unit) {
        html += `<span style="font-size:14px;font-weight:600;color:#64748b;margin-left:2px">${esc(unit)}</span>`
      }
      html += `</p>`
      html += `</section>`
    })
    html += `</section></section>`
    return { html, next: j + 1 }
  },
}

export const statRowModule: LayoutModule = {
  spec: { name: 'stat-row', category: 'sprint4', serves: ['attention'], bodyFormat: 'json_array', label: '数据指标行' },
  renderer: statRowRenderer,
}
