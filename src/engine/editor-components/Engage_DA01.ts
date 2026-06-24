import { leaf } from '@engine/utils/helpers'
import type { ThemeColors } from '@engine/composables/useTheme'
import { fontSize, fontWeight, letterSpacing, lineHeight, neutral, radius, spacing } from '@engine/tokens'

/**
 * Engage_DA01 - 底部引导卡片（默认A型01号样式）
 *
 * 编辑器语法：
 *   <engage title="如果这份文档对你有帮助，欢迎点赞、推荐、转发！" label="THANKS FOR READING">
 *
 * 属性：
 *   title - 标题文字（可选）
 *   label - 底部小字（可选，默认 THANKS FOR READING）
 *
 * 生成带虚线边框的底部引导卡片，包含点赞、推荐、转发图标。
 */

export const Engage_DA01 = {
  id: 'Engage_DA01',
  name: '底部引导卡片',
  tag: 'engage',
  attrs: [
    { key: 'title', label: '标题文字', required: false, default: '' },
    { key: 'label', label: '底部小字', required: false, default: 'THANKS FOR READING' },
  ],
  example: `<engage title="如果这份文档对你有帮助，欢迎点赞、转发、推荐！" label="THANKS FOR READING"></engage>`,

  render(attrs: Record<string, string>, _body: string, t: ThemeColors): string {
    let html = `<section style="margin:${spacing[11]} 0px ${spacing[11]};width:100%;max-width:677px;box-sizing:border-box;overflow:hidden;text-align:center;padding:${spacing[9]};border-radius:${radius['3xl']};background:rgba(${t.rgb},0.05);border:1px dashed ${neutral.gray250}">`
    if (attrs.title)
      html += `<p style="margin:0px 0px ${spacing[8]};font-size:${fontSize.xl};font-weight:${fontWeight.extrabold};color:${neutral.gray850};line-height:${lineHeight.loose}">${leaf(attrs.title)}</p>`
    html += `<section style="margin:0px 0px ${spacing[6]};text-align:center;font-size:0px;line-height:1;color:${t.accent}">`
    html += `<span style="display:inline-block;margin:0px ${spacing[3]};width:28px;height:28px;vertical-align:middle"><svg viewBox="0 0 24 24" width="28" height="28" style="display:block" xmlns="http://www.w3.org/2000/svg"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" fill="currentColor"></path></svg></span>`
    html += `<span style="display:inline-block;margin:0px ${spacing[3]};width:32px;height:32px;vertical-align:middle"><svg viewBox="0 0 24 24" width="32" height="32" style="display:block" xmlns="http://www.w3.org/2000/svg"><path d="M21 12l-7-7v4C7 10 4 15 3 20c2.5-3.5 6-5.1 11-5.1V19l7-7z" fill="currentColor"></path></svg></span>`
    html += `<span style="display:inline-block;margin:0px ${spacing[3]};width:28px;height:28px;vertical-align:middle"><svg viewBox="0 0 24 24" width="28" height="28" style="display:block" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"></path></svg></span>`
    html += `</section>`
    html += `<p style="margin:0px 0px ${spacing[1]};font-size:${fontSize['2xs']};color:${t.accent};font-weight:${fontWeight.extrabold};letter-spacing:${letterSpacing['2xl']};text-transform:uppercase">${leaf('点赞 · 转发 · 推荐')}</p>`
    html += `<p style="font-size:${fontSize['2xs']};color:${neutral.gray400};letter-spacing:${letterSpacing.widest};margin:0px">${leaf(attrs.label || 'THANKS FOR READING')}</p>`
    html += `</section>`
    return html
  },
}
