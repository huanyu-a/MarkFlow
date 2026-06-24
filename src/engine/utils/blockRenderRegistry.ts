import type { ThemeColors } from '../composables/useTheme'
import { esc, leaf, parseAttrs } from './helpers'
import { inlineFormat } from './inlineFormat'
import { renderCodeBlock } from './codeBlock'
import { getCachedImageUrl } from '@/lib/editor/imageStorage'
import { color, fontSize, fontWeight, letterSpacing, lineHeight, neutral, radius, shadowRaw, spacing } from '../tokens'
import {
  parseCtaBlock,
  parseCtaInline,
  parseCtaTag,
  parseCompare,
  parseCallout,
  parseGallery,
} from './components'
import { Title_DA01 } from '@engine/editor-components/Title_DA01'
import { Title_DA02 } from '@engine/editor-components/Title_DA02'
import { PTitle } from '@engine/editor-components/PTitle_DA01'
import { Breaking_DA01 } from '@engine/editor-components/Breaking_DA01'
import { Steps_DA01 } from '@engine/editor-components/Steps_DA01'
import { Steps_DA02 } from '@engine/editor-components/Steps_DA02'
import { LabeledFlow_DA01 } from '@engine/editor-components/LabeledFlow_DA01'
import { Badges_DA01 } from '@engine/editor-components/Badges_DA01'
import { Statement_DA01 } from '@engine/editor-components/Statement_DA01'
import { Lead_DA01 } from '@engine/editor-components/Lead_DA01'
import { Engage_DA01 } from '@engine/editor-components/Engage_DA01'
import { Engage_DA02 } from '@engine/editor-components/Engage_DA02'
import { Timeline_DA01 } from '@engine/editor-components/Timeline_DA01'
import { Slider_DA01 } from '@engine/editor-components/Slider_DA01'
import { Img_DA01 } from '@engine/editor-components/Img_DA01'
import { GovHeader_DA01 } from '@engine/editor-components/GovHeader_DA01'
import { Align_DA01 } from '@engine/editor-components/Align_DA01'
import { Table_DA01 } from '@engine/editor-components/Table_DA01'

export interface BlockRenderContext {
  t: ThemeColors
  md: string
  formulaMap?: Map<string, string>
  mermaidMap?: Map<string, { svg: string; error?: string }>
  pTitleLevel1List: Array<{ num: string; title: string; subtitle: string }>
  parseMarkdownFn?: (md: string, t: ThemeColors, formulaMap?: Map<string, string>, mermaidMap?: Map<string, { svg: string; error?: string }>) => string
}

export interface BlockRenderResult {
  html: string
  next: number
  warning?: string
}

export interface BlockRenderer {
  name: string
  /** 调度优先级，数字越小越优先匹配；未指定时默认 100。兜底 renderer 应设较大值（如 1000） */
  priority?: number
  match: (line: string, lines: string[], index: number) => boolean
  render: (
    ctx: BlockRenderContext,
    line: string,
    lines: string[],
    index: number,
  ) => BlockRenderResult | null
}

export function extractBlock(
  lines: string[],
  start: number,
  openTagRegex: RegExp,
  closeTagRegex: RegExp,
): { attrs: Record<string, string>; body: string; next: number; warning?: string } | null {
  const line = lines[start]
  const openMatch = line.match(openTagRegex)
  if (!openMatch) return null

  const attrs = openMatch[1] ? parseAttrs(openMatch[1]) : {}

  if (openMatch[2] !== undefined && closeTagRegex.test(openMatch[2])) {
    const text = openMatch[2].replace(closeTagRegex, '').trim()
    return { attrs, body: text, next: start + 1 }
  }

  let body = openMatch[2] !== undefined ? openMatch[2] + '\n' : ''
  let i = start + 1
  const MAX_SCAN_LINES = 50 // 最大扫描行数限制（防止未闭合标签吞掉整篇文档）
  while (i < lines.length && !closeTagRegex.test(lines[i])) {
    body += lines[i] + '\n'
    i++
    // 超过最大扫描行数，自动截断降级
    if (i - start > MAX_SCAN_LINES) {
      return {
        attrs,
        body: body.trim(),
        next: i,
        warning: `自定义标签未闭合，已扫描 ${MAX_SCAN_LINES} 行后自动截断，请检查闭合标签`
      }
    }
  }
  // 未找到闭合标签：不把剩余整篇文档当作 body 吃掉，回退为普通段落渲染
  if (i >= lines.length) {
    return null
  }
  if (i < lines.length) {
    const match = lines[i].match(closeTagRegex)
    if (match) {
      body += lines[i].substring(0, match.index)
    }
    i++
  }
  return { attrs, body: body.trim(), next: i }
}

