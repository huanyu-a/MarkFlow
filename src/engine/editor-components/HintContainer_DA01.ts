/**
 * HintContainer_DA01 — ::: 提示容器组件
 *
 * 使用 `::: TYPE` 容器语法创建彩色提示框
 * 支持 info / tip / note / warning / caution / important
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import { esc } from '@engine/utils/helpers'
import { inlineFormat } from '@engine/utils/inlineFormat'
import { renderCodeBlock } from '@engine/utils/codeBlock'
import { fontSize, fontWeight, letterSpacing, lineHeight, neutral, radius, spacing } from '@engine/tokens'
import type { ComponentDef } from '@engine/editor-components/index'

// ── 解析 ::: 容器 body ──
function parseContainer(body: string): { title: string; content: string } {
  const lines = body.trim().split('\n')
  const title = lines[0]?.replace(/^:{3,4}\s*\w+\s*/, '').trim() || ''
  const contentLines: string[] = []
  for (let i = 1; i < lines.length; i++) {
    if (/^:{3,4}\s*$/.test(lines[i].trim())) break
    contentLines.push(lines[i])
  }
  return { title, content: contentLines.join('\n').trim() }
}

// ── 渲染 markdown 内容（支持行内格式 + 代码块） ──
const CB_OPEN = ''
const CB_CLOSE = ''

function renderContent(text: string, t: ThemeColors): string {
  if (!text) return ''
  const codeStore: string[] = []
  let processed = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang: string, code: string) => {
    const idx = codeStore.length
    codeStore.push(renderCodeBlock(code, lang || ''))
    return `${CB_OPEN}CB${idx}${CB_CLOSE}`
  })
  processed = inlineFormat(processed, t)
  processed = processed.replace(new RegExp(`${CB_OPEN}CB(\\d+)${CB_CLOSE}`, 'g'), (_m, idx: string) => codeStore[parseInt(idx)] || '')
  processed = processed.replace(/\n{2,}/g, '\n').replace(/[ \t]*\n[ \t]*/g, '<br>')
  return processed
}

// ── 公共配置 ──
const icons: Record<string, string> = { tip: '💡', note: '📝', info: 'ℹ️', warning: '⚠️', caution: '🚨', important: '❗' }
const labels: Record<string, string> = { tip: '提示', note: '注意', info: '信息', warning: '警告', caution: '危险', important: '重要' }
const bgs: Record<string, string> = { tip: '#f0fdf4', note: '#eff6ff', info: '#f0f9ff', warning: '#fffbea', caution: '#fef2f2', important: '#f5f3ff' }
const accents: Record<string, string> = { tip: '#16a34a', note: '#2563eb', info: '#0ea5e9', warning: '#ea580c', caution: '#dc2626', important: '#7c3aed' }

export const HintContainer_DA01: ComponentDef = {
  id: 'HintContainer_DA01',
  name: '提示容器',
  tag: 'hint',
  description: '使用 `::: TYPE` 容器语法创建彩色提示框，支持 info / tip / note / warning / caution / important',
  attrs: [
    { key: 'type', label: '类型', required: false, default: 'info', options: ['info', 'tip', 'note', 'warning', 'caution', 'important'] },
    { key: 'title', label: '标题', required: false, default: '' },
  ],
  example: `::: info 参考信息
提供相关的背景资料和补充说明，支持 \`inline code\` 行内代码。
\`\`\`js
const a = 1
const b = 2
const c = a + b
\`\`\`
内容末尾同样支持 **粗体** 和 *斜体*。
:::`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const type = attrs.type || 'info'
    const { title: bodyTitle, content } = parseContainer(body)
    const title = attrs.title || bodyTitle || labels[type] || type
    const icon = icons[type] || ''
    const bg = bgs[type] || '#f0f4fa'
    const accent = accents[type] || t.accent

    let html = `<section style="margin:${spacing[7]} 0px;padding:${spacing[7]} ${spacing[6]};background:${bg};border-left:4px solid ${accent};border-radius:0px ${radius.xl} ${radius.xl} 0px">`
    html += `<p style="margin:0px 0px ${spacing[2]};font-size:${fontSize.xl};font-weight:${fontWeight.bold};color:${accent}">${esc(icon + ' ' + title)}</p>`
    if (content) {
      html += `<section style="font-size:${fontSize.xl};color:${neutral.gray700};line-height:${lineHeight.looser};letter-spacing:${letterSpacing.wider};text-align:justify">${renderContent(content, t)}</section>`
    }
    html += `</section>`
    return html
  },
}
