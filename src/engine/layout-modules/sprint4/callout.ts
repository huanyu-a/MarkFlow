/**
 * callout — 提示框（5 种样式）
 * :::callout info|tip|warning|success|danger
 *
 * 复用现有 hintContainerRenderer 的色彩体系，但通过 :::callout 语法呼出。
 * 与 > [!NOTE] 形式的 calloutRenderer 并存。
 */
import type { BlockRenderer, BlockRenderContext } from '../../utils/blockRenderRegistry'
import { inlineFormat } from '../../utils/inlineFormat'
import type { LayoutModule } from '../types'

const CALLOUT_TYPES = ['info', 'tip', 'warning', 'success', 'danger'] as const
type CalloutType = (typeof CALLOUT_TYPES)[number]

const icons: Record<CalloutType, string> = { info: 'ℹ️', tip: '💡', warning: '⚠️', success: '✅', danger: '❌' }
const bgs: Record<CalloutType, string> = { info: '#f0f9ff', tip: '#f0fdf4', warning: '#fffbea', success: '#f0fdf4', danger: '#fef2f2' }
const accents: Record<CalloutType, string> = { info: '#0ea5e9', tip: '#16a34a', warning: '#ea580c', success: '#16a34a', danger: '#dc2626' }
const titles: Record<CalloutType, string> = { info: '信息', tip: '提示', warning: '警告', success: '成功', danger: '危险' }

function render(ctx: BlockRenderContext, type: CalloutType, body: string): string {
  const bg = bgs[type]
  const accent = accents[type]
  const icon = icons[type]
  const title = titles[type]
  let html = `<section style="margin:16px 0px;padding:16px 18px;background:${bg};border-left:4px solid ${accent};border-radius:0px 10px 10px 0px">`
  html += `<p style="margin:0px 0px 6px;font-size:15px;font-weight:700;color:${accent}">${icon} ${title}</p>`
  if (body.trim()) {
    html += `<section style="font-size:15px;color:#475569;line-height:1.8;letter-spacing:0.5px;text-align:justify">${inlineFormat(body.trim(), ctx.t)}</section>`
  }
  html += `</section>`
  return html
}

const calloutRenderer: BlockRenderer = {
  name: 'layout-callout',
  priority: 6,
  match: (line) => new RegExp(`^:::\\s*callout\\s*(${CALLOUT_TYPES.join('|')})\\b`).test(line),
  render: (ctx, line, lines, i) => {
    const m = line.match(/^:::\s*callout\s*(info|tip|warning|success|danger)\b\s*(.*)/)
    if (!m) return null
    const type = m[1] as CalloutType
    // 收集跨行 body，直到独立行 :::
    const bodyLines: string[] = []
    let j = i + 1
    while (j < lines.length && !/^:::\s*$/.test(lines[j])) {
      bodyLines.push(lines[j])
      j++
    }
    if (j >= lines.length) return null
    const body = bodyLines.join('\n').trim()
    return { html: render(ctx, type, body), next: j + 1 }
  },
}

export const calloutModule: LayoutModule = {
  spec: { name: 'callout', category: 'sprint4', serves: ['readability'], bodyFormat: 'markdown', label: '提示框' },
  renderer: calloutRenderer,
}
