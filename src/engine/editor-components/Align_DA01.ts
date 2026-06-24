/**
 * Align_DA01 — 对齐方式组件
 *
 * 使用 `<align align="center/right/left">内容</align>` 标签控制文本对齐方向
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import { inlineFormat } from '@engine/utils/inlineFormat'
import { renderCodeBlock } from '@engine/utils/codeBlock'
import { spacing } from '@engine/tokens'
import type { ComponentDef } from '@engine/editor-components/index'

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

export const Align_DA01: ComponentDef = {
  id: 'Align_DA01',
  name: '对齐方式',
  tag: 'align',
  description: '使用 `<align align="center/right/left">内容</align>` 标签控制文本对齐方向',
  attrs: [
    { key: 'align', label: '对齐方向', required: false, default: 'center', options: ['center', 'right', 'left'] },
  ],
  example: `<align align="center">这段文字将在页面中居中对齐显示，
适合用于引用语、诗歌或强调内容。</align>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    if (!body.trim()) return ''
    return `<section style="text-align:${attrs.align || 'center'};margin:${spacing[5]} 0px">${renderContent(body, t)}</section>`
  },
}
