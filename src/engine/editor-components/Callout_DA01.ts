/**
 * Callout_DA01 - 块级提示/警告组件
 *
 * 统一语法（::: 容器）：
 *   :::callout type="info"
 *   提供相关的背景资料或参考信息，支持 **粗体** 和 *斜体*。
 *   :::
 *
 * 支持类型：info / tip / warning / success / danger
 * 兼容旧语法：> [!INFO] / > [!TIP] / > [!WARNING] 等 GFM alert 语法
 */
import { esc } from '@engine/utils/helpers'
import type { ThemeColors } from '@engine/composables/useTheme'
import { fontSize, fontWeight, letterSpacing, lineHeight, neutral, radius, spacing } from '@engine/tokens'
import { buildUnifiedRenderer, parseBody, type UnifiedComponentDef } from './unifiedRender'

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
  let type = (attrs.type || 'info').toUpperCase()
  let title = attrs.title || ''
  let content = body

  // 兼容旧语法：> [TYPE] 和 > [!TYPE]（body 中若仍包含 GFM alert 头部则解析）
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

  const cfg = CALLOUT_CONFIG[type] || CALLOUT_CONFIG.INFO
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
export const Callout_DA01: UnifiedComponentDef = {
  spec: {
    name: 'callout',
    label: '提示框',
    bodyFormat: 'markdown',
    example: `:::callout type="tip" title="排版小技巧"
如果你不确定某个段落应该使用哪个模块，可以遵循一个简单原则：**信息型内容用正文模块**（提示框、代码块、表格），**结构型内容用导航模块**（阅读路线、章节分隔、步骤流程）。

这个原则在 80% 的场景下都能帮你快速做出选择。
:::`,
    fields: [
      { name: 'type', required: false, description: '提示类型：info / tip / warning / success / danger' },
      { name: 'title', required: false, description: '标题' },
    ],
  },

  render(attrs, _rawBody, body, t) {
    return calloutRender(attrs, body.markdown, t)
  },

  renderLegacy(attrs, body, t) {
    return this.render(attrs, body, parseBody(body, this.spec.bodyFormat), t)
  },
}

export const calloutRenderer = buildUnifiedRenderer(Callout_DA01)
