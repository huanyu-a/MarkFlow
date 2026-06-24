/**
 * Callout 系列 - 块级提示/警告组件
 *
 * 支持两种 Markdown 引用块语法：
 *   > [TIP] 标题          （旧语法）
 *   > [!TIP] 标题         （GitHub Flavored Markdown 语法）
 *
 * 支持类型：NOTE / INFO / TIP / WARNING / CAUTION / IMPORTANT
 */
import { esc } from '@engine/utils/helpers'
import type { ThemeColors } from '@engine/composables/useTheme'
import { fontSize, fontWeight, letterSpacing, lineHeight, neutral, radius, spacing } from '@engine/tokens'
import type { ComponentDef } from '@engine/editor-components/index'

// ── 类型配置 ──
const CALLOUT_CONFIG: Record<string, { icon: string; bg: string; border: string; label: string }> = {
  NOTE:      { icon: '📝', bg: '#eff6ff', border: '#2563eb', label: '笔记' },
  INFO:      { icon: 'ℹ️',  bg: '#f0f9ff', border: '#0ea5e9', label: '信息' },
  TIP:       { icon: '💡', bg: '#f0fdf4', border: '#16a34a', label: '提示' },
  WARNING:   { icon: '⚠️', bg: '#fffbea', border: '#ea580c', label: '警告' },
  CAUTION:   { icon: '🚨', bg: '#fef2f2', border: '#dc2626', label: '严重' },
  IMPORTANT: { icon: '❗', bg: '#f5f3ff', border: '#7c3aed', label: '重要' },
}

// ── 通用 render ──
function calloutRender(attrs: Record<string, string>, body: string, _t: ThemeColors): string {
  let type = (attrs.type || 'TIP').toUpperCase()
  let title = attrs.title || ''
  let content = body

  // 支持 > [TYPE] 和 > [!TYPE] 两种语法
  const m = body.match(/^>\s*\[!?(TIP|NOTE|WARNING|CAUTION|IMPORTANT|INFO)\]\s*(.*)/im)
  if (m) {
    type = m[1].toUpperCase()
    title = title || m[2]
    const lines = body.split('\n')
    const contentLines: string[] = []
    for (const line of lines) {
      const cm = line.match(/^>\s?(.*)/)
      if (cm) {
        // 跳过 callout 头部行 > [!TYPE] 和嵌套 > [[ 语法
        if (/^>\s*\[!?\[/.test(line) || /^>\s*\[!?\w+\]/.test(line)) continue
        contentLines.push(cm[1])
      }
    }
    content = contentLines.join('\n').trim()
  }

  const cfg = CALLOUT_CONFIG[type] || CALLOUT_CONFIG.TIP
  const bg = cfg.bg
  const border = cfg.border

  let html = `<section style="margin:${spacing[7]} 0px;padding:${spacing[7]} ${spacing[6]};background:${bg};border-left:4px solid ${border};border-radius:0px ${radius.xl} ${radius.xl} 0px">`
  if (title) {
    html += `<p style="margin:0px 0px ${spacing[2]};font-size:${fontSize.xl};font-weight:${fontWeight.bold};color:${border}">${esc((cfg.icon || '') + ' ' + title)}</p>`
  }
  if (content.trim()) {
    html += `<section style="font-size:${fontSize.xl};color:${neutral.gray700};line-height:${lineHeight.looser};letter-spacing:${letterSpacing.wider};text-align:justify">${esc(content.trim())}</section>`
  }
  html += `</section>`
  return html
}

// ── 统一组件（info 默认，type 切换类型） ──
export const Callout_DA01: ComponentDef = {
  id: 'Callout_DA01',
  name: '引用提示框',
  tag: 'callout',
  description: '使用 Markdown 引用块语法 `> [!TYPE]` 创建彩色提示框，支持 INFO / NOTE / TIP / WARNING / CAUTION / IMPORTANT',
  attrs: [
    { key: 'type', label: '类型', required: false, default: 'INFO', options: ['INFO', 'NOTE', 'TIP', 'WARNING', 'CAUTION', 'IMPORTANT'] },
    { key: 'title', label: '标题', required: false, default: '' },
  ],
  example: `> [!info] 信息
> 提供相关的背景资料或参考信息，支持 **粗体** 和 *斜体*。
> 分享使用技巧和最佳实践，帮助读者提高效率。`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    return calloutRender(attrs, body, t)
  },
}