function isImageLine(line: string | undefined): boolean {
  if (!line) return false
  const trimmed = line.trim()
  return /^\s*(<\s*!\[|!\[|<img)/i.test(trimmed)
}

function isTableStartLine(lines: string[], idx: number): boolean {
  if (idx < 0 || idx >= lines.length) return false
  const line = lines[idx]
  if (line.indexOf('|') < 0) return false
  let nextIdx = idx + 1
  while (nextIdx < lines.length && lines[nextIdx].trim() === '') {
    nextIdx++
  }
  if (nextIdx >= lines.length) return false
  return /\|[\s-:]+\|/.test(lines[nextIdx])
}

function hasMermaidBlockAbove(lines: string[], closingIdx: number): boolean {
  for (let i = closingIdx - 1; i >= 0; i--) {
    if (/^```mermaid\b/.test(lines[i].trim())) return true
    if (/^```/.test(lines[i].trim())) return false
  }
  return false
}

function hasImageAbove(lines: string[], index: number): boolean {
  for (let k = index - 1; k >= 0; k--) {
    const line = lines[k].trim()
    if (line === '') continue
    if (isImageLine(line)) return true
    if (/^```\s*$/.test(line) && hasMermaidBlockAbove(lines, k)) return true
    break
  }
  return false
}

function hasTableBelow(lines: string[], index: number): boolean {
  for (let k = index + 1; k < lines.length; k++) {
    const line = lines[k].trim()
    if (line === '') continue
    if (isTableStartLine(lines, k)) return true
    break
  }
  return false
}

const emptyLineRenderer: BlockRenderer = {
  name: 'emptyLine',
  match: (line) => line.trim() === '',
  render: (_ctx, _line, _lines, i) => ({ html: '', next: i + 1 }),
}

const separatorRenderer: BlockRenderer = {
  name: 'separator',
  match: (line) => /^---+\s*$/.test(line.trim()),
  render: (_ctx, _line, _lines, i) => ({
    html: `<section style="border:none;height:1px;background:linear-gradient(90deg,transparent,${neutral.gray350},transparent);margin:${spacing[10]} 0px"></section>`,
    next: i + 1,
  }),
}

const stepsRenderer: BlockRenderer = {
  name: 'steps',
  match: (line) => /^<steps\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block =
      extractBlock(lines, i, /^<steps\b([^>]*)>(.*)$/, /<\/steps>/) ||
      extractBlock(lines, i, /^<steps\b([^>]*)>/, /<\/steps>/)
    if (!block) return null
    const stepCount = block.body
      .split('\n')
      .filter((l: string) => /^-\s*.+\s*\|\s*.+/.test(l.trim())).length
    const useDA02 = block.attrs.type === 'DA02' || (!block.attrs.type && stepCount > 3)
    const renderer = useDA02 ? Steps_DA02 : Steps_DA01
    return { html: renderer.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

const statementRenderer: BlockRenderer = {
  name: 'statement',
  match: (line) => /^<statement\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block = extractBlock(lines, i, /^<statement\b([^>]*)>(.*)$/, /<\/statement>/)
    if (!block) return null
    return { html: Statement_DA01.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

const badgesRenderer: BlockRenderer = {
  name: 'badges',
  match: (line) => /^<badges\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block = extractBlock(lines, i, /^<badges\b([^>]*)>(.*)$/, /<\/badges>/)
    if (!block) return null
    return { html: Badges_DA01.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

const ctaContainerRenderer: BlockRenderer = {
  name: 'ctaContainer',
  match: (line) => /^:::\s*cta\b/.test(line),
  render: (ctx, _line, lines, i) => parseCtaBlock(lines, i, ctx.t),
}

const leadContainerRenderer: BlockRenderer = {
  name: 'leadContainer',
  match: (line) => /^:::\s*lead\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block = extractBlock(lines, i, /^:::\s*lead\b(.*)$/, /^:::\s*$/)
    if (!block) return null
    return { html: Lead_DA01.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

// ─── ::: 容器语法 (tip / note / warning / info / caution / important / details) ───
const HINT_TYPES = ['tip', 'note', 'warning', 'info', 'caution', 'important'] as const
const hintContainerRenderer: BlockRenderer = {
  name: 'hintContainer',
  priority: 5,
  match: (line) => new RegExp(`^:{3,4}\\s*(${HINT_TYPES.join('|')})\\b`).test(line),
  render: (ctx, line, lines, i) => {
    // Support both ::: and :::: prefixes
    const m = line.match(/^(:{3,4})\s*(tip|note|warning|info|caution|important)\b\s*(.*)/)
    if (!m) return null
    const colonCount = m[1].length // 3 or 4
    const type = m[2]
    const customTitle = m[3].trim()
    // 收集容器内容直到相同数量的 :::
    const closeRe = new RegExp(`^:{${colonCount}}\\s*$`)
    const contentLines: string[] = []
    let j = i + 1
    while (j < lines.length && !closeRe.test(lines[j])) {
      contentLines.push(lines[j])
      j++
    }
    if (j >= lines.length) return null // 未闭合
    const body = contentLines.join('\n').trim()

    // 渲染容器正文：优先用 parseMarkdownFn（完整 markdown），否则用 inlineFormat
    const renderBody = (text: string): string => {
      if (!text) return ''
      return ctx.parseMarkdownFn
        ? ctx.parseMarkdownFn(text, ctx.t, ctx.formulaMap, ctx.mermaidMap)
        : inlineFormat(text, ctx.t, ctx.formulaMap)
    }

    const icons: Record<string, string> = { tip: '💡', note: '📝', info: 'ℹ️', warning: '⚠️', caution: '🚨', important: '❗' }
    const bgs: Record<string, string> = { tip: '#f0fdf4', note: '#eff6ff', info: '#f0f9ff', warning: '#fffbea', caution: '#fef2f2', important: '#f5f3ff' }
    const accents: Record<string, string> = { tip: '#16a34a', note: '#2563eb', info: '#0ea5e9', warning: '#ea580c', caution: '#dc2626', important: '#7c3aed' }
    const defaultTitles: Record<string, string> = { tip: '提示', note: '注意', info: '信息', warning: '警告', caution: '危险', important: '重要' }

    const title = customTitle || defaultTitles[type] || type
    const bg = bgs[type] || '#f0f4fa'
    const accent = accents[type] || ctx.t.accent
    let html = `<section style="margin:${spacing[7]} 0px;padding:${spacing[7]} ${spacing[6]};background:${bg};border-left:4px solid ${accent};border-radius:0px ${radius.xl} ${radius.xl} 0px">`
    html += `<p style="margin:0px 0px ${spacing[2]};font-size:${fontSize.xl};font-weight:${fontWeight.bold};color:${accent}">${esc((icons[type] || '') + ' ' + title)}</p>`
    if (body) {
      html += `<section style="font-size:${fontSize.xl};color:${neutral.gray700};line-height:${lineHeight.looser};letter-spacing:${letterSpacing.wider};text-align:justify">${renderBody(body)}</section>`
    }
    html += `</section>`
    return { html, next: j + 1 }
  },
}

// ─── ::: 对齐容器 (center / right / left) ───
const tableContainerRenderer: BlockRenderer = {
  name: 'tableContainer',
  priority: 5,
  match: (line) => /^:{3,4}\s*table\b/.test(line),
  render: (_ctx, line, lines, i) => {
    const m = line.match(/^(:{3,4})\s*table\b\s*(.*)/)
    if (!m) return null
    const colonCount = m[1].length
    const rest = m[2].trim()
    const closeRe = new RegExp(`^:{${colonCount}}\\s*$`)
    const contentLines: string[] = []
    let j = i + 1
    while (j < lines.length && !closeRe.test(lines[j])) {
      contentLines.push(lines[j])
      j++
    }
    if (j >= lines.length) return null

    // 解析 ::: header 中的属性
    const attrs: Record<string, string> = {}
    let caption = ''
    const attrRe = /(\w[\w-.]*)=("[^"]*"|\S+)/g
    let attrMatch: RegExpExecArray | null
    let lastIndex = 0
    while ((attrMatch = attrRe.exec(rest))) {
      const key = attrMatch[1]
      let val = attrMatch[2]
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      attrs[key] = val
      lastIndex = attrMatch.index + attrMatch[0].length
    }
    caption = rest.substring(lastIndex).trim()

    // 构建 markdown 表格 body 传给 Table_DA01.render
    const markdownBody = contentLines.join('\n').trim()

    if (!markdownBody) return null

    const t = _ctx.t

    // Footer：检查 ::: 闭合后的下一行
    j++ // skip closing :::
    let footer = ''
    if (j < lines.length) {
      const nextLine = lines[j].trim()
      if (nextLine && !nextLine.includes('|') && !/^:{3,4}/.test(nextLine)) {
        footer = nextLine
        j++
      }
    }

    let html = ''

    // Caption
    if (caption) {
      html += `<section style="margin-bottom:${spacing[3]};padding:${spacing[3]} 0;text-align:center"><span style="display:inline-flex;align-items:center;gap:6px;font-size:${fontSize.sm};font-weight:${fontWeight.semibold};color:${t.accent}"><span style="display:inline-block;width:3px;height:14px;border-radius:2px;background:${t.accent}"></span>${esc(caption)}</span></section>`
    }

    // 使用 Table_DA01 渲染表格（返回完整闭合 HTML）
    html += Table_DA01.render(attrs, markdownBody, t)

    // Footer
    if (footer) {
      html += `<p style="margin:${spacing[3]} ${spacing[3]} 0;text-align:right;font-size:11px;color:#94a3b8">${esc(footer)}</p>`
    }

    return { html, next: j }
  },
}

// ─── <align> 对齐标签 ───
const alignRenderer: BlockRenderer = {
  name: 'alignTag',
  priority: 5,
  match: (line) => /^<align\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block = extractBlock(lines, i, /^<align\b([^>]*)>(.*)$/, /<\/align>/)
    if (!block) return null
    return { html: Align_DA01.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

const leadTagRenderer: BlockRenderer = {
  name: 'leadTag',
  match: (line) => /^<lead\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block = extractBlock(lines, i, /^<lead\b([^>]*)>(.*)$/, /<\/lead>/)
    if (!block) return null
    return { html: Lead_DA01.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

const breakingRenderer: BlockRenderer = {
  name: 'breaking',
  match: (line) => /^<breaking\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block =
      extractBlock(lines, i, /^<breaking\b([^>]*)>(.*)$/, /<\/breaking>/) ||
      extractBlock(lines, i, /^<breaking\b([^>]*)>/, /<\/breaking>/)
    if (!block) return null
    return { html: Breaking_DA01.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

const ctaRenderer: BlockRenderer = {
  name: 'cta',
  match: (line) => /^<cta\b/.test(line),
  render: (ctx, line, lines, i) => {
    if (/<\/cta>/.test(line)) {
      return parseCtaInline(lines, i, ctx.t)
    }
    return parseCtaTag(lines, i, ctx.t)
  },
}

const compareRenderer: BlockRenderer = {
  name: 'compare',
  match: (line) => /^<compare\b/.test(line),
  render: (ctx, _line, lines, i) => parseCompare(lines, i, ctx.t),
}

const readingPathRenderer: BlockRenderer = {
  name: 'readingPath',
  match: (line) => /^<reading-path\s*\/?>/.test(line) || /^<reading-path>/.test(line),
  render: (ctx, line, lines, i) => {
    const { t, pTitleLevel1List } = ctx
    let html = ''
    if (pTitleLevel1List.length > 1) {
      html += `<section style="margin:0px 0px ${spacing[12]}"><section>`
      html += `<section style="display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:${spacing[6]};gap:${spacing[5]}"><section style="flex-shrink:0"><p style="margin:0px;padding:0px 0px ${spacing[2]};font-size:${fontSize['2xs']};color:${color.inkMuted};text-transform:uppercase;letter-spacing:${letterSpacing['4xl']};font-weight:${fontWeight.extrabold};white-space:nowrap">${leaf('READING PATH')}</p><p style="margin:0px;font-size:${fontSize.xl};line-height:${lineHeight.snug};color:${color.textPrimary};font-weight:${fontWeight.extrabold}">${leaf('阅读路线')}</p></section><p style="margin:0px;font-size:${fontSize['2xs']};color:${color.inkFaint};white-space:nowrap">${leaf(pTitleLevel1List.length + ' 个章节')}</p></section>`
      html += `<section style="padding:${spacing[6]} ${spacing[5]} ${spacing[5]};border:1px solid ${neutral.gray250};border-radius:${radius['3xl']};background:linear-gradient(${color.surface} 0%,${neutral.gray100} 100%);${shadowRaw.cardHover};overflow-x:auto;white-space:nowrap;font-size:0px">`
      pTitleLevel1List.forEach((item, idx) => {
        const label = item.title.replace(/::.*/, '').trim().replace(/^\d+\s*/, '')
        const num = item.num || String(idx + 1).padStart(2, '0')
        const isActive = idx === 0
        html += `<section style="display:inline-flex;vertical-align:middle;align-items:center">`
        html += `<section style="display:inline-block;vertical-align:top;width:126px;white-space:normal;text-align:center">`
        html += `<section style="display:flex;justify-content:center;margin-bottom:${spacing[4]}">`
        html += `<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:${radius.full};background:${isActive ? t.accent : color.surface};color:${isActive ? color.surface : t.accent};border:1px solid ${isActive ? t.accent : '#dbe3ee'};font-size:${fontSize.xs};font-weight:${fontWeight.black};letter-spacing:${letterSpacing.xl};white-space:nowrap">${leaf(num)}</span>`
        html += `</section>`
        html += `<p style="margin:0px;font-size:${fontSize.base};line-height:1.55;color:${isActive ? color.textPrimary : color.inkStrong};font-weight:${fontWeight.extrabold};letter-spacing:${letterSpacing.normal};white-space:normal;word-break:break-all">${leaf(label)}</p>`
        html += `</section>`
        if (idx < pTitleLevel1List.length - 1) {
          html += `<span style="display:inline-block;vertical-align:middle;width:32px;height:1px;line-height:1px;margin:0px ${spacing[3]};background:linear-gradient(90deg,${neutral.gray500}59,${neutral.gray500}d9);color:transparent;overflow:hidden">${leaf('-')}</span>`
        }
        html += `</section>`
      })
      html += `</section></section></section>`
    }
    if (
      /^<reading-path>/.test(line) &&
      i + 1 < lines.length &&
      /^<\/reading-path>/.test(lines[i + 1])
    ) {
      return { html, next: i + 2 }
    }
    return { html, next: i + 1 }
  },
}

