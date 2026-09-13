/**
 * audience-fit — 受众匹配
 * body_format: rows
 *   fit|not-fit | 受众名称 | 描述（推荐，受众名加粗）
 *   fit|not-fit | 描述（兼容，仅有描述列时直接渲染描述）
 *   受众名称 | 描述 | 高|中|低（旧格式兜底：首列即受众名，末列匹配度映射 ✓/●/✗，可省略）
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

/** 三档匹配度的视觉配置：✓ 主题色 / ● 琥珀中性 / ✗ 红 */
const LEVEL_STYLE = {
  high: { icon: '✓', color: '', bg: '12', border: '44' },
  mid: { icon: '●', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  low: { icon: '✗', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
} as const

type Level = keyof typeof LEVEL_STYLE

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const rows = body.rows
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px;display:flex;flex-direction:column;gap:10px">`
  rows.forEach((row) => {
    const cells = row.map((c) => c.trim()).filter(Boolean)
    const first = (cells[0] ?? '').toLowerCase()
    const keyword = first === 'fit' || first === 'not-fit' ? first : null
    let level: Level
    let name = ''
    let desc = ''
    if (keyword) {
      // 协议行：fit|not-fit | 受众名（可选）| 描述
      level = keyword === 'fit' ? 'high' : 'low'
      const rest = cells.slice(1)
      name = rest.length >= 2 ? rest[0] : ''
      desc = rest.length >= 2 ? rest.slice(1).join('：') : rest.join('')
    } else {
      // 旧格式兜底：首列即受众名；末列为 高/中/低 时作为匹配度，否则按中性档处理
      const last = cells[cells.length - 1] ?? ''
      if (cells.length >= 3 && (last === '高' || last === '中' || last === '低')) {
        level = last === '高' ? 'high' : last === '中' ? 'mid' : 'low'
        name = cells[0]
        desc = cells.slice(1, -1).join('：')
      } else if (cells.length >= 2) {
        level = 'mid'
        name = cells[0]
        desc = cells.slice(1).join('：')
      } else {
        level = 'mid'
        desc = cells.join('')
      }
    }
    const style = LEVEL_STYLE[level]
    const iconColor = level === 'high' ? accent : style.color
    const iconBg = level === 'high' ? `${accent}12` : style.bg
    const borderColor = level === 'high' ? `${accent}44` : style.border
    html += `<section style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:${iconBg};border:1px solid ${borderColor};border-radius:12px">`
    html += `<span style="flex-shrink:0;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;color:${iconColor};font-size:14px;font-weight:900;border:1.5px solid ${iconColor}">${style.icon}</span>`
    html += `<p style="margin:0px;font-size:14px;color:#334155;line-height:1.7;letter-spacing:0.3px">${name ? `<span style="font-weight:800;color:#1a1a1a">${esc(name)}</span>　` : ''}${esc(desc)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const audienceFitModule: LayoutModule = {
  spec: { name: 'audience-fit', category: 'judgment', serves: ['readability'], bodyFormat: 'rows', label: '受众匹配' },
  renderer: buildModuleRenderer(
    { name: 'audience-fit', category: 'judgment', serves: ['readability'], bodyFormat: 'rows', label: '受众匹配' },
    render,
  ),
}
