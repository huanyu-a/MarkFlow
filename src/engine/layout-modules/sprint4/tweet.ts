/**
 * tweet — 推文卡片
 * :::tweet
 * {"name":"作者","handle":"@xxx","text":"内容","timestamp":"2026-01-01","likes":"1.2K"}
 * :::
 *
 * 模仿 Twitter 卡片：头像圆形（首字母）+ name + handle + 文字 + 底部 likes。
 */
import type { BlockRenderer } from '../../utils/blockRenderRegistry'
import { esc } from '../buildRenderer'
import { parseJsonObject } from '../parse'
import type { LayoutModule } from '../types'

const tweetRenderer: BlockRenderer = {
  name: 'layout-tweet',
  priority: 6,
  match: (line) => /^:::\s*tweet\b/.test(line),
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
    const name = String(data.name ?? '')
    const handle = String(data.handle ?? '')
    const text = String(data.text ?? '')
    const timestamp = String(data.timestamp ?? '')
    const likes = String(data.likes ?? '')
    const initial = name.charAt(0).toUpperCase() || '?'
    let html = `<section style="margin:16px 0px;padding:18px 20px;background:#fff;border:1px solid #e2e8f0;border-radius:14px">`
    html += `<section style="display:flex;align-items:center;gap:12px;margin-bottom:12px">`
    html += `<span style="width:42px;height:42px;border-radius:50%;background:${ctx.t.accent};display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#fff;flex-shrink:0">${esc(initial)}</span>`
    html += `<section style="flex:1;min-width:0">`
    html += `<p style="margin:0px;font-size:15px;font-weight:700;color:#1e293b;line-height:1.3">${esc(name)}</p>`
    if (handle) {
      html += `<p style="margin:2px 0px 0px;font-size:13px;color:#94a3b8">${esc(handle)}</p>`
    }
    html += `</section>`
    html += `</section>`
    if (text) {
      html += `<p style="margin:0px 0px 12px;font-size:15px;color:#334155;line-height:1.7;letter-spacing:0.2px">${esc(text)}</p>`
    }
    html += `<section style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid #f1f5f9">`
    if (timestamp) {
      html += `<p style="margin:0px;font-size:12px;color:#94a3b8">${esc(timestamp)}</p>`
    } else {
      html += `<span></span>`
    }
    if (likes) {
      html += `<p style="margin:0px;font-size:13px;color:#64748b;display:flex;align-items:center;gap:4px"><span style="color:#f43f5e">♥</span> ${esc(likes)}</p>`
    }
    html += `</section>`
    html += `</section>`
    return { html, next: j + 1 }
  },
}

export const tweetModule: LayoutModule = {
  spec: { name: 'tweet', category: 'sprint4', serves: ['memorability'], bodyFormat: 'json_object', label: '推文卡片' },
  renderer: tweetRenderer,
}
