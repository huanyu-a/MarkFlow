/**
 * LabeledFlow_DA01 - 标签条目（默认A型01号样式）
 *
 * 统一语法（::: 容器）：
 *   :::case-flow color="#e74c3c"
 *   - [案例 01] 从零搭建个人知识库，三周后效率翻倍
 *   - [案例 02] 用 AI 辅助写周报，每周省出两小时
 *   - [步骤三] 坚持早起 100 天，人生发生了什么变化
 *   :::
 *
 * 属性：
 *   color?: string  - 标签背景色（默认使用主题色）
 */
import { resolveColor, colorToAlpha } from '@engine/utils/colorUtils'
import { esc } from '@engine/utils/helpers'
import { inlineFormat } from '@engine/utils/inlineFormat'
import { buildUnifiedRenderer, parseBody, type UnifiedComponentDef } from './unifiedRender'

interface CaseItem {
  label: string
  text: string
}

function parseCaseItems(rawBody: string): CaseItem[] {
  const items: CaseItem[] = []
  const lines = rawBody.split('\n').filter((l) => l.trim())
  for (const line of lines) {
    // 匹配 - [任意标签] 内容
    const m = line.match(/^-\s*\[([^\]]+)\]\s*(.+)$/)
    if (m) {
      items.push({ label: m[1].trim(), text: m[2].trim() })
    }
  }
  return items
}

export const LabeledFlow_DA01: UnifiedComponentDef = {
  spec: {
    name: 'case-flow',
    label: '标签条目',
    bodyFormat: 'markdown',
    example: `:::case-flow
- [案例 01] 从零搭建个人知识库，三周后效率翻倍
- [案例 02] 用 AI 辅助写周报，每周省出两小时
- [步骤三] 坚持早起 100 天，人生发生了什么变化
:::`,
    fields: [
      { name: 'color', required: false, description: '标签背景色（默认使用主题色）' },
    ],
  },

  render(attrs, rawBody, body, t) {
    // body.markdown 保留原始文本，用原 parseCaseItems 逐行解析（格式特殊，非 pipe 分隔）
    const source = body.markdown || rawBody
    const hex = resolveColor(attrs.color || t.accent)
    const items = parseCaseItems(source)

    if (items.length === 0) return ''

    const tagBg = colorToAlpha(hex, 0.12)

    const rows = items
      .map(
        (item) => `
      <section style="display:flex;align-items:center;gap:16px;padding:20px;margin-bottom:12px;border:1px solid rgba(0,0,0,0.06);border-radius:12px;background:#fff;">
        <span style="flex-shrink:0;white-space:nowrap;background:${tagBg};color:${hex};font-size:13px;font-weight:600;padding:6px 14px;border-radius:8px;letter-spacing:0.5px;">${esc(item.label)}</span>
        <span style="flex:1;font-size:15px;line-height:1.6;color:#333;">${inlineFormat(item.text, t)}</span>
      </section>
    `,
      )
      .join('')

    return `
      <section style="margin:20px 0;">
        ${rows}
      </section>
    `
  },

  renderLegacy(attrs, body, t) {
    return this.render(attrs, body, parseBody(body, this.spec.bodyFormat), t)
  },
}

export const caseFlowRenderer = buildUnifiedRenderer(LabeledFlow_DA01)
