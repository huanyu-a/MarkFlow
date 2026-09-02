/**
 * Steps_DA01 - 横向步骤流（默认A型01号样式）
 *
 * 统一语法（::: 容器）：
 *   :::steps-horizontal label="HOW IT WORKS" title="标题" hint="提示文字" active="2"
 *   - 步骤名称 | 步骤描述
 *   - 步骤名称 | 步骤描述
 *   :::
 *
 * 属性：
 *   label   - 顶部标签（如：HOW IT WORKS）
 *   title   - 标题
 *   hint    - 提示文字
 *   active  - 强调控制：数字（如 "1"/"2"）= 仅该步骤强调（默认 "1"）；"all" = 全部；"none" = 无
 *   color   - 自定义颜色（默认使用主题色）
 */
import { leaf, withAlpha } from '@engine/utils/helpers'
import { color, fontSize, fontWeight, letterSpacing, neutral, radius, spacing } from '@engine/tokens'
import { buildUnifiedRenderer, parseBody, type UnifiedComponentDef } from './unifiedRender'

export const Steps_DA01: UnifiedComponentDef = {
  spec: {
    name: 'steps-horizontal',
    label: '横向步骤',
    bodyFormat: 'rows',
    example: `:::steps-horizontal label="HOW IT WORKS" title="从零到发布只需 5 步" hint="按顺序完成即可" active="2" color="#2563eb"
- 写作 | 在编辑器中用 Markdown 完成正文和标题层级
- 增强 | 从组件库挑选合适的排版模块，替换字段内容
- 预览 | 右侧实时查看渲染效果，同步调整移动端显示
- 导出 | 一键复制富文本到公众号，或导出长图/PDF
- 发布 | 粘贴到公众号后台，封面和合集设置后即可发布
:::`,
    fields: [
      { name: 'label', required: false, description: '顶部标签' },
      { name: 'title', required: false, description: '标题' },
      { name: 'hint', required: false, description: '提示文字' },
      { name: 'active', required: false, description: '强调控制（数字/all/none），默认 1' },
      { name: 'color', required: false, description: '自定义颜色' },
    ],
  },

  render(attrs, _rawBody, body, t) {
    const activeRaw = (attrs.active || '1').toLowerCase().trim()
    const activeNum = parseInt(activeRaw, 10)
    const accent = attrs.color || t.accent
    const steps = body.rows.map((r) => ({ name: r[0] || '', desc: r[1] || '' }))
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

  renderLegacy(attrs, body, t) {
    return this.render(attrs, body, parseBody(body, this.spec.bodyFormat), t)
  },
}

export const stepsHorizontalRenderer = buildUnifiedRenderer(Steps_DA01)
