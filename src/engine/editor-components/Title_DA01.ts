import { leaf } from '@engine/utils/helpers'
import type { ThemeColors } from '@engine/composables/useTheme'
import {
  color,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  neutral,
  radius,
  shadowRaw,
  spacing,
} from '@engine/tokens'

/**
 * Title_DA01 - 标题卡片（默认A型01号样式）
 *
 * 编辑器语法：
 *   <title badge="GUIDE" subtitle="副标题" chips="关键词1|关键词2">文章标题</title>
 *
 * 属性：
 *   badge    - 分类标签（如：GUIDE、更新、教程）
 *   subtitle - 副标题
 *   chips    - 关键词标签，| 分隔
 */

// ── 样式常量 ──────────────────────────────────────────
const S = {
  card:
    `margin:0px 0px ${spacing[12]};${shadowRaw.card};` +
    `border-radius:${radius['3xl']};border:1px solid ${neutral.gray250};` +
    `overflow:hidden;background:linear-gradient(135deg,${neutral.gray100} 0%,rgb(238,244,251) 100%)`,
  body: `padding:${spacing[9]};background:${color.surface}eb`,
  badge: (accent: string) =>
    `margin:0px;padding:0px 0px ${spacing[4]};font-size:${fontSize['2xs']};color:${accent};` +
    `letter-spacing:${letterSpacing['3xl']};text-transform:uppercase;font-weight:${fontWeight.extrabold}`,
  title:
    `margin:0px;font-size:${fontSize['7xl']};font-weight:${fontWeight.black};color:${color.textPrimary};` +
    `line-height:${lineHeight.tight};letter-spacing:${letterSpacing.tight};word-break:break-all`,
  subtitle:
    `margin:0px;padding:${spacing[4]} 0px 0px;font-size:${fontSize.md};color:${color.ink};` +
    `line-height:${lineHeight.looser};font-weight:${fontWeight.normal};text-align:justify;letter-spacing:${letterSpacing.wide}`,
  chips: `margin:0px;padding:${spacing[4]} 0px 0px;font-size:0px;line-height:${lineHeight.loosest}`,
  chip:
    `display:inline-block;margin:0px ${spacing[3]} 0px 0px;font-size:${fontSize['2xs']};` +
    `color:#576B95;font-weight:${fontWeight.bold};letter-spacing:0.02em;white-space:nowrap`,
  statLabel:
    `margin:0px 0px ${spacing[3]};font-size:${fontSize['2xs']};line-height:${lineHeight.normal};` +
    `color:${color.inkFaint};font-weight:${fontWeight.extrabold};letter-spacing:${letterSpacing.wide}`,
  statNum: (bg: string) =>
    `display:inline-block;width:64px;height:64px;line-height:64px;` +
    `text-align:center;border-radius:${radius.xl};background-color:${bg};` +
    shadowRaw.float,
  numText:
    `font-size:${fontSize['8xl']};line-height:64px;color:${color.surface};` +
    `font-weight:${fontWeight.black};letter-spacing:${letterSpacing.tighter}`,
  charCount:
    `margin:${spacing[3]} 0px 0px;font-size:${fontSize['2xs']};color:${color.inkFaint};` +
    `font-weight:${fontWeight.bold};letter-spacing:${letterSpacing.wide}`,
  tdLeft: 'vertical-align:top;border:0px;padding:0px;text-align:left',
  tdRight: 'vertical-align:top;border:0px;padding:0px;text-align:right',
  table:
    'border:0px;border-collapse:collapse;table-layout:fixed;' +
    'min-width:115px;width:100%;margin-bottom:0',
}

// ── 辅助函数 ──────────────────────────────────────────
function countChars(raw: string): { chars: number; minutes: number } {
  const text = raw
    .replace(/<title[\s\S]*?<\/title>\s*/, '')
    .replace(/[#*`>[\]!|_~=-]/g, '')
    .replace(/\s+/g, '')
  const chars = text.length
  return { chars, minutes: Math.max(1, Math.ceil(chars / 400)) }
}

function renderChips(raw: string): string {
  return raw
    .split('|')
    .map((c) => `<span style="${S.chip}">${leaf('#' + c.trim())}</span>`)
    .join('')
}

// ── 组件定义 ──────────────────────────────────────────
export const Title_DA01 = {
  id: 'Title_DA01',
  name: '标题卡片',
  tag: 'title',
  attrs: [
    { key: 'type', label: '样式类型', required: false, default: 'DA01', options: ['DA01', 'DA02'] },
    { key: 'badge', label: '标签', required: false, default: '' },
    { key: 'subtitle', label: '副标题', required: false, default: '' },
    { key: 'chips', label: '关键词（|分隔）', required: false, default: '' },
    { key: 'color', label: '自定义颜色', required: false, default: '' },
  ],
  example: `<title type="DA01" badge="GUIDE" subtitle="这是一份包含所有可用 Markdown 指令及扩展标签的完整演示稿。" chips="图片并排|窗口滚动|渐变文字" color="#6c5ce7">功能全集：排版组件指南</title>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors, ...rest: unknown[]): string {
    const raw = (rest[0] as string) || ''
    const { chars, minutes } = countChars(raw)
    const accent = attrs.color || t.accent

    return `
      <section style="${S.card}">
        <section style="${S.body}">
          <section class="tableWrapper">
            <table style="${S.table}">
              <colgroup><col><col style="width:90px;"></colgroup>
              <tbody><tr>
                <td valign="top" align="left" style="${S.tdLeft}">
                  ${attrs.badge ? `<p style="${S.badge(accent)}">${leaf(attrs.badge)}</p>` : ''}
                  ${body ? `<p style="${S.title}">${leaf(body)}</p>` : ''}
                  ${attrs.subtitle ? `<p style="${S.subtitle}">${leaf(attrs.subtitle)}</p>` : ''}
                  ${attrs.chips ? `<section style="${S.chips}">${renderChips(attrs.chips)}</section>` : ''}
                </td>
                <td data-colwidth="90" width="90" valign="top" align="right" style="${S.tdRight}">
                  <p style="${S.statLabel}">${leaf('预计阅读(分)')}</p>
                  <section style="${S.statNum(accent)}">
                    <span style="${S.numText}">${leaf(minutes)}</span>
                  </section>
                  <p style="${S.charCount}">${leaf(`共 ${chars} 字`)}</p>
                </td>
              </tr></tbody>
            </table>
          </section>
        </section>
      </section>`
  },
}
