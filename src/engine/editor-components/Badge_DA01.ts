/**
 * Badge_DA01 - 行内徽章组件（默认A型01号样式）
 *
 * 编辑器语法：
 *   <Badge type="tip" text="提示" />
 *   <Badge type="warning" text="警告" />
 *   <Badge type="info" text="信息" />
 *   <Badge type="danger" text="危险" />
 *
 * 属性：
 *   type - 徽章类型：info / tip / warning / danger
 *   text - 徽章显示文字
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import { fontSize, fontWeight, radius, spacing } from '@engine/tokens'
import { leaf } from '@engine/utils/helpers'

const BADGE_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  info:    { bg: '#e3f2fd', fg: '#1565c0', border: '#90caf9' },
  tip:     { bg: '#e8f5e9', fg: '#2e7d32', border: '#a5d6a7' },
  warning: { bg: '#fff3e0', fg: '#e65100', border: '#ffcc80' },
  danger:  { bg: '#fce4ec', fg: '#c62828', border: '#ef9a9a' },
}

export const Badge_DA01 = {
  id: 'Badge_DA01',
  name: '行内徽章',
  tag: 'Badge',
  description: '行内彩色徽章标签，用于标记状态或类型',
  attrs: [
    { key: 'type', label: '徽章类型', required: false, default: 'info', options: ['info', 'tip', 'warning', 'danger'] },
    { key: 'text', label: '显示文字', required: true, default: '' },
  ],
  example: '<Badge type="tip" text="推荐" />',

  render(attrs: Record<string, string>, _body: string, _t: ThemeColors): string {
    const type = (attrs.type || 'info').toLowerCase()
    const text = attrs.text || 'Badge'
    const colors = BADGE_COLORS[type] || BADGE_COLORS.info

    return `<span style="display:inline-block;padding:0 ${spacing[2]};margin:0 ${spacing[1]};border-radius:${radius.sm};font-size:${fontSize.xs};font-weight:${fontWeight.semibold};background:${colors.bg};color:${colors.fg};border:1px solid ${colors.border};line-height:1.6;vertical-align:middle">${leaf(text)}</span>`
  },
}
