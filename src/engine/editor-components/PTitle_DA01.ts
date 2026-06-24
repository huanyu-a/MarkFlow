import { leaf } from '@engine/utils/helpers'
import type { ThemeColors } from '@engine/composables/useTheme'
import { color, fontSize, fontWeight, letterSpacing, neutral, spacing } from '@engine/tokens'

/**
 * PTitle - 段落标题（默认A型01号样式）
 *
 * 编辑器语法（两种写法均可）：
 *   <p-title num="01" title="标题内容" subtitle="副标题" level="1"></p-title>
 *   <p-title num="01" title="标题内容" level="2"></p-title>
 *   <p-title num="01">标题内容</p-title>  ← body 作为 fallback
 *
 * Markdown 语法（自动转换）：
 *   # 一级标题文字       → level=1
 *   ## 二级标题文字      → level=2
 *   ### 三级标题文字     → level=3
 *   #### 四级标题文字    → level=4
 *
 * 属性：
 *   num             - 序号，如 01、02（可选）
 *   title           - 标题文字（可选，优先于 body 内容）
 *   subtitle        - 副标题文字（可选）
 *   color           - 标题文字颜色（可选，默认 rgb(17,24,39)）
 *   num-color       - 序号数字颜色（可选，默认使用主题色）
 *   subtitle-color  - 副标题颜色（可选，默认使用主题色）
 *   level           - 层级：1=一级标题(#)，2=二级标题(##)，3=三级标题(###)，4=四级标题(####)
 *   size            - 尺寸（仅 level=1 有效）：normal=默认，medium=中等，small=缩小版
 *   prefix          - 标题前缀图标，如 🚀、⚡、🔥（可选）
 *   suffix          - 标题后缀图标，如 ✅、💡、→（可选）
 *   hide            - 隐藏元素：num=隐藏数字，line=隐藏CHAPTER和横线（可选）
 */

