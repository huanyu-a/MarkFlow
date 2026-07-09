/**
 * changelog — 版本日志
 * :::changelog
 * {"version":"v2.3.1","date":"2026-05-28","added":["feat1"],"changed":["change1"],"fixed":["fix1"]}
 * :::
 *
 * 顶部 version（标签样式）+ 日期，下方 added/changed/fixed 各自带彩色标签列表（绿/橙/红）。
 */
import type { BlockRenderer } from '../../utils/blockRenderRegistry'
import { esc } from '../buildRenderer'
import { parseJsonObject } from '../parse'
import type { LayoutModule } from '../types'

const CHANGELOG_SECTIONS = [
  { key: 'added', label: '新增', bg: '#f0fdf4', fg: '#16a34a', tagBg: '#dcfce7' },
  { key: 'changed', label: '变更', bg: '#fff7ed', fg: '#ea580c', tagBg: '#ffedd5' },
  { key: 'fixed', label: '修复', bg: '#fef2f2', fg: '#dc2626', tagBg: '#fee2e2' },
] as const

const changelogRenderer: BlockRenderer = {
  name: 'layout-changelog',
  priority: 6,
  match: (line) => /^:::\s*changelog\b/.test(line),
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
    const version = String(data.version ?? '')
    const date = String(data.date ?? '')
    let html = `<section style="margin:16px 0px;padding:20px;background:#fff;border:1px solid #e2e8f0;border-radius:12px">`
    // 顶部：version 标签 + 日期
    html += `<section style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #f1f5f9">`
    html += `<section style="display:flex;align-items:center;gap:10px">`
    if (version) {
      html += `<span style="display:inline-block;padding:4px 12px;background:${ctx.t.accent};color:#fff;font-size:14px;font-weight:700;border-radius:6px;letter-spacing:0.5px">${esc(version)}</span>`
    }
    html += `</section>`
    if (date) {
      html += `<p style="margin:0px;font-size:13px;color:#94a3b8">${esc(date)}</p>`
    }
    html += `</section>`
    // added / changed / fixed 列表
    for (const sec of CHANGELOG_SECTIONS) {
      const items = Array.isArray(data[sec.key]) ? (data[sec.key] as unknown[]).map(String) : []
      if (items.length === 0) continue
      html += `<section style="margin-bottom:14px">`
      html += `<p style="margin:0px 0px 8px;font-size:13px;font-weight:700;color:${sec.fg};display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:4px;height:14px;border-radius:2px;background:${sec.fg}"></span>${esc(sec.label)}</p>`
      html += `<section style="display:flex;flex-wrap:wrap;gap:6px">`
      items.forEach((item) => {
        html += `<span style="display:inline-block;padding:4px 10px;background:${sec.tagBg};color:${sec.fg};font-size:13px;font-weight:500;border-radius:5px;line-height:1.5">${esc(item)}</span>`
      })
      html += `</section></section>`
    }
    html += `</section>`
    return { html, next: j + 1 }
  },
}

export const changelogModule: LayoutModule = {
  spec: { name: 'changelog', category: 'sprint4', serves: ['readability'], bodyFormat: 'json_object', label: '版本日志' },
  renderer: changelogRenderer,
}
