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
 *   style   - 表格风格：default / striped / card
 *   title   - 标题（caption 的别名，优先级最高）
 *   caption - 标题（title 的等价写法）
 *   footer  - 表注脚（覆盖容器闭合后紧邻行的隐式注脚）
 *
 * 标题优先级：title > caption > 容器位置参数（::: table 后面的文字）/ body 首行
 * 表注脚优先级：footer > 容器闭合后紧邻行 / body 表格后的尾行
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import { fontSize, fontWeight, neutral, radius, spacing } from '@engine/tokens'
import { esc } from '@engine/utils/helpers'
import { inlineFormat } from '@engine/utils/inlineFormat'
import { buildUnifiedRenderer, type UnifiedComponentDef } from './unifiedRender'

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
  let positionCaption = ''
  let bodyFooter = ''
  let rowStart = 0

  // 提取 ::: table 标题（容器语法；容器渲染器已剥离头部，此处兜底 unified/preview 路径）
  const containerMatch = lines[0]?.match(/^:{3,4}\s*table\b\s*(.*)/)
  if (containerMatch) {
    positionCaption = containerMatch[1]?.trim() || ''
    rowStart = 1
  } else if (lines[0] && !lines[0].includes('|')) {
    positionCaption = lines[0].trim()
    rowStart = 1
  }

  // 收集表格行和底部注释
  const tableLines: string[] = []
  for (let i = rowStart; i < lines.length; i++) {
    const ln = lines[i].trim()
    // 跳过 ::: 结束标记
    if (/^:{3,4}\s*$/.test(ln)) continue
    if (ln.includes('|')) {
      if (/^[|\s\-:]+$/.test(ln)) continue
      tableLines.push(ln)
    } else if (ln && tableLines.length >= 2) {
      // 表格之后的内容作为 footer
      bodyFooter = ln
      break
    }
  }

  if (tableLines.length < 2) return `<p style="color:#999">表格至少需要表头行和一行数据</p>`

  // 标题：title 为 caption 的别名，优先级 title > caption > 位置参数/首行
  const caption = attrs.title || attrs.caption || positionCaption
  // 表注脚：footer 属性优先，其次 body 尾行（容器路径下由容器传入的紧邻行兜底）
  const footer = attrs.footer || bodyFooter

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

export const Table_DA01: UnifiedComponentDef = {
  spec: {
    name: 'table',
    label: '表格',
    bodyFormat: 'markdown',
    example: `:::table style="card" title="四种输出模式对比"
| 输出方式 | 适合场景 | 输出格式 | 特点 |
|----------|----------|----------|------|
| 复制富文本 | 公众号、知乎、语雀 | HTML 内联样式 | 保留完整排版，粘贴即用 |
| 导出长图 | 知识星球、社群传播 | PNG 长图 | 整篇内容一张图，方便转发 |
| A4 文档 | 正式报告、打印交付 | PDF | 自动分页，支持页码页眉 |
| 自由画布 | 网页 PPT、品牌页面 | HTML 源码 | 高度视觉化，可嵌入任意网页 |
:::
数据来源：MarkFlow 使用统计（2026 年 6 月）`,
    fields: [
      { name: 'style', required: false, description: '表格风格（default/striped/card）' },
      { name: 'title', required: false, description: '标题（caption 的别名，优先级高于 caption 与位置参数）' },
      { name: 'caption', required: false, description: '标题（与 title 等价；优先级低于 title、高于 :::table 后的位置文字）' },
      { name: 'footer', required: false, description: '表注脚（覆盖容器闭合后紧邻的非表格行）' },
    ],
  },

  render(attrs, _rawBody, body, t) {
    return renderTable(attrs, body.markdown, t)
  },

  renderLegacy(attrs, body, t) {
    return renderTable(attrs, body, t)
  },
}

export const tableRenderer = buildUnifiedRenderer(Table_DA01)
