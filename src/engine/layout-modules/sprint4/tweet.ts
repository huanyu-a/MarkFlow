/**
 * tweet — 推文卡片
 * :::tweet
 * {"name":"作者","handle":"@xxx","verified":true,"text":"内容","timestamp":"2026-01-01","likes":"1.2K","retweets":"586","replies":"127"}
 * :::
 *
 * 模仿 Twitter 卡片：头像圆形（首字母）+ name（verified 时带蓝V徽章）+ handle +
 * 文字 + 底部 meta 行（时间戳 + 回复/转推/点赞计数）。
 */
import type { BlockRenderer } from '../../utils/blockRenderRegistry'
import { esc } from '../buildRenderer'
import { parseJsonObject } from '../parse'
import type { LayoutModule } from '../types'
import { unclosedTagFallback } from '../../utils/helpers'

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
    if (j >= lines.length) {
      // 未闭合：只消费定界符行（转义段落），容器体各行交主循环逐行解析（正文不丢），
      // 并经 warning 通道上报——return null 会让 meta.warnings 链路无从感知降级
      const fb = unclosedTagFallback(lines[i], ":::tweet 容器未闭合，后续内容按普通文本解析")
      return { html: fb.html, next: i + 1, warning: fb.warning }
    }
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
    const verified = data.verified === true
    const text = String(data.text ?? '')
    const timestamp = String(data.timestamp ?? '')
    const likes = String(data.likes ?? '')
    const retweets = String(data.retweets ?? '')
    const replies = String(data.replies ?? '')
    const initial = name.charAt(0).toUpperCase() || '?'
    let html = `<section style="margin:16px 0px;padding:18px 20px;background:#fff;border:1px solid #e2e8f0;border-radius:14px">`
    html += `<section style="display:flex;align-items:center;gap:12px;margin-bottom:12px">`
    html += `<span style="width:42px;height:42px;border-radius:50%;background:${ctx.t.accent};display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#fff;flex-shrink:0">${esc(initial)}</span>`
    html += `<section style="flex:1;min-width:0">`
    html += `<p style="margin:0px;font-size:15px;font-weight:700;color:#1e293b;line-height:1.3">${esc(name)}${verified ? `<svg width="16" height="16" viewBox="0 0 24 24" style="display:inline-block;vertical-align:-2px;margin-left:4px"><path fill="#1d9bf0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>` : ''}</p>`
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
    if (likes || retweets || replies) {
      html += `<p style="margin:0px;font-size:13px;color:#64748b;display:flex;align-items:center;gap:12px">`
      if (replies) html += `<span style="display:flex;align-items:center;gap:4px"><span style="color:#94a3b8">💬</span> ${esc(replies)}</span>`
      if (retweets) html += `<span style="display:flex;align-items:center;gap:4px"><span style="color:#94a3b8">🔁</span> ${esc(retweets)}</span>`
      if (likes) html += `<span style="display:flex;align-items:center;gap:4px"><span style="color:#f43f5e">♥</span> ${esc(likes)}</span>`
      html += `</p>`
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