const titleRenderer: BlockRenderer = {
  name: 'title',
  match: (line) => /^<title\b/.test(line),
  render: (ctx, _line, lines, i) => {
    let block = lines[i]
    let j = i
    while (!/<\/title>/.test(block) && j + 1 < lines.length) {
      j++
      block += '\n' + lines[j]
    }
    const titleMatch = block.match(/^<title\b([^>]*)>([\s\S]*?)<\/title>/)
    if (!titleMatch) {
      // 未闭合：回退为普通段落渲染，避免吞掉后续内容
      return null
    }
    let html = ''
    const attrs = parseAttrs(titleMatch[1])
    const body = titleMatch[2].trim()
    const type = (attrs.type || 'DA01').toUpperCase()
    if (type === 'DA02') {
      html += Title_DA02.render(attrs, body, ctx.t, ctx.md)
    } else {
      html += Title_DA01.render(attrs, body, ctx.t, ctx.md)
    }
    return { html, next: j + 1 }
  },
}

const pTitleRenderer: BlockRenderer = {
  name: 'pTitle',
  match: (line) => /^<p-title\b/.test(line),
  render: (ctx, _line, lines, i) => {
    let block = lines[i]
    let j = i
    while (!/<\/p-title>/.test(block) && j + 1 < lines.length) {
      j++
      block += '\n' + lines[j]
    }
    const ptMatch = block.match(/^<p-title\b([^>]*)>([\s\S]*?)<\/p-title>/)
    if (!ptMatch) {
      // 未闭合：回退为普通段落渲染，避免吞掉后续内容
      return null
    }
    const attrs = parseAttrs(ptMatch[1])
    const body = ptMatch[2].trim()
    const html = PTitle.render(attrs, body, ctx.t).replace('<section', '<section data-block="ptitle"')
    return { html, next: j + 1 }
  },
}

