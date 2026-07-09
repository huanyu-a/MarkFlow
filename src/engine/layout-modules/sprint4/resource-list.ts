/**
 * resource-list — 资源/链接列表
 * :::resource-list
 * [{"icon":"🛠","name":"工具名","url":"https://...","desc":"描述"}]
 * :::
 *
 * icon + name（加粗，accent 色可点击链接）+ desc。
 */
import type { BlockRenderer } from '../../utils/blockRenderRegistry'
import { esc } from '../buildRenderer'
import { parseJsonArray } from '../parse'
import type { LayoutModule } from '../types'

const resourceListRenderer: BlockRenderer = {
  name: 'layout-resource-list',
  priority: 6,
  match: (line) => /^:::\s*resource-list\b/.test(line),
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
      const icon = String(item.icon ?? '')
      const name = String(item.name ?? '')
      const url = String(item.url ?? '')
      const desc = String(item.desc ?? '')
      html += `<section style="padding:14px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;display:flex;align-items:flex-start;gap:12px">`
      if (icon) {
        html += `<span style="font-size:22px;flex-shrink:0;margin-top:2px">${esc(icon)}</span>`
      }
      html += `<section style="flex:1;min-width:0">`
      if (name) {
        if (url) {
          html += `<p style="margin:0px 0px 4px;font-size:15px;font-weight:700"><a href="${esc(url)}" style="color:${ctx.t.accent};text-decoration:none" target="_blank" rel="noopener noreferrer">${esc(name)}</a></p>`
        } else {
          html += `<p style="margin:0px 0px 4px;font-size:15px;font-weight:700;color:#1e293b">${esc(name)}</p>`
        }
      }
      if (desc) {
        html += `<p style="margin:0px;font-size:13px;color:#64748b;line-height:1.6">${esc(desc)}</p>`
      }
      html += `</section>`
      html += `</section>`
    })
    html += `</section>`
    return { html, next: j + 1 }
  },
}

export const resourceListModule: LayoutModule = {
  spec: { name: 'resource-list', category: 'sprint4', serves: ['conversion'], bodyFormat: 'json_array', label: '资源列表' },
  renderer: resourceListRenderer,
}
