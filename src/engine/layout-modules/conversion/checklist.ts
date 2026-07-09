/**
 * checklist — 任务清单
 * body_format: rows
 *   描述 | 状态(done|todo|na)
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, _ctx: BlockRenderContext): string {
  const rows = body.rows
  let html = `<section style="margin:0px 0px 28px;padding:20px 22px;background:#fff;border:1px solid #e2e8f0;border-radius:14px">`
  rows.forEach((row) => {
    const last = row[row.length - 1]?.toLowerCase() ?? ''
    const isStatus = last === 'done' || last === 'todo' || last === 'na'
    const status = isStatus ? last : 'todo'
    const desc = isStatus ? (row[0] ?? '') : (row[0] ?? '')
    let checkSymbol: string
    let checkColor: string
    let descColor: string
    let decoration: string
    if (status === 'done') {
      checkSymbol = '✓'
      checkColor = '#16a34a'
      descColor = '#94a3b8'
      decoration = 'line-through'
    } else if (status === 'na') {
      checkSymbol = '—'
      checkColor = '#94a3b8'
      descColor = '#94a3b8'
      decoration = 'none'
    } else {
      checkSymbol = ''
      checkColor = '#cbd5e1'
      descColor = '#1a1a1a'
      decoration = 'none'
    }
    html += `<section style="display:flex;align-items:center;gap:12px;padding:10px 0px${status === 'na' ? '' : ''};border-bottom:1px solid #f1f5f9">`
    if (status === 'todo') {
      html += `<span style="flex-shrink:0;width:20px;height:20px;border-radius:6px;border:2px solid ${checkColor};background:#fff"></span>`
    } else {
      html += `<span style="flex-shrink:0;width:20px;height:20px;border-radius:6px;background:${status === 'done' ? '#dcfce7' : '#f1f5f9'};color:${checkColor};font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1">${checkSymbol}</span>`
    }
    html += `<p style="margin:0px;font-size:15px;color:${descColor};line-height:1.5;text-decoration:${decoration}">${esc(desc)}</p>`
    html += `</section>`
  })
  html += `</section>`
  return html
}

export const checklistModule: LayoutModule = {
  spec: { name: 'checklist', category: 'conversion', serves: ['conversion'], bodyFormat: 'rows', label: '任务清单' },
  renderer: buildModuleRenderer(
    { name: 'checklist', category: 'conversion', serves: ['conversion'], bodyFormat: 'rows', label: '任务清单' },
    render,
  ),
}