const galleryRenderer: BlockRenderer = {
  name: 'gallery',
  match: (line) => /^<\s*!\[/.test(line),
  render: (_ctx, _line, lines, i) => parseGallery(lines, i),
}

const calloutRenderer: BlockRenderer = {
  name: 'callout',
  match: (line) => /^>\s*\[!?(TIP|NOTE|INFO|WARNING|CAUTION|IMPORTANT)\]/i.test(line),
  render: (ctx, _line, lines, i) => parseCallout(lines, i, ctx.t),
}

const quoteRenderer: BlockRenderer = {
  name: 'quote',
  match: (line) => /^>/.test(line),
  render: (ctx, _line, lines, i) => {
    const { t, formulaMap } = ctx
    const ql: string[] = []
    let j = i
    while (j < lines.length && /^>/.test(lines[j])) {
      ql.push(lines[j].replace(/^>\s?/, ''))
      j++
    }
    let html = `<section style="margin:${spacing[6]} 0px;padding:${spacing[5]} ${spacing[7]};background:${neutral.gray150};border-left:3px solid ${t.accent};border-radius:0px ${radius.md} ${radius.md} 0px;color:${neutral.gray700};font-size:${fontSize.xl}">`
    ql.forEach((l) => {
      html += `<section><p style="margin:${spacing[1]} 0px;line-height:${lineHeight.loosest};text-align:justify;letter-spacing:${letterSpacing.wider}">${inlineFormat(l, t, formulaMap)}</p></section>`
    })
    html += `</section>`
    return { html, next: j }
  },
}

const caseFlowTagRenderer: BlockRenderer = {
  name: 'caseFlowTag',
  match: (line) => /^<case-flow\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block =
      extractBlock(lines, i, /^<case-flow\b([^>]*)>(.*)$/, /<\/case-flow>/) ||
      extractBlock(lines, i, /^<case-flow\b([^>]*)>/, /<\/case-flow>/)
    if (!block) return null
    return { html: LabeledFlow_DA01.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

const caseFlowInlineRenderer: BlockRenderer = {
  name: 'caseFlowInline',
  match: (line) => /^-\s*\[[^\]]+\]/.test(line),
  render: (ctx, _line, lines, i) => {
    const caseLines: string[] = []
    let j = i
    while (j < lines.length && /^-\s*\[[^\]]+\]/.test(lines[j])) {
      caseLines.push(lines[j])
      j++
    }
    return { html: LabeledFlow_DA01.render({}, caseLines.join('\n'), ctx.t), next: j }
  },
}

const timelineRenderer: BlockRenderer = {
  name: 'timeline',
  match: (line) => /^<timeline\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block =
      extractBlock(lines, i, /^<timeline\b([^>]*)>(.*)$/, /<\/timeline>/) ||
      extractBlock(lines, i, /^<timeline\b([^>]*)>/, /<\/timeline>/)
    if (!block) return null
    return { html: Timeline_DA01.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

const sliderRenderer: BlockRenderer = {
  name: 'slider',
  match: (line) => /^<slider\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block = extractBlock(lines, i, /^<slider\b([^>]*)>(.*)$/, /<\/slider>/)
    if (!block) return null
    return { html: Slider_DA01.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

const engageRenderer: BlockRenderer = {
  name: 'engage',
  match: (line) => /^:\s*engage\b/.test(line) || /^<engage\b/.test(line),
  render: (ctx, line, _lines, i) => {
    const attrs = parseAttrs(line)
    if (attrs.type && attrs.type.toUpperCase() === 'DA02') {
      return { html: Engage_DA02.render(attrs, '', ctx.t), next: i + 1 }
    }
    return { html: Engage_DA01.render(attrs, '', ctx.t), next: i + 1 }
  },
}

const headingRenderer: BlockRenderer = {
  name: 'heading',
  match: (line) => /^#{1,6}\s+/.test(line),
  render: (ctx, line, _lines, i) => {
    const { t, formulaMap } = ctx
    const h1m = line.match(/^#\s+(.+)/)
    if (h1m) {
      return {
        html: `<h1 style="margin:0px 0px ${spacing[7]};font-size:${fontSize['6xl']};font-weight:${fontWeight.bold};color:${color.textPrimary};line-height:${lineHeight.normal}">${inlineFormat(h1m[1], t, formulaMap)}</h1>`,
        next: i + 1,
      }
    }
    const h2m = line.match(/^##\s+(.+)/)
    if (h2m) {
      return {
        html: `<h2 style="margin:${spacing[11]} 0px ${spacing[5]};font-size:${fontSize['4xl']};font-weight:${fontWeight.bold};color:${color.textPrimary};line-height:${lineHeight.normal}">${inlineFormat(h2m[1], t, formulaMap)}</h2>`,
        next: i + 1,
      }
    }
    const h3m = line.match(/^###\s+(.+)/)
    if (h3m) {
      return {
        html: `<h3 style="margin:${spacing[10]} 0px ${spacing[4]};font-size:${fontSize['2xl']};font-weight:${fontWeight.bold};color:${color.inkStrong};line-height:${lineHeight.normal}">${inlineFormat(h3m[1], t, formulaMap)}</h3>`,
        next: i + 1,
      }
    }
    const h4m = line.match(/^####\s+(.+)/)
    if (h4m) {
      return {
        html: `<h4 style="margin:${spacing[9]} 0px ${spacing[3]};font-size:${fontSize.lg};font-weight:${fontWeight.bold};color:${color.textQuaternary};line-height:${lineHeight.normal}">${inlineFormat(h4m[1], t, formulaMap)}</h4>`,
        next: i + 1,
      }
    }
    const h5m = line.match(/^#####\s+(.+)/)
    if (h5m) {
      return {
        html: `<h5 style="margin:${spacing[8]} 0px ${spacing[2]};font-size:${fontSize.base};font-weight:${fontWeight.bold};color:${color.textQuaternary};line-height:${lineHeight.normal}">${inlineFormat(h5m[1], t, formulaMap)}</h5>`,
        next: i + 1,
      }
    }
    const h6m = line.match(/^######\s+(.+)/)
    if (h6m) {
      return {
        html: `<h6 style="margin:${spacing[8]} 0px ${spacing[2]};font-size:${fontSize.sm};font-weight:${fontWeight.bold};color:${color.textQuaternary};line-height:${lineHeight.normal};text-transform:uppercase;letter-spacing:${letterSpacing.wider}">${inlineFormat(h6m[1], t, formulaMap)}</h6>`,
        next: i + 1,
      }
    }
    return { html: '', next: i + 1 }
  },
}

const blockFormulaRenderer: BlockRenderer = {
  name: 'blockFormula',
  match: (line) => /^\$\$/.test(line),
  render: (ctx, line, lines, i) => {
    const { formulaMap } = ctx
    const resolveSvg = (f: string) => {
      if (formulaMap) {
        const svg = formulaMap.get(`b:${f}`)
        if (svg) return svg
      }
      return `<code style="display:inline-block;background:${neutral.gray100};padding:${spacing[2]} ${spacing[5]};border-radius:${radius.md};font-size:${fontSize.md};font-family:SF Mono,Consolas,monospace;color:#e83e8c;max-width:100%;overflow-x:auto;white-space:nowrap">$$${esc(f)}$$</code>`
    }
    const singleMatch = line.match(/^\$\$(.+?)\$\$/)
    if (singleMatch) {
      const formula = singleMatch[1].trim()
      return {
        html: `<section style="text-align:center;margin:${spacing[10]} 0;overflow-x:auto;color:${neutral.gray1000}">${resolveSvg(formula)}</section>`,
        next: i + 1,
      }
    }
    let j = i + 1
    const formulaLines: string[] = []
    while (j < lines.length && !/^\$\$/.test(lines[j])) {
      formulaLines.push(lines[j])
      j++
    }
    if (j < lines.length) j++
    const formula = formulaLines.join('\n').trim()
    return {
      html: `<section style="text-align:center;margin:${spacing[10]} 0;overflow-x:auto;color:${neutral.gray1000}">${resolveSvg(formula)}</section>`,
      next: j,
    }
  },
}

const codeBlockRenderer: BlockRenderer = {
  name: 'codeBlock',
  match: (line) => /^```/.test(line),
  render: (ctx, line, lines, i) => {
    const { mermaidMap } = ctx
    const lang = line.replace(/^```/, '').trim()
    let j = i + 1
    let code = ''
    while (j < lines.length && !/^```/.test(lines[j])) {
      code += lines[j] + '\n'
      j++
    }
    if (j < lines.length) j++
    let html = ''
    if (lang === 'mermaid') {
      const source = code.replace(/\s+$/, '')
      const entry = mermaidMap?.get(`m:${source}`)
      if (entry?.svg) {
        html += `<section data-block="mermaid" style="max-width:100%;margin:${spacing[7]} auto;text-align:center;break-inside:avoid"><div class="m2v-mermaid-figure" style="width:100%;max-width:100%;max-height:var(--m2v-mermaid-max-height,none);overflow:hidden">${entry.svg}</div></section>`
      } else if (entry?.error) {
        html += `<section data-block="mermaid-error" style="background:${color.errorBg};border-left:3px solid ${color.errorBorder};padding:${spacing[4]} ${spacing[6]};margin:${spacing[6]} 0;font-size:${fontSize.sm};color:${color.errorText}">图表渲染失败：${esc(entry.error)}</section>`
        html += renderCodeBlock(code, 'mermaid')
      } else {
        html += renderCodeBlock(code, 'mermaid')
      }
    } else {
      html += renderCodeBlock(code, lang)
    }
    return { html, next: j }
  },
}

const tableRenderer: BlockRenderer = {
  name: 'table',
  match: (line, lines, i) =>
    line.indexOf('|') >= 0 &&
    i + 1 < lines.length &&
    /\|[\s-:]+\|/.test(lines[i + 1]),
  render: (ctx, line, lines, i) => {
    const { t, formulaMap } = ctx
    const isContinuation = i > 0 && lines[i - 1].includes('（续表）')
    const parseRow = (rowStr: string) => {
      let s = rowStr.trim()
      if (s.startsWith('|')) s = s.substring(1)
      if (s.endsWith('|')) s = s.substring(0, s.length - 1)
      return s.split('|').map((x) => x.trim())
    }
    const headers = parseRow(line)
    let j = i + 2
    const rows: string[][] = []
    while (j < lines.length && lines[j].indexOf('|') >= 0 && lines[j].trim() !== '') {
      rows.push(parseRow(lines[j]))
      j++
    }
    const colCount = Math.max(headers.length, ...rows.map(r => r.length), 2)

    let html = ''
    if (isContinuation) {
      html += `<section style="margin:0px 0px ${spacing[4]};text-align:center;font-size:${fontSize.sm};color:${color.inkMuted};font-style:italic">（续表）</section>`
    }

    // 卡片容器 — 圆角阴影风格
    html += `<section style="margin:${spacing[7]} 0px;background:#fff;border-radius:${radius['2xl']};overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)">`
    html += `<section style="overflow-x:auto"><table style="border-collapse:collapse;width:100%">`

    // 表头 — 渐变底色
    html += `<thead><tr>`
    headers.forEach((h, hi) => {
      const isFirst = hi === 0
      const isLast = hi === headers.length - 1
      html += `<th style="vertical-align:top;padding:13px ${spacing[6]};text-align:left;font-size:13px;font-weight:${fontWeight.semibold};color:#fff;background:${t.accent};${isFirst ? `border-radius:${radius['2xl']} 0 0 0` : ''}${isLast ? `border-radius:0 ${radius['2xl']} 0 0` : ''};letter-spacing:0.3px">${inlineFormat(h, t, formulaMap) || '&nbsp;'}</th>`
    })
    for (let k = headers.length; k < colCount; k++) {
      html += `<th style="vertical-align:top;padding:13px ${spacing[6]};text-align:left;font-size:13px;font-weight:${fontWeight.semibold};color:#fff;background:${t.accent};border-radius:0 ${radius['2xl']} 0 0;letter-spacing:0.3px">&nbsp;</th>`
    }
    html += `</tr></thead>`

    // 表体
    // 检测表格后的 footer 行
    let footer = ''
    if (j < lines.length && lines[j].trim() && !lines[j].includes('|')) {
      footer = lines[j].trim()
      j++
    }

    html += `<tbody>`
    rows.forEach((row, ri) => {
      const isLastRow = ri === rows.length - 1
      html += `<tr>`
      row.forEach((cell, ci) => {
        const isFirst = ci === 0
        const isLast = ci === row.length - 1
        const isLastCell = isLastRow && isLast
        const isFirstCell = isLastRow && isFirst
        const borderStyle = (isLastRow && !footer) ? 'border-bottom:none' : `border-bottom:1px solid ${neutral.gray100}`
        const radiusStyle = (isFirstCell && !footer) ? `border-radius:0 0 0 ${radius['2xl']}` : (isLastCell && !footer) ? `border-radius:0 0 ${radius['2xl']} 0` : ''
        const bgStyle = ri % 2 === 1 ? `background:${neutral.gray50}` : 'background:#fff'
        html += `<td style="vertical-align:top;padding:11px ${spacing[6]};text-align:left;font-size:13px;color:#475569;${borderStyle};${radiusStyle};${bgStyle}">${inlineFormat(cell, t, formulaMap) || '&nbsp;'}</td>`
      })
      for (let k = row.length; k < colCount; k++) {
        html += `<td style="vertical-align:top;padding:11px ${spacing[6]};text-align:left;font-size:13px;color:#475569;${(isLastRow && !footer) ? 'border-bottom:none' : `border-bottom:1px solid ${neutral.gray100}`}">&nbsp;</td>`
      }
      html += `</tr>`
    })
    html += `</tbody>`

    // Footer
    if (footer) {
      html += `<tfoot><tr><td colspan="${colCount}" style="padding:9px ${spacing[6]};text-align:center;font-size:11px;color:#94a3b8;background:linear-gradient(180deg,${neutral.gray50} 0%,#f1f5f9 100%);border-top:1px solid ${neutral.gray200};border-radius:0 0 ${radius['2xl']} ${radius['2xl']}">${esc(footer)}</td></tr></tfoot>`
    }

    html += `</table></section></section>`
    return { html, next: j }
  },
}

const unorderedListRenderer: BlockRenderer = {
  name: 'unorderedList',
  match: (line) => /^\s*[-*+]\s/.test(line),
  render: (ctx, _line, lines, i) => {
    const { t, formulaMap } = ctx
    let j = i
    let html = `<section style="margin:${spacing[4]} 0px;padding-left:${spacing[9]}">`
    while (j < lines.length && /^\s*[-*+]\s/.test(lines[j])) {
      const li = lines[j].replace(/^\s*[-*+]\s/, '')
      const cb = li.match(/^\[([ x])\]\s*(.*)/)
      if (cb) {
        const isChecked = cb[1] === 'x'
        const uncheckedBorder = t.border === color.borderDefault ? color.inkFaint : t.border
        const checkSvg = isChecked
          ? '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 9l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="3" stroke="${uncheckedBorder}" stroke-width="1.5" fill="none"/></svg>`
        html += `<section style="margin:${spacing[1]} 0px"><span style="display:inline-flex;align-items:center;gap:${spacing[3]}"><span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;${isChecked ? `background:${t.accent};border-radius:${radius.sm}` : ''}">${checkSvg}</span><span>${inlineFormat(cb[2], t, formulaMap)}</span></span></section>`
      } else {
        html += `<section style="margin:${spacing[1]} 0px;line-height:${lineHeight.loosest};letter-spacing:${letterSpacing.wider};display:flex;align-items:flex-start"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:${t.accent};margin-right:${spacing[5]};margin-top:${spacing[5]};flex-shrink:0"></span><span style="flex:1">${inlineFormat(li, t, formulaMap)}</span></section>`
      }
      j++
    }
    html += `</section>`
    return { html, next: j }
  },
}

const orderedListRenderer: BlockRenderer = {
  name: 'orderedList',
  match: (line) => /^\s*\d+\.\s/.test(line),
  render: (ctx, _line, lines, i) => {
    const { t, formulaMap } = ctx
    let j = i
    let html = `<section style="margin:${spacing[4]} 0px;padding-left:${spacing[9]}">`
    while (j < lines.length && /^\s*\d+\.\s/.test(lines[j])) {
      const match = lines[j].match(/^\s*(\d+)\.\s/)
      const num = match ? match[1] : '1'
      const content = lines[j].replace(/^\s*\d+\.\s/, '')
      html += `<section style="margin:${spacing[1]} 0px;line-height:${lineHeight.loosest};letter-spacing:${letterSpacing.wider};display:flex;align-items:flex-start"><span style="color:${t.accent};font-weight:${fontWeight.extrabold};margin-right:${spacing[3]};flex-shrink:0;min-width:16px">${num}.</span><span style="flex:1">${inlineFormat(content, t, formulaMap)}</span></section>`
      j++
    }
    html += `</section>`
    return { html, next: j }
  },
}

const imageRenderer: BlockRenderer = {
  name: 'image',
  match: (line) => /^!\[([^\]]*)\]\(([^)]+)\)(?:\[([^\]]+)\])?/.test(line),
  render: (_ctx, line, _lines, i) => {
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\[([^\]]+)\])?/)
    if (!imgMatch) return { html: '', next: i + 1 }
    const [, alt, src, size] = imgMatch
    let resolvedSrc = src
    if (src.startsWith('img://')) {
      const id = src.replace('img://', '')
      resolvedSrc = getCachedImageUrl(id) || src
    }
    let html = ''
    if (size) {
      const parts = size.split(/\s+/)
      html += `<section style="max-height:${parts[1] || '250px'};overflow-y:auto;border-radius:${radius.lg};margin:${spacing[5]} 0px;display:flex;justify-content:center"><img src="${esc(resolvedSrc)}" alt="${esc(alt)}" style="width:${parts[0] || '100%'};display:block;margin:0 auto"></section>`
    } else {
      html += `<section style="margin:${spacing[5]} 0px;display:flex;justify-content:center"><img src="${esc(resolvedSrc)}" alt="${esc(alt)}" style="max-width:100%;border-radius:${radius.md};display:block;margin:0 auto"></section>`
    }
    return { html, next: i + 1 }
  },
}

const imgTagRenderer: BlockRenderer = {
  name: 'imgTag',
  match: (line) => /^<img\s/.test(line.trim()),
  render: (ctx, line, _lines, i) => {
    const attrs = parseAttrs(line)
    return { html: Img_DA01.render(attrs, '', ctx.t), next: i + 1 }
  },
}

const govHeaderRenderer: BlockRenderer = {
  name: 'govHeader',
  match: (line) => /^<gov-header\b/.test(line),
  render: (ctx, _line, lines, i) => {
    const block = extractBlock(lines, i, /^<gov-header\b([^>]*)>(.*)$/, /<\/gov-header>/)
    if (!block) return null
    return { html: GovHeader_DA01.render(block.attrs, block.body, ctx.t), next: block.next, warning: block.warning }
  },
}

const paragraphRenderer: BlockRenderer = {
  name: 'paragraph',
  // 兜底 renderer：仅当所有专用 renderer 都未命中时才处理，显式标记最低优先级
  priority: 1000,
  match: () => true,
  render: (ctx, line, lines, i) => {
    const { t, formulaMap } = ctx
    const trimmedLine = line.trim()
    const cleanLine = trimmedLine
      .replace(/^(\*\*|\*|__|_)*/, '')
      .replace(/(\*\*|\*|__|_)*$/, '')
      .trim()
    const separatorMatch = cleanLine.match(
      /^\s*(图|表|Fig|Table|Figure)\.?\s*(\d+|[一二三四五六七八九十百]+)([:：.\s—-]+)/i,
    )
    let isCaption = false
    let isTableCaption = false
    if (separatorMatch) {
      isTableCaption = /^\s*(表|Table)/i.test(cleanLine)
      const separator = separatorMatch[3]
      const isOnlySpace = /^\s+$/.test(separator)
      const hasVerb = /展示|显示|展现|是|有|如下图|如下表/g.test(cleanLine)
      const isValidPattern = !(isOnlySpace && (cleanLine.length > 60 || hasVerb))
      if (isValidPattern) {
        if (isTableCaption) {
          isCaption = hasTableBelow(lines, i)
        } else {
          isCaption = hasImageAbove(lines, i)
        }
      }
    }
    let html = ''
    if (isCaption) {
      const captionClass = isTableCaption
        ? 'document-caption document-caption-table'
        : 'document-caption document-caption-image'
      const captionKind = isTableCaption ? 'table' : 'image'
      const sectionStyle = isTableCaption ? `margin:${spacing[7]} 0px ${spacing[4]}` : `margin:${spacing[4]} 0px ${spacing[7]}`
      html += `<section data-caption-kind="${captionKind}" style="${sectionStyle};display:flex;justify-content:center;width:100%"><p class="${captionClass}" style="margin:0px;font-size:${fontSize.base};color:${color.inkMuted};line-height:${lineHeight.relaxed};text-align:center;white-space:nowrap">${inlineFormat(trimmedLine, t, formulaMap)}</p></section>`
    } else {
      html += `<section style="margin:0px 0px ${spacing[10]}"><p style="margin:0px;font-size:${fontSize.xl};color:${color.textTertiary};line-height:${lineHeight.document};letter-spacing:${letterSpacing.wider};text-align:justify;overflow-wrap:break-word">${inlineFormat(line, t, formulaMap)}</p></section>`
    }
    return { html, next: i + 1 }
  },
}

export function createDefaultBlockRenderers(): BlockRenderer[] {
  // 按 priority 升序排列（数字越小越优先匹配），未指定 priority 的默认 100。
  // 显式排序避免新增 renderer 时因数组顺序错误引入静默 bug。
  return [
    emptyLineRenderer,
    separatorRenderer,
    stepsRenderer,
    statementRenderer,
    badgesRenderer,
    ctaContainerRenderer,
    leadContainerRenderer,
    hintContainerRenderer,
    tableContainerRenderer,
    alignRenderer,
    leadTagRenderer,
    breakingRenderer,
    ctaRenderer,
    compareRenderer,
    readingPathRenderer,
    titleRenderer,
    pTitleRenderer,
    galleryRenderer,
    calloutRenderer,
    quoteRenderer,
    caseFlowTagRenderer,
    caseFlowInlineRenderer,
    timelineRenderer,
    sliderRenderer,
    engageRenderer,
    headingRenderer,
    blockFormulaRenderer,
    codeBlockRenderer,
    tableRenderer,
    unorderedListRenderer,
    orderedListRenderer,
    imageRenderer,
    imgTagRenderer,
    govHeaderRenderer,
    paragraphRenderer,
  ].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
}
