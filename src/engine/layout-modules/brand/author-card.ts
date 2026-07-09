/**
 * author-card — 作者信息卡
 * body_format: fields
 *   name, bio, role, avatar, tags, note, link
 */
import type { BlockRenderContext } from '../../utils/blockRenderRegistry'
import type { LayoutBody } from '../buildRenderer'
import { buildModuleRenderer, esc } from '../buildRenderer'
import type { LayoutModule } from '../types'

function render(body: LayoutBody, ctx: BlockRenderContext): string {
  const f = body.fields
  const accent = ctx.t.accent
  const initial = esc((f.title || '?').charAt(0).toUpperCase())
  const avatarUrl = f.avatar?.trim()
  const tags = f.tags
    ? f.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []
  let html = `<section style="margin:0px 0px 28px;padding:24px;display:flex;gap:18px;align-items:flex-start;background:#fff;border:1px solid #e2e8f0;border-radius:16px">`
  // 左侧头像
  if (avatarUrl) {
    html += `<section style="flex-shrink:0;width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid ${accent}22"><img src="${esc(avatarUrl)}" alt="${esc(f.title || '')}" style="width:100%;height:100%;object-fit:cover;display:block"></section>`
  } else {
    html += `<section style="flex-shrink:0;width:64px;height:64px;border-radius:50%;background:${accent}15;border:2px solid ${accent}22;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:${accent}">${initial}</section>`
  }
  // 右侧信息
  html += `<section style="flex:1;min-width:0">`
  if (f.title) html += `<p style="margin:0px 0px 4px;font-size:18px;font-weight:800;color:${ctx.t.dark};line-height:1.3;letter-spacing:-0.3px">${esc(f.title)}</p>`
  if (f.role) html += `<p style="margin:0px 0px 8px;font-size:12px;font-weight:700;color:${accent};letter-spacing:1.2px;text-transform:uppercase">${esc(f.role)}</p>`
  if (f.bio) html += `<p style="margin:0px 0px 12px;font-size:14px;color:#64748b;line-height:1.7;letter-spacing:0.3px">${esc(f.bio)}</p>`
  if (tags.length > 0) {
    html += `<section style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:${f.note ? '12px' : '0px'}">`
    tags.forEach((tag) => {
      html += `<span style="display:inline-block;padding:3px 10px;font-size:11px;font-weight:600;color:${accent};border:1px solid ${accent}44;border-radius:999px;background:${accent}08">${esc(tag)}</span>`
    })
    html += `</section>`
  }
  if (f.note) html += `<p style="margin:0px;font-size:12px;color:#94a3b8;line-height:1.6;font-style:italic">${esc(f.note)}</p>`
  html += `</section>`
  html += `</section>`
  return html
}

export const authorCardModule: LayoutModule = {
  spec: { name: 'author-card', category: 'brand', serves: ['conversion'], bodyFormat: 'fields', label: '作者信息卡' },
  renderer: buildModuleRenderer(
    { name: 'author-card', category: 'brand', serves: ['conversion'], bodyFormat: 'fields', label: '作者信息卡' },
    render,
  ),
}
