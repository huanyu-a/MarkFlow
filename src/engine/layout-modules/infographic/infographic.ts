/**
 * infographic — 单帧信息图
 * body_format: fields
 *   type: data|quote|fact
 *   value: 主内容
 *   label: 副文字 / 来源
 *   note: 补充说明
 *
 * 三种版式：
 *   data  — 居中大字数值（36px accent）+ 下方 label
 *   quote — 引用样式（左侧 accent 边框 + 浅色背景 + 文字）
 *   fact  — 圆角卡片 + 📌 图标 + 文字
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const type = (f.type || 'data').toLowerCase()
  const accent = ctx.t.accent
  const light = ctx.t.light
  const value = f.value ?? ''
  const label = f.label ?? ''
  const note = f.note ?? ''

  if (type === 'quote') {
    let html = `<section style="margin:0px 0px 28px;padding:22px 20px;background:${light};border-left:4px solid ${accent};border-radius:0px 14px 14px 0px;position:relative;overflow:hidden">`
    if (value) html += `<p style="margin:0px 0px 10px;font-size:17px;font-weight:700;color:#1a1a1a;line-height:1.6;letter-spacing:-0.2px">${esc(value)}</p>`
    if (label) html += `<p style="margin:0px;font-size:12px;color:#64748b;line-height:1.5;letter-spacing:0.3px">— ${esc(label)}</p>`
    html += `</section>`
    return html
  }

  if (type === 'fact') {
    let html = `<section style="margin:0px 0px 28px;padding:22px 20px;background:#fffbe6;border-radius:14px;border:1px solid #fde68a;position:relative;overflow:hidden">`
    if (value) html += `<p style="margin:0px 0px 8px;font-size:16px;font-weight:700;color:#1a1a1a;line-height:1.6"><span style="margin-right:8px">📌</span>${esc(value)}</p>`
    if (note) html += `<p style="margin:0px;font-size:13px;color:#92400e;line-height:1.6">${esc(note)}</p>`
    html += `</section>`
    return html
  }

  // data（默认）
  let html = `<section style="margin:0px 0px 28px;padding:30px 20px;background:linear-gradient(135deg,${light} 0%,#ffffff 100%);border-radius:14px;border:1px solid ${accent}22;text-align:center">`
  if (label) html += `<p style="margin:0px 0px 6px;font-size:11px;letter-spacing:2.4px;font-weight:700;color:${accent};text-transform:uppercase;line-height:1.4">${esc(label)}</p>`
  if (value) html += `<p style="margin:0px;font-size:36px;font-weight:900;color:${accent};line-height:1.15;letter-spacing:-1px">${esc(value)}</p>`
  if (note) html += `<p style="margin:12px 0px 0px;font-size:13px;color:#64748b;line-height:1.6">${esc(note)}</p>`
  html += `</section>`
  return html
}

export const infographicModule: LayoutModule = {
  spec: { name: 'infographic', category: 'infographic', serves: ['attention'], bodyFormat: 'fields', label: '信息图' },
  renderer: buildModuleRenderer(
    { name: 'infographic', category: 'infographic', serves: ['attention'], bodyFormat: 'fields', label: '信息图' },
    render,
  ),
}
