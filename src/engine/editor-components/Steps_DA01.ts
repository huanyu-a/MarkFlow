import { leaf, withAlpha } from '@engine/utils/helpers'
import type { ThemeColors } from '@engine/composables/useTheme'
import { color, fontSize, fontWeight, letterSpacing, neutral, radius, spacing } from '@engine/tokens'

/**
 * Steps_DA01 - 步骤流（默认A型01号样式）
 *
 * 编辑器语法：
 *   <steps label="HOW IT WORKS" title="标题" hint="提示文字" active="2" color="#e74c3c">
 *   - 步骤名称 | 步骤描述
 *   - 步骤名称 | 步骤描述
 *   </steps>
 *
 * 属性：
 *   label   - 顶部标签（如：HOW IT WORKS）
 *   title   - 标题
 *   hint    - 提示文字
 *   active  - 强调控制：
 *               数字（如 "1"/"2"/"3"）= 仅该步骤强调（默认 "1"）
 *               "all"  = 全部步骤强调
 *               "none" = 全部步骤不强调
 *   color   - 自定义颜色（默认使用主题色）
 *   （竖向布局请使用 type="DA02"；超过3步建议直接使用 DA02）
 */

export const Steps_DA01 = {
  id: 'Steps_DA01',
  name: '步骤流',
  tag: 'steps',
  attrs: [
    { key: 'label', label: '顶部标签', required: false, default: '' },
    { key: 'title', label: '标题', required: false, default: '' },
    { key: 'hint', label: '提示文字', required: false, default: '' },
    { key: 'active', label: '强调控制（数字/all/none）', required: false, default: '1' },
    { key: 'color', label: '自定义颜色', required: false, default: '' },
  ],
  example: `<steps label="HOW IT WORKS" title="安装好之后怎么跑起来" hint="左右滑动查看" active="2" color="#7c3aed">
- 输入 | 往知识库里喂东西
- 管理 | 让知识库有序运转
- 输出 | 从知识库取素材做东西
</steps>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const activeRaw = (attrs.active || '1').toLowerCase().trim()
    const activeNum = parseInt(activeRaw, 10)
    const accent = attrs.color || t.accent
    const steps: { name: string; desc: string }[] = []
    body.split('\n').forEach((line) => {
      const m = line.trim().match(/^-\s*(.+)\s*\|\s*(.+)/)
      if (m) steps.push({ name: m[1].trim(), desc: m[2].trim() })
    })
    const isStepActive = (idx: number): boolean => {
      if (activeRaw === 'all') return true
      if (activeRaw === 'none') return false
      return idx + 1 === activeNum
    }

    let html = `<section style="margin:0px 0px ${spacing[10]};padding:${spacing[9]};background:${neutral.gray50};border-radius:${radius['2xl']};border:1px solid ${neutral.gray200}">`
    if (attrs.label)
      html += `<p style="margin:0px 0px ${spacing[1]};font-size:${fontSize['2xs']};color:${neutral.gray500};letter-spacing:${letterSpacing['2xl']};font-weight:${fontWeight.bold}">${leaf(attrs.label)}</p>`
    if (attrs.title)
      html += `<p style="margin:0px 0px ${spacing[1]};font-size:${fontSize['3xl']};font-weight:${fontWeight.extrabold};color:${neutral.gray1000}">${leaf(attrs.title)}</p>`
    if (attrs.hint)
      html += `<p style="margin:0px 0px ${spacing[7]};font-size:${fontSize.sm};color:${neutral.gray500}">${leaf(attrs.hint)}</p>`

    html += `<section style="overflow-x:auto;-webkit-overflow-scrolling:touch">`
    html += `<table border="0" cellpadding="0" cellspacing="12" style="margin:0;border-collapse:separate;border-spacing:12px 0;border:none;min-width:${steps.length * 120}px"><tr>`
    steps.forEach((s, idx) => {
      const isActive = isStepActive(idx)
      const borderWidth = isActive ? '2px' : '1px'
      const borderColor = isActive ? accent : neutral.gray200
      const bgColor = isActive ? withAlpha(accent) : color.surface
      html += `<td style="vertical-align:top;padding:${spacing[7]} ${spacing[6]};background:${bgColor};border-radius:${radius.xl};border:${borderWidth} solid ${borderColor};text-align:center;width:${Math.floor(100 / steps.length)}%">`
      html += `<p style="margin:0px 0px ${spacing[1]};font-size:${fontSize['5xl']};font-weight:${fontWeight.black};color:${accent}">${leaf(idx + 1)}</p>`
      html += `<p style="margin:0px 0px ${spacing[0]};font-size:${fontSize.base};font-weight:${fontWeight.bold};color:${color.textTertiary}">${leaf(s.name)}</p>`
      html += `<p style="margin:0px;font-size:${fontSize.xs};color:${neutral.gray500}">${leaf(s.desc)}</p>`
      html += `</td>`
    })
    html += `</tr></table></section>`

    html += `</section>`
    return html
  },
}