// ── 组件定义 ──────────────────────────────────────────
export const PTitle = {
  id: 'PTitle_DA01',
  name: '段落标题',
  tag: 'p-title',
  attrs: [
    {
      key: 'num',
      label: '序号',
      required: false,
      default: '',
      description: '序号数字，如 01 / 02 / 03',
    },
    { key: 'title', label: '标题文字', required: false, default: '', description: '标题文字' },
    {
      key: 'subtitle',
      label: '副标题',
      required: false,
      default: '',
      description: '副标题，如英文翻译或补充说明',
    },
    {
      key: 'color',
      label: '标题颜色',
      required: false,
      default: '',
      description: '标题文字颜色，使用颜色单词或十六进制颜色值',
    },
    {
      key: 'num-color',
      label: '序号颜色',
      required: false,
      default: '',
      description: '序号数字的颜色，使用颜色单词或十六进制颜色值',
    },
    {
      key: 'subtitle-color',
      label: '副标题颜色',
      required: false,
      default: '',
      description: '副标题文字颜色，使用颜色单词或十六进制颜色值',
    },
    {
      key: 'level',
      label: '层级',
      required: false,
      default: '1',
      options: ['1', '2', '3', '4'],
      description: '标题层级：1 最大（对应 H1），4 最小（对应 H4）',
    },
    {
      key: 'size',
      label: '尺寸（level=1）',
      required: false,
      default: 'normal',
      options: ['normal', 'medium', 'small'],
      description: '仅 level=1 时生效：normal（默认）/ medium（中等）/ small（缩小）',
    },
    {
      key: 'prefix',
      label: '前缀图标',
      required: false,
      default: '',
      description: '标题前的图标，如 🚀、⚡、🔥，留空则不显示',
    },
    {
      key: 'suffix',
      label: '后缀图标',
      required: false,
      default: '',
      description: '标题后的图标，如 ✅、💡、→，留空则不显示',
    },
    {
      key: 'hide',
      label: '隐藏元素（level=1）',
      required: false,
      default: '',
      options: ['', 'num', 'line'],
      description: '隐藏指定元素：num（隐藏序号）/ line（隐藏章节线及横线），留空则全部显示',
    },
  ],
  example: `<p-title num="01" title="段落标题组件" subtitle="PARAGRAPH TITLE · 分段标题" level="1" color="#6c5ce7" num-color="#a78bfa" subtitle-color="#94a3b8" size="normal" prefix="🚀" suffix="✅" hide="num"></p-title>`,

  render(attrs: Record<string, string>, body: string, t: ThemeColors): string {
    const num = attrs.num || ''
    const title = attrs.title || body // title 属性优先，fallback 到 body
    const subtitle = attrs.subtitle
    const level = parseInt(attrs.level || '1', 10)
    const accent = t.accent
    const titleColor = attrs.color || color.textPrimary
    const numColor = attrs['num-color'] || accent
    const subtitleColor = attrs['subtitle-color'] || accent
    const hasNum = num !== ''
    const prefix = attrs.prefix || ''
    const suffix = attrs.suffix || ''
    const hasPrefix = prefix !== ''
    const hasSuffix = suffix !== ''
    const hide = attrs.hide || ''

    // ── Level 1: 完整章节标题（CHAPTER + 大号装饰数字 + 标题 + 副标题）──
    if (level === 1) {
      const size = attrs.size || 'normal'
      // 根据 size 计算尺寸：normal > medium > small
      let numFontSize: string,
        titleFontSize: string,
        titleMarginTop: string,
        titleMarginLeft: string
      let subtitleMarginLeft: string, subtitleFontSize: string, chapterFontSize: string
      let outerMargin: string
      if (size === 'small') {
        numFontSize = fontSize['10xl']
        titleFontSize = fontSize['4xl']
        titleMarginTop = '-40px'
        titleMarginLeft = '34px'
        subtitleMarginLeft = '34px'
        subtitleFontSize = fontSize['2xs']
        chapterFontSize = '8px'
        outerMargin = `${spacing[11]} 0px ${spacing[7]}`
      } else if (size === 'medium') {
        numFontSize = fontSize['11xl']
        titleFontSize = fontSize['6xl']
        titleMarginTop = '-48px'
        titleMarginLeft = '40px'
        subtitleMarginLeft = '40px'
        subtitleFontSize = fontSize['2xs']
        chapterFontSize = fontSize['2xs']
        outerMargin = `${spacing[12]} 0px ${spacing[9]}`
      } else {
        numFontSize = fontSize['12xl']
        titleFontSize = fontSize['8xl']
        titleMarginTop = '-60px'
        titleMarginLeft = '50px'
        subtitleMarginLeft = '50px'
        subtitleFontSize = fontSize.xs
        chapterFontSize = fontSize['2xs']
        outerMargin = `${spacing[13]} 0px ${spacing[10]}`
      }

      const numBlock =
        hasNum && hide !== 'num'
          ? `<strong style="display:block;font-size:${numFontSize};line-height:1;color:${numColor};letter-spacing:${letterSpacing.tighter};white-space:nowrap;opacity:0.25"><span leaf="">${num}</span></strong>`
          : ''
      const titleBlock =
        hasNum && hide !== 'num'
          ? `<strong style="display:block;font-size:${titleFontSize};font-weight:${fontWeight.black};color:${titleColor};line-height:1.26;letter-spacing:${letterSpacing.tight};margin-top:${titleMarginTop};margin-left:${titleMarginLeft}"><span leaf="">${hasPrefix ? prefix + ' ' : ''}${leaf(title)}${hasSuffix ? ' ' + suffix : ''}</span></strong>`
          : `<strong style="display:block;font-size:${titleFontSize};font-weight:${fontWeight.black};color:${titleColor};line-height:1.26;letter-spacing:${letterSpacing.tight}"><span leaf="">${hasPrefix ? prefix + ' ' : ''}${leaf(title)}${hasSuffix ? ' ' + suffix : ''}</span></strong>`
      const subtitleHtml = subtitle
        ? `<span style="display:block;margin-left:${hasNum && hide !== 'num' ? subtitleMarginLeft : '0'};font-size:${subtitleFontSize};color:${subtitleColor};font-weight:${fontWeight.bold};text-transform:uppercase;letter-spacing:1.6px"><span leaf="">${leaf(subtitle)}</span></span>`
        : ''
      const chapterLine =
        hasNum && hide !== 'line'
          ? `<section style="display:flex;align-items:center;margin:0;padding-bottom:${spacing[5]}"><span style="font-size:${chapterFontSize};font-weight:${fontWeight.extrabold};color:${color.inkFaint};letter-spacing:2.6px;text-transform:uppercase;white-space:nowrap"><span leaf="">CHAPTER ${num}</span></span><section style="flex:1;border-top:1px solid ${neutral.gray250};margin:0 0 0 ${spacing[5]};height:0"></section></section>`
          : ''

      return `
<section style="margin:${outerMargin}">
  <section style="clear:both">
    ${chapterLine}
    <section style="margin:0">
      ${numBlock}
      ${titleBlock}
      ${subtitleHtml}
    </section>
  </section>
</section>`
    }

    // ── 序号圆形徽章（levels 2–4 共用）──
    const numBadge = (diameter: string, fontSizeVal: string): string => {
      if (!hasNum) return ''
      return [
        `<span style="`,
        `display:inline-flex;align-items:center;justify-content:center;`,
        `width:${diameter};height:${diameter};min-width:${diameter};`,
        `border-radius:50%;`,
        `background:${numColor};color:#fff;`,
        `font-weight:${fontWeight.black};font-size:${fontSizeVal};`,
        `letter-spacing:${letterSpacing.tight};`,
        `flex-shrink:0;line-height:1;`,
        `box-shadow:0 2px 8px ${numColor}33;`,
        `"><span leaf="">${num}</span></span>`,
      ].join('')
    }

    // ── 标题文字带浅色衬底（levels 2–4 共用）──
    const titleBg = (content: string, fontSizeVal: string, fw: string, padding: string): string => {
      return [
        `<span style="`,
        `display:inline-block;`,
        `background:linear-gradient(135deg,${numColor}0c,${numColor}06);`,
        `padding:${padding};border-radius:8px;`,
        `font-size:${fontSizeVal};font-weight:${fw};color:${titleColor};`,
        `line-height:1.4;letter-spacing:${letterSpacing.tight};`,
        `"><span leaf="">${content}</span></span>`,
      ].join('')
    }

    // ── 构建标题行：徽章 + 标题（可选负 margin 压住副标题）──
    const buildTitleRow = (
      titleText: string,
      badgeDia: string,
      badgeFont: string,
      titleFs: string,
      titleFw: string,
      titlePad: string,
      gap: string,
      mt: string,
    ): string => {
      const badge = numBadge(badgeDia, badgeFont)
      const titleEl = titleBg(titleText, titleFs, titleFw, titlePad)
      return badge
        ? `<section style="display:flex;align-items:center;gap:${gap};margin:${mt} 0 0 0">${badge}${titleEl}</section>`
        : `<section style="margin:${mt} 0 0 0">${titleEl}</section>`
    }

    // ── 构建副标题（标题下方，负 margin 上滑被标题压住）──
    const buildSubtitle = (badgeDia: string, gap: string, fs: string, ls: string, mt: string): string => {
      if (!subtitle) return ''
      const left = hasNum ? `calc(${badgeDia} + ${gap})` : '0'
      return `<p style="margin:${mt} 0 0 ${left};font-size:${fs};color:${subtitleColor};font-weight:${fontWeight.semibold};text-transform:uppercase;letter-spacing:${ls}"><span leaf="">${leaf(subtitle)}</span></p>`
    }

    // ── Level 2: 二级标题（##）──
    if (level === 2) {
      const titleText = `${hasPrefix ? prefix + ' ' : ''}${leaf(title)}${hasSuffix ? ' ' + suffix : ''}`
      return `
<section style="margin:${spacing[12]} 0px ${spacing[9]};padding-left:0px">
  ${buildTitleRow(titleText, '34px', fontSize.base, fontSize['2xl'], fontWeight.extrabold, `${spacing[2]} ${spacing[5]}`, spacing[4], '0')}
  ${buildSubtitle('34px', spacing[4], fontSize.xs, '1.6px', '-12px')}
</section>`
    }

    // ── Level 3: 三级标题（###）──
    if (level === 3) {
      const titleText3 = `${hasPrefix ? prefix + ' ' : ''}${leaf(title)}${hasSuffix ? ' ' + suffix : ''}`
      return `
<section style="margin:${spacing[11]} 0px ${spacing[7]};padding-left:20px">
  ${buildTitleRow(titleText3, '28px', fontSize.sm, fontSize.xl, fontWeight.bold, `${spacing[1]} ${spacing[4]}`, spacing[3], '0')}
  ${buildSubtitle('28px', spacing[3], fontSize['2xs'], '1.4px', '-10px')}
</section>`
    }

    // ── Level 4: 四级标题（####）──
    const titleText4 = `${hasPrefix ? prefix + ' ' : ''}${leaf(title)}${hasSuffix ? ' ' + suffix : ''}`
    return `
<section style="margin:${spacing[10]} 0px ${spacing[5]};padding-left:40px">
  ${buildTitleRow(titleText4, '24px', fontSize.xs, fontSize.base, fontWeight.semibold, `${spacing[1]} ${spacing[3]}`, spacing[3], '0')}
  ${buildSubtitle('24px', spacing[3], fontSize['2xs'], '1.4px', '-8px')}
</section>`
  },
}
