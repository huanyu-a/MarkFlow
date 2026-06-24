/**
 * Table_DA01 - 表格组件（默认A型01号样式）
 *
 * 使用标准 Markdown 表格语法，支持 default / striped / card 三种风格。
 *
 * Markdown 语法：
 *   | 列1   | 列2   | 列3   |
 *   |-------|-------|-------|
 *   | 数据1 | 数据2 | 数据3 |
 *   | 数据4 | 数据5 | 数据6 |
 *
 * 也支持 ::: table 容器包裹（可选标题）：
 *   ::: table 项目进度表
 *   | 任务 | 负责人 | 状态 |
 *   |------|--------|------|
 *   | 需求 | 张三   | 完成 |
 *   :::
 *
 * 属性：
 *   style - 表格风格：default / striped / card
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import { fontSize, fontWeight, neutral, radius, spacing } from '@engine/tokens'
import { esc } from '@engine/utils/helpers'
import { inlineFormat } from '@engine/utils/inlineFormat'

function parseRow(rowStr: string): string[] {
  let s = rowStr.trim()
  if (s.startsWith('|')) s = s.substring(1)
  if (s.endsWith('|')) s = s.substring(0, s.length - 1)
  return s.split('|').map((x) => x.trim())
}

function renderTable(attrs: Record<string, string>, body: string, t: ThemeColors): string {
  const tableStyle = attrs.style || 'default'

  // 解析 body
  const lines = body.trim().split('\n')
  let caption = ''
  let footer = ''
  let rowStart = 0

  // 提取 ::: table 标题
  const containerMatch = lines[0]?.match(/^:{3,4}\s*table\b\s*(.*)/)
  if (containerMatch) {
    caption = containerMatch[1]?.trim() || ''
    rowStart = 1
  } else if (lines[0] && !lines[0].includes('|')) {
    caption = lines[0].trim()
    rowStart = 1
  }

  // 收集表格行和底部注释
  const tableLines: string[] = []
  for (let i = rowStart; i < lines.length; i++) {
    const ln = lines[i].trim()
    // 跳过 ::: 结束标记
    if (/^:{3,4}\s*$/.test(ln)) continue
    if (ln.includes('|')) {
      if (/^[\|\s\-:]+$/.test(ln)) continue
      tableLines.push(ln)
    } else if (ln && tableLines.length >= 2) {
      // 表格之后的内容作为 footer
      footer = ln
      break
    }
  }

  if (tableLines.length < 2) return `<p style="color:#999">表格至少需要表头行和一行数据</p>`

  const headers = parseRow(tableLines[0])
  const rows = tableLines.slice(1).map(parseRow)
  const colCount = Math.max(headers.length, ...rows.map((r) => r.length), 2)

  const isStriped = tableStyle === 'striped'
  const isCard = tableStyle === 'card'

  let html = ''

  // Caption — 居中显示
  if (caption) {
    html += `<section style="margin-bottom:${spacing[3]};padding:${spacing[3]} 0;text-align:center"><span style="display:inline-flex;align-items:center;gap:6px;font-size:${fontSize.sm};font-weight:${fontWeight.semibold};color:${t.accent}"><span style="display:inline-block;width:3px;height:14px;border-radius:2px;background:${t.accent}"></span>${esc(caption)}</span></section>`
  }

  // 容器 — 卡片阴影
  const shadow = isCard ? `box-shadow:0 4px 16px rgba(0,0,0,0.08),0 1px 4px rgba(0,0,0,0.04)` : `box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)`
  html += `<section style="margin:${spacing[7]} 0px;background:#fff;border-radius:${radius['2xl']};overflow:hidden;${shadow}">`
  html += `<section style="overflow-x:auto"><table style="border-collapse:collapse;width:100%">`

  // 表头 — 纯色 accent 背景
  html += `<thead><tr>`
  headers.forEach((h, hi) => {
    const isFirst = hi === 0
    const isLast = hi === headers.length - 1
    html += `<th style="vertical-align:top;padding:13px ${spacing[6]};text-align:left;font-size:13px;font-weight:${fontWeight.semibold};color:#fff;background:${t.accent};${isFirst ? `border-radius:${radius['2xl']} 0 0 0` : ''}${isLast ? `border-radius:0 ${radius['2xl']} 0 0` : ''};letter-spacing:0.3px">${inlineFormat(h, t) || '&nbsp;'}</th>`
  })
  for (let k = headers.length; k < colCount; k++) {
    html += `<th style="vertical-align:top;padding:13px ${spacing[6]};text-align:left;font-size:13px;font-weight:${fontWeight.semibold};color:#fff;background:${t.accent};border-radius:0 ${radius['2xl']} 0 0;letter-spacing:0.3px">&nbsp;</th>`
  }
  html += `</tr></thead>`

  // 表体 — 斑马纹
  html += `<tbody>`
  rows.forEach((row, ri) => {
    const isLastRow = ri === rows.length - 1
    html += `<tr>`
    row.forEach((cell, ci) => {
      const isFirst = ci === 0
      const isLast = ci === row.length - 1
      const isLastCell = isLastRow && isLast
      const isFirstCell = isLastRow && isFirst
      const borderStyle = isLastRow && !footer ? 'border-bottom:none' : `border-bottom:1px solid ${neutral.gray100}`
      const radiusStyle = isFirstCell && !footer ? `border-radius:0 0 0 ${radius['2xl']}` : isLastCell && !footer ? `border-radius:0 0 ${radius['2xl']} 0` : ''
      const bgStyle = isStriped && ri % 2 === 1 ? `background:${neutral.gray50}` : 'background:#fff'
      html += `<td style="vertical-align:top;padding:11px ${spacing[6]};text-align:left;font-size:13px;color:#475569;${borderStyle};${radiusStyle};${bgStyle}">${inlineFormat(cell, t) || '&nbsp;'}</td>`
    })
    for (let k = row.length; k < colCount; k++) {
      html += `<td style="vertical-align:top;padding:11px ${spacing[6]};text-align:left;font-size:13px;color:#475569;${isLastRow && !footer ? 'border-bottom:none' : `border-bottom:1px solid ${neutral.gray100}`}">&nbsp;</td>`
    }
    html += `</tr>`
  })
  html += `</tbody>`

  // Footer — 表格底部注释
  if (footer) {
    html += `<tfoot><tr><td colspan="${colCount}" style="padding:9px ${spacing[6]};text-align:center;font-size:11px;color:#94a3b8;background:linear-gradient(180deg,${neutral.gray50} 0%,#f1f5f9 100%);border-top:1px solid ${neutral.gray200};border-radius:0 0 ${radius['2xl']} ${radius['2xl']}">${esc(footer)}</td></tr></tfoot>`
  }

  html += `</table></section></section>`
  return html
}

export const Table_DA01 = {
  id: 'Table_DA01',
  name: '表格',
  tag: 'table',
  description: 'Markdown 表格，支持 default / striped / card 三种风格',
  attrs: [
    { key: 'style', label: '表格风格', required: false, default: 'default', options: ['default', 'striped', 'card'] },
  ],
  example: `::: table style=card 项目进度表
| 任务名称 | 负责人 | 状态 | 截止日期 |
|----------|--------|------|----------|
| 需求分析 | 张三 | 已完成 | 2024-01-15 |
| UI 设计 | 李四 | 进行中 | 2024-02-01 |
| 后端开发 | 王五 | 未开始 | 2024-03-10 |
| 测试验收 | 赵六 | 未开始 | 2024-03-31 |
:::
数据截止至 2024-03-31`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    return renderTable(attrs, body, t)
  },
}
