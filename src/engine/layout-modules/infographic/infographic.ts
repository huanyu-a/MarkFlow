/**
 * infographic — 单帧信息图
 * body_format: fields
 *   type: data|quote|fact
 *   title: 主标题（官方示例用法）
 *   subtitle: 副标题
 *   body: 事实列表（YAML 块标量，每行一条，逐行渲染为 accent 标记的事实条目）
 *   value: 主内容（旧用法：大字数值/引用/事实正文）
 *   label: 副文字 / 来源 / 眉标
 *   note: 补充说明
 *
 * 版式：
 *   data（默认）— label 眉标 + title 大字 + subtitle，body 逐行渲染为事实列表；
 *                 兼容旧用法（value 大字数值 + note）
 *   quote — 引用样式（左侧 accent 边框 + 浅色背景 + 文字）
 *   fact  — 圆角卡片 + 📌 图标 + 文字
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule, LayoutModuleSpec } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const type = (f.type || 'data').toLowerCase()
  const accent = ctx.t.accent
  const light = ctx.t.light
  const value = f.value ?? ''
  const label = f.label ?? ''
  const note = f.note ?? ''
  // body 块标量逐行事实（官方示例用法）
  const bodyLines = (f.body ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

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

  // data（默认）：label 眉标 + title/subtitle 头部 + value 大字（旧用法）+ body 事实列表
  let html = `<section style="margin:0px 0px 28px;padding:30px 20px;background:linear-gradient(135deg,${light} 0%,#ffffff 100%);border-radius:14px;border:1px solid ${accent}22;text-align:center">`
  if (label) html += `<p style="margin:0px 0px 6px;font-size:11px;letter-spacing:2.4px;font-weight:700;color:${accent};text-transform:uppercase;line-height:1.4">${esc(label)}</p>`
  if (f.title) html += `<p style="margin:0px 0px 8px;font-size:24px;font-weight:900;color:#1a1a1a;line-height:1.3;letter-spacing:-0.5px">${esc(f.title)}</p>`
  if (f.subtitle) html += `<p style="margin:0px;font-size:14px;color:#64748b;line-height:1.7;letter-spacing:0.3px">${esc(f.subtitle)}</p>`
  // 旧用法兼容：value 大字数值（与 label 眉标组合）
  if (value) html += `<p style="margin:${f.title ? '14px' : '0px'} 0px 0px;font-size:36px;font-weight:900;color:${accent};line-height:1.15;letter-spacing:-1px">${esc(value)}</p>`
  // body 事实列表：每行一条，accent 标记 + 文本
  if (bodyLines.length > 0) {
    html += `<section style="margin:16px 0px 0px;text-align:left;display:flex;flex-direction:column;gap:8px">`
    bodyLines.forEach((line) => {
      html += `<section style="display:flex;align-items:flex-start;gap:10px">`
      html += `<span style="flex-shrink:0;margin-top:8px;width:6px;height:6px;border-radius:50%;background:${accent}"></span>`
      html += `<p style="margin:0px;font-size:14px;color:#334155;line-height:1.7;letter-spacing:0.3px">${esc(line)}</p>`
      html += `</section>`
    })
    html += `</section>`
  }
  if (note) html += `<p style="margin:12px 0px 0px;font-size:13px;color:#64748b;line-height:1.6">${esc(note)}</p>`
  html += `</section>`
  return html
}

// spec 单一来源：buildModuleRenderer 消费的就是这份对象（含 consumedFields 告警）
const spec: LayoutModuleSpec = {
  name: 'infographic',
  category: 'infographic',
  serves: ['attention'],
  bodyFormat: 'fields',
  label: '信息图',
  consumedFields: ['type', 'title', 'subtitle', 'body', 'value', 'label', 'note'],
}

export const infographicModule: LayoutModule = {
  spec,
  renderer: buildModuleRenderer(spec, render),
}
