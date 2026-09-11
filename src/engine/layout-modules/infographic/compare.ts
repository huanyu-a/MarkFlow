/**
 * compare — 双栏对比
 * body_format: rows
 *   维度 | A方描述 | B方描述 | 颜色(accent|default)
 *
 * 三列表格样式：左列维度加粗，中右两列对比。
 * accent 行右侧（B方）主题色高亮，无表格线，卡片背景区分。
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import { isAccentRow, rowContent, parseRows } from '../parse'
import type { LayoutModule, LayoutModuleSpec } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  const light = ctx.t.light
  let html = `<section style="margin:0px 0px 28px;display:flex;flex-direction:column;gap:12px">`
  rows.forEach((row) => {
    const cells = rowContent(row)
    const accentRow = isAccentRow(row)
    const dim = cells[0] ?? ''
    const aDesc = cells[1] ?? ''
    const bDesc = cells[2] ?? ''
    const borderColor = accentRow ? accent : '#e2e8f0'
    const rowBg = accentRow ? accent : '#ffffff'
    const dimColor = accentRow ? '#ffffff' : '#1a1a1a'
    const aColor = accentRow ? 'rgba(255,255,255,0.85)' : '#475569'
    const bColor = accentRow ? '#ffffff' : '#475569'
    const bBg = accentRow ? 'rgba(255,255,255,0.18)' : light
    html += `<section style="display:grid;grid-template-columns:120px 1fr 1fr;border:1px solid ${borderColor};border-radius:14px;overflow:hidden;background:${rowBg}">`
    html += `<p style="margin:0px;padding:14px 14px;font-size:13px;font-weight:800;color:${dimColor};border-right:1px solid ${borderColor};line-height:1.5">${esc(dim)}</p>`
    html += `<p style="margin:0px;padding:14px 14px;font-size:13px;color:${aColor};border-right:1px solid ${borderColor};line-height:1.6">${esc(aDesc)}</p>`
    html += `<p style="margin:0px;padding:14px 14px;font-size:13px;font-weight:${accentRow ? '700' : '400'};color:${bColor};background:${bBg};line-height:1.6">${esc(bDesc)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

// spec 单一来源：buildModuleRenderer 消费的就是这份对象（含 bodyWarning）
const spec: LayoutModuleSpec = {
  name: 'compare',
  category: 'infographic',
  serves: ['readability'],
  bodyFormat: 'rows',
  label: '双栏对比',
  bodyWarning(rawBody) {
    // 渲染只取前 3 个内容列（维度|A|B），末列非 accent/default 标记时会被当内容列：
    // 缺列（不足 3 列）或多余列（>3 列）的行都会静默丢内容，这里经 warning 通道上报
    const bad = parseRows(rawBody).filter((r) => {
      const cells = rowContent(r)
      return cells.length !== 3
    }).length
    if (bad === 0) return undefined
    return `compare 有 ${bad} 行列数不是「维度 | A方 | B方 | accent|default」，多余或缺少的列已被忽略`
  },
}

export const compareModule: LayoutModule = {
  spec,
  renderer: buildModuleRenderer(spec, render),
}
