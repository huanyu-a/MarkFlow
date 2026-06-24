import { leaf } from '@engine/utils/helpers'
import type { ThemeColors } from '@engine/composables/useTheme'

/**
 * Lead_DA01 - 引导文字（默认A型01号样式）
 *
 * 编辑器语法：
 *   <lead text-color="#333" bg="#f0f0f0" round>这是一段引导文字</lead>
 *
 * 属性：
 *   color      - 左侧边框颜色（可选，默认使用主题色）
 *   text-color - 文字颜色（可选，默认 rgb(85,85,85)）
 *   bg         - 背景颜色（可选，默认透明）
 *   round      - 启用圆角（可选，默认无圆角）
 *
 * body 内容带左侧边框，适合引入话题或提供背景信息。
 * 视觉效果比普通段落更突出，但又不会像 Statement 那样过于正式。
 */

export const Lead_DA01 = {
  id: 'Lead_DA01',
  name: '引导文字',
  tag: 'lead',
  attrs: [
    { key: 'color', label: '边框颜色', required: false, default: '' },
    { key: 'text-color', label: '文字颜色', required: false, default: '' },
    { key: 'bg', label: '背景颜色', required: false, default: '' },
    { key: 'round', label: '圆角', required: false, default: '' },
  ],
  example: `<lead color="#7c3aed" text-color="#4a5568" bg="#f8f7ff" round="12px">在开始之前，先聊一个背景：最近几年，越来越多的人开始重新审视自己的生活方式。</lead>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const color = attrs.color || t.accent
    const textColor = attrs['text-color'] || 'rgb(85,85,85)'
    const wrapperStyle = [
      attrs.bg ? `background:${attrs.bg};` : '',
      attrs.round ? 'border-radius:8px;overflow:clip;' : '',
    ].join('')
    return `<section style="${wrapperStyle}"><p style="font-size:16px;color:${textColor};line-height:1.8;letter-spacing:0.5px;text-align:justify;padding:16px;border-left:3px solid ${color};margin:14px 0px;overflow-wrap:break-word;word-break:break-word">${leaf(body)}</p></section>`
  },
}
