/**
 * Align_DA01 — 对齐方式组件
 *
 * 统一语法（::: 容器）：
 *   :::align align="center"
 *   这段文字将在页面中居中对齐显示，
 *   适合用于引用语、诗歌或强调内容。
 *   :::
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import { inlineFormat } from '@engine/utils/inlineFormat'
import { renderCodeBlock } from '@engine/utils/codeBlock'
import { spacing } from '@engine/tokens'
import { buildUnifiedRenderer, parseBody, type UnifiedComponentDef } from './unifiedRender'

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

export const Align_DA01: UnifiedComponentDef = {
  spec: {
    name: 'align',
    label: '对齐容器',
    bodyFormat: 'markdown',
    example: `:::align align="center"
这段文字将在页面中居中对齐显示，
适合用于引用语、诗歌或强调内容。
:::`,
    fields: [
      { name: 'align', required: false, description: '对齐方向（center/right/left），默认 center' },
    ],
  },

  render(attrs, _rawBody, body, t) {
    if (!body.markdown.trim()) return ''
    return `<section style="text-align:${attrs.align || 'center'};margin:${spacing[5]} 0px">${renderContent(body.markdown, t)}</section>`
  },

  renderLegacy(attrs, body, t) {
    return this.render(attrs, body, parseBody(body, this.spec.bodyFormat), t)
  },
}

export const alignRenderer = buildUnifiedRenderer(Align_DA01)
