/**
 * image-annotate — 图片标注
 * body_format: fields + rows 混合
 *   fields: src, title, note（或 body，作为说明文字的别名）
 *   rows:   序号 | x坐标(0-100) | y坐标(0-100) | 标签 | 说明
 *
 * 解析策略：fields 行（key: value）由 parseFields 消费；
 * 其余含 | 的行按 rows 解析为标注点。混合解析在 renderFn 内完成
 * （bodyFormat 声明为 fields，rows 从 raw 中自行提取，改动面最小）。
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc, moduleTitle } from '../buildRenderer'
import { parseRows } from '../parse'
import type { LayoutModule, LayoutModuleSpec } from '../types'

/** 从混合 body 原文中提取标注行（跳过 key: value 字段行，收集含 | 的行） */
function extractAnnotateRows(raw: string): string[][] {
  const rowLines = raw
    .split('\n')
    .filter((l) => l.trim() && !/^[A-Za-z_][\w-]*\s*:/.test(l.trim()))
  return parseRows(rowLines.join('\n'))
}

function render(body: LayoutBody, ctx: BlockRenderContext, raw: string): string {
  const f = body.fields
  const rows = extractAnnotateRows(raw)
  const accent = ctx.t.accent
  let html = `<section style="margin:0px 0px 28px">`
  if (f.title) html += moduleTitle(esc(f.title), { color: '#1a1a1a', size: '18px', weight: '800' })
  if (f.src) {
    html += `<section style="position:relative;display:inline-block;max-width:100%;margin:0px 0px 12px;border-radius:12px;overflow:hidden">`
    html += `<img src="${esc(f.src)}" alt="${esc(f.title || '')}" style="max-width:100%;display:block;border-radius:12px">`
    rows.forEach((row, idx) => {
      const num = row[0] ?? `${idx + 1}`
      const x = row[1] ?? '50'
      const y = row[2] ?? '50'
      const label = row[3] ?? ''
      const desc = row[4] ?? ''
      const posX = Math.max(0, Math.min(100, parseFloat(x) || 0))
      const posY = Math.max(0, Math.min(100, parseFloat(y) || 0))
      const display = label || num
      html += `<span style="position:absolute;left:${posX}%;top:${posY}%;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;background:${accent};color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px ${accent}44;line-height:1" title="${esc(desc)}">${esc(display)}</span>`
    })
    html += `</section>`
  }
  // 标注说明列表
  if (rows.length > 0) {
    html += `<section style="display:flex;flex-direction:column;gap:8px">`
    rows.forEach((row, idx) => {
      const num = row[0] ?? `${idx + 1}`
      const label = row[3] ?? ''
      const desc = row[4] ?? ''
      const display = label || num
      html += `<section style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px;background:#f8fafc;border-radius:10px">`
      html += `<span style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:${accent}15;color:${accent};font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1">${esc(num)}</span>`
      html += `<section style="flex:1;min-width:0;overflow-wrap:anywhere">`
      html += `<p style="margin:0px;font-size:14px;font-weight:700;color:#1a1a1a;line-height:1.4">${esc(display)}</p>`
      if (desc) html += `<p style="margin:4px 0px 0px;font-size:13px;color:#64748b;line-height:1.6">${esc(desc)}</p>`
      html += `</section>`
      html += `</section>`
    })
    html += `</section>`
  }
  const noteText = f.note ?? f.body
  if (noteText) {
    html += `<p style="margin:12px 0px 0px;font-size:13px;color:#94a3b8;line-height:1.6;font-style:italic">${esc(noteText)}</p>`
  }
  html += `</section>`
  return html
}

// spec 单一来源：buildModuleRenderer 消费的就是这份对象（含 consumedFields 告警；
// rows 标注行不是 key: value 字段，不会误报）
const spec: LayoutModuleSpec = {
  name: 'image-annotate',
  category: 'evidence',
  serves: ['readability'],
  bodyFormat: 'fields',
  label: '图片标注',
  consumedFields: ['src', 'title', 'note', 'body'],
}

export const imageAnnotateModule: LayoutModule = {
  spec,
  renderer: buildModuleRenderer(spec, render),
}
