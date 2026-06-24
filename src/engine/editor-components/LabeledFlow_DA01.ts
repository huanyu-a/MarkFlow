/**
 * LabeledFlow_DA01 - 标签条目（默认A型01号样式）
 *
 * 编辑器语法：
 *   - [标签] 描述内容
 *
 * 渲染效果：
 *   ┌─────────────────────────────────────────┐
 *   │ [标签]  描述内容                        │
 *   └─────────────────────────────────────────┘
 *
 * 属性：
 *   color?: string  - 标签背景色（默认使用主题色）
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import { resolveColor, colorToAlpha } from '@engine/utils/colorUtils'
import { esc } from '@engine/utils/helpers'

interface CaseItem {
  label: string
  text: string
}

function parseCaseItems(body: string): CaseItem[] {
  const items: CaseItem[] = []
  const lines = body.split('\n').filter((l) => l.trim())
  for (const line of lines) {
    // 匹配 - [任意标签] 内容
    const m = line.match(/^-\s*\[([^\]]+)\]\s*(.+)$/)
    if (m) {
      items.push({ label: m[1].trim(), text: m[2].trim() })
    }
  }
  return items
}

export const LabeledFlow_DA01 = {
  id: 'LabeledFlow_DA01',
  name: '标签条目',
  tag: 'case-flow',
  attrs: [{ key: 'color', label: '自定义颜色', required: false, default: '' }],
  example: `<case-flow color="#e74c3c">
- [案例 01] 从零搭建个人知识库，三周后效率翻倍
- [案例 02] 用 AI 辅助写周报，每周省出两小时
- [步骤三] 坚持早起 100 天，人生发生了什么变化
</case-flow>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const hex = resolveColor(attrs.color || t.accent)
    const items = parseCaseItems(body)

    if (items.length === 0) return ''

    const tagBg = colorToAlpha(hex, 0.12)

    const rows = items
      .map(
        (item) => `
      <section style="display:flex;align-items:center;gap:16px;padding:20px;margin-bottom:12px;border:1px solid rgba(0,0,0,0.06);border-radius:12px;background:#fff;">
        <span style="flex-shrink:0;white-space:nowrap;background:${tagBg};color:${hex};font-size:13px;font-weight:600;padding:6px 14px;border-radius:8px;letter-spacing:0.5px;">${esc(item.label)}</span>
        <span style="flex:1;font-size:15px;line-height:1.6;color:#333;">${item.text}</span>
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
}
