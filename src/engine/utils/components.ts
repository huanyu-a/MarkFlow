import type { ThemeColors } from '../composables/useTheme'
import { esc, leaf, parseAttrs } from './helpers'
import { inlineFormat } from './inlineFormat'
import { color, fontSize, fontWeight, letterSpacing, lineHeight, neutral, radius, shadowRaw, spacing } from '../tokens'
import { Compare_DA01 } from '@engine/editor-components/Compare_DA01'
import { CTA_DA01 } from '@engine/editor-components/Cta_DA01'
import { Badges_DA01 } from '@engine/editor-components/Badges_DA01'

export function renderFrontMatter(
  meta: Record<string, string>,
  fullText: string,
  t: ThemeColors,
): string {
  const cleanText = fullText
    ? fullText
        .replace(/---[\s\S]*?---\s*/, '')
        .replace(/[#*`>[\]!|_~=-]/g, '')
        .replace(/\s+/g, '')
    : ''
  const charCount = cleanText.length
  const readMin = Math.max(1, Math.ceil(charCount / 400))
  let html = `<section style="margin:0px 0px ${spacing[12]};${shadowRaw.card};border-radius:${radius['3xl']};border:1px solid ${neutral.gray250};overflow:hidden;background:linear-gradient(135deg,${neutral.gray100} 0%,rgb(238,244,251) 100%)">`
  html += `<section style="padding:${spacing[9]};background:${color.surface}eb">`
  html += `<section class="tableWrapper"><table style="border:0px;border-collapse:collapse;table-layout:fixed;min-width:115px;width:100%;margin-bottom:0"><colgroup><col><col style="width:90px;"></colgroup><tbody><tr>`
  html += `<td valign="top" align="left" style="vertical-align:top;border:0px;padding:0px;text-align:left">`
  if (meta.badge)
    html += `<p style="margin:0px;padding:0px 0px ${spacing[4]};font-size:${fontSize['2xs']};color:${t.accent};letter-spacing:${letterSpacing['3xl']};text-transform:uppercase;font-weight:${fontWeight.extrabold}">${leaf(meta.badge)}</p>`
  if (meta.title)
    html += `<p style="margin:0px;font-size:${fontSize['7xl']};font-weight:${fontWeight.black};color:${color.textPrimary};line-height:${lineHeight.tight};letter-spacing:${letterSpacing.tight};word-break:break-all">${leaf(meta.title)}</p>`
  if (meta.subtitle)
    html += `<p style="margin:0px;padding:${spacing[4]} 0px 0px;font-size:${fontSize.md};color:${color.ink};line-height:${lineHeight.looser};font-weight:${fontWeight.normal};text-align:justify;letter-spacing:${letterSpacing.wide}">${leaf(meta.subtitle)}</p>`
  if (meta.chips) {
    html += `<section style="margin:0px;padding:${spacing[4]} 0px 0px;font-size:0px;line-height:${lineHeight.loosest}">`
    meta.chips.split('|').forEach((c) => {
      html += `<span style="display:inline-block;margin:0px ${spacing[3]} 0px 0px;font-size:${fontSize['2xs']};color:#576B95;font-weight:${fontWeight.bold};letter-spacing:0.02em;white-space:nowrap">${leaf('#' + c.trim())}</span>`
    })
    html += `</section>`
  }
  html += `</td>`
  html += `<td data-colwidth="90" width="90" valign="top" align="right" style="vertical-align:top;border:0px;padding:0px;text-align:right">`
  html += `<p style="margin:0px 0px ${spacing[3]};font-size:${fontSize['2xs']};line-height:${lineHeight.normal};color:${color.inkFaint};font-weight:${fontWeight.extrabold};letter-spacing:${letterSpacing.wide}">${leaf('预计阅读(分)')}</p>`
  html += `<section style="display:inline-block;width:64px;height:64px;line-height:64px;text-align:center;border-radius:${radius.xl};background-color:${t.accent};${shadowRaw.float}"><span style="font-size:${fontSize['8xl']};line-height:64px;color:${color.surface};font-weight:${fontWeight.black};letter-spacing:${letterSpacing.tighter}">${leaf(readMin)}</span></section>`
  html += `<p style="margin:${spacing[3]} 0px 0px;font-size:${fontSize['2xs']};color:${color.inkFaint};font-weight:${fontWeight.bold};letter-spacing:${letterSpacing.wide}">${leaf('共 ' + charCount + ' 字')}</p>`
  html += `</td>`
  html += `</tr></tbody></table></section>`
  html += `</section></section>`
  return html
}

export function parseSteps(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } {
  let i = start
  const attrs = parseAttrs(lines[i])
  i++
  const steps: { name: string; desc: string }[] = []
  while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
    const m = lines[i].match(/^-\s*(.+)\s*\|\s*(.+)/)
    if (m) steps.push({ name: m[1].trim(), desc: m[2].trim() })
    i++
  }
  i++
  const active = parseInt(attrs.active || '1')
  const accentColor = attrs.color || t.accent

  let html = `<section style="margin:0px 0px ${spacing[10]};padding:${spacing[14]} ${spacing[9]};background:${neutral.gray50};border-radius:${radius['2xl']};border:1px solid ${neutral.gray200}">`
  if (attrs.label)
    html += `<p style="margin:0px 0px ${spacing[1]};font-size:${fontSize['2xs']};color:${neutral.gray500};letter-spacing:${letterSpacing['2xl']};font-weight:${fontWeight.bold}">${leaf(attrs.label)}</p>`
  if (attrs.title)
    html += `<p style="margin:0px 0px ${spacing[1]};font-size:${fontSize['3xl']};font-weight:${fontWeight.extrabold};color:${neutral.gray1000}">${leaf(attrs.title)}</p>`
  if (attrs.hint)
    html += `<p style="margin:0px 0px ${spacing[7]};font-size:${fontSize.sm};color:${neutral.gray500}">${leaf(attrs.hint)}</p>`
  html += `<section style="display:flex;gap:${spacing[5]};overflow-x:auto">`
  steps.forEach((s, idx) => {
    const isActive = idx + 1 === active
    const itemStyle = isActive
      ? `flex:1;min-width:100px;padding:${spacing[7]} ${spacing[6]};background:${accentColor}10;border-radius:${radius.xl};border:2px solid ${accentColor};text-align:center;position:relative`
      : `flex:1;min-width:100px;padding:${spacing[7]} ${spacing[6]};background:${color.surface};border-radius:${radius.xl};border:1px solid ${neutral.gray200};text-align:center;position:relative`
    html += `<section style="${itemStyle}">`
    html += `<p style="margin:0px 0px ${spacing[1]};font-size:${fontSize['5xl']};font-weight:${fontWeight.black};color:${accentColor}">${leaf(idx + 1)}</p>`
    html += `<p style="margin:0px 0px ${spacing[0]};font-size:${fontSize.base};font-weight:${fontWeight.bold};color:${color.textTertiary}">${leaf(s.name)}</p>`
    html += `<p style="margin:0px;font-size:${fontSize.xs};color:${neutral.gray500}">${leaf(s.desc)}</p>`
    html += `</section>`
  })
  html += `</section></section>`
  return { html, next: i }
}

export function parseBadges(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } {
  let i = start
  const attrs = parseAttrs(lines[i])
  i++
  let text = ''
  while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
    text += lines[i]
    i++
  }
  i++
  const html = Badges_DA01.render(attrs, text, t)
  return { html, next: i }
}

export function parseCtaBlock(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } | null {
  let i = start
  const attrs = parseAttrs(lines[i])
  i++
  while (i < lines.length && !/^:::\s*$/.test(lines[i])) i++
  // 未闭合 ::: 容器：不吞掉后续内容，回退为普通段落
  if (i >= lines.length) return null
  i++
  let html = `<section style="margin:${spacing[10]} 0px;padding:${spacing[13]} ${spacing[9]};background:linear-gradient(135deg,${t.accent},${t.dark});border-radius:${radius['4xl']};text-align:center;color:${color.surface}">`
  if (attrs.label)
    html += `<p style="margin:0px 0px ${spacing[3]};font-size:${fontSize.xs};letter-spacing:${letterSpacing['5xl']};font-weight:${fontWeight.bold};opacity:0.8">${leaf(attrs.label)}</p>`
  if (attrs.title)
    html += `<p style="margin:0px 0px ${spacing[7]};font-size:${fontSize['4xl']};font-weight:${fontWeight.extrabold};line-height:${lineHeight.normal}">${leaf(attrs.title)}</p>`
  if (attrs.button)
    html += `<span style="display:inline-block;padding:${spacing[5]} ${spacing[9]};background:rgba(255,255,255,0.2);border-radius:${radius.lg};font-weight:${fontWeight.bold};letter-spacing:${letterSpacing.widest};backdrop-filter:blur(4px)">${leaf(attrs.button)}</span>`
  html += `</section>`
  return { html, next: i }
}

export function parseCtaTag(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } | null {
  let i = start
  const openMatch = lines[i].match(/<cta\s*(.*)>/)
  const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
  i++
  let body = ''
  while (i < lines.length && !/^<\/cta>/.test(lines[i])) {
    body += lines[i] + '\n'
    i++
  }
  // 未闭合 <cta>：不吞掉后续内容，回退为普通段落
  if (i >= lines.length) return null
  i++
  return { html: CTA_DA01.render(attrs, body, t), next: i }
}

export function parseBreaking(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } | null {
  let i = start
  const openMatch = lines[i].match(/<breaking\s*(.*)>/)
  const attrs = openMatch && openMatch[1] ? parseAttrs(openMatch[1]) : {}
  i++
  let body = ''
  while (i < lines.length && !/^<\/breaking>/.test(lines[i])) {
    body += lines[i] + '\n'
    i++
  }
  // 未闭合 <breaking>：不吞掉后续内容，回退为普通段落
  if (i >= lines.length) return null
  i++
  const color = attrs.color || t.accent
  let html = `<section style="margin:24px 0px;padding:28px 24px;background:linear-gradient(135deg,${t.light},rgba(255,255,255,0.8));border:1px solid ${t.border};border-radius:16px;position:relative;overflow:hidden">`
  html += `<section style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;background:${t.light};border-radius:50%;opacity:0.5"></section>`
  if (attrs.badge)
    html += `<span style="display:inline-block;padding:4px 12px;background:${color};color:rgb(255,255,255);border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:12px">${leaf(attrs.badge)}</span>`
  if (attrs.title)
    html += `<p style="margin:0px 0px 8px;font-size:22px;font-weight:800;color:rgb(26,26,26);line-height:1.4">${leaf(attrs.title)}</p>`
  if (attrs.subtitle)
    html += `<p style="margin:0px 0px 12px;font-size:14px;color:rgb(102,102,102)">${leaf(attrs.subtitle)}</p>`
  if (attrs.chips) {
    html += `<section style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">`
    attrs.chips.split('|').forEach((c) => {
      html += `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:rgba(255,255,255,0.8);color:${color};border:1px solid ${t.border}">${leaf('#' + c.trim())}</span>`
    })
    html += `</section>`
  }
  if (body.trim())
    html += `<section style="font-size:14px;color:rgb(85,85,85);line-height:1.8;letter-spacing:0.5px;text-align:justify;margin-top:8px">${inlineFormat(body.trim(), t)}</section>`
  html += `</section>`
  return { html, next: i }
}

export function parseCtaInline(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } {
  const attrs = parseAttrs(lines[start])
  let html = `<section style="margin:24px 0px;padding:32px 24px;background:linear-gradient(135deg,${t.accent},${t.dark});border-radius:16px;text-align:center;color:rgb(255,255,255)">`
  if (attrs.label)
    html += `<p style="margin:0px 0px 8px;font-size:11px;letter-spacing:3px;font-weight:700;opacity:0.8">${leaf(attrs.label)}</p>`
  if (attrs.title)
    html += `<p style="margin:0px 0px 16px;font-size:20px;font-weight:800;line-height:1.4">${leaf(attrs.title)}</p>`
  if (attrs.button)
    html += `<span style="display:inline-block;padding:12px 32px;background:rgba(255,255,255,0.2);border-radius:8px;font-weight:700;letter-spacing:1px;backdrop-filter:blur(4px)">${leaf(attrs.button)}</span>`
  html += `</section>`
  return { html, next: start + 1 }
}

export function parseCompare(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } | null {
  let i = start
  const attrs = parseAttrs(lines[i])
  i++
  let leftContent = '',
    rightContent = '',
    side = ''
  while (i < lines.length && !/^<\/compare>/.test(lines[i])) {
    if (/^<left>/.test(lines[i])) {
      side = 'left'
      i++
      continue
    }
    if (/^<\/left>/.test(lines[i])) {
      side = ''
      i++
      continue
    }
    if (/^<right>/.test(lines[i])) {
      side = 'right'
      i++
      continue
    }
    if (/^<\/right>/.test(lines[i])) {
      side = ''
      i++
      continue
    }
    if (side === 'left') leftContent += lines[i] + '\n'
    if (side === 'right') rightContent += lines[i] + '\n'
    i++
  }
  // 未闭合 <compare>：不吞掉后续内容，回退为普通段落
  if (i >= lines.length) return null
  i++

  // 构造 body 供 Compare_DA01 解析
  const body = `<left>\n${leftContent}</left>\n<right>\n${rightContent}</right>`

  // 使用 inlineFormat 渲染内部 markdown
  const inlineRenderer = (md: string) => inlineFormat(md, t)

  // 兼容旧版 type="DA02" → direction="vertical"
  if (attrs.type === 'DA02') {
    attrs.direction = 'vertical'
  }
  return { html: Compare_DA01.render(attrs, body, t, inlineRenderer), next: i }
}

export function parseCallout(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } {
  let i = start
  const m = lines[i].match(/>\s*\[!?(TIP|NOTE|INFO|WARNING|CAUTION|IMPORTANT)\]\s*(.*)/i)
  const type = m ? m[1].toUpperCase() : 'NOTE'
  const title = m ? m[2] : ''
  i++
  let body = ''
  while (i < lines.length && /^>/.test(lines[i])) {
    body += lines[i].replace(/^>\s?/, '') + '\n'
    i++
  }
  const icons: Record<string, string> = {
    TIP: '💡',
    NOTE: '📝',
    INFO: 'ℹ️',
    WARNING: '⚠️',
    CAUTION: '🚨',
    IMPORTANT: '❗',
  }
  const bgs: Record<string, string> = {
    TIP: '#f0fdf4',
    NOTE: '#eff6ff',
    INFO: '#f0f9ff',
    WARNING: '#fffbea',
    CAUTION: '#fef2f2',
    IMPORTANT: '#f5f3ff',
  }
  const borders: Record<string, string> = {
    TIP: '#16a34a',
    NOTE: '#2563eb',
    INFO: '#0ea5e9',
    WARNING: '#ea580c',
    CAUTION: '#dc2626',
    IMPORTANT: '#7c3aed',
  }
  const bg = bgs[type] || '#f0f4fa'
  const border = borders[type] || t.accent
  let html = `<section style="margin:${spacing[7]} 0px;padding:${spacing[7]} ${spacing[6]};background:${bg};border-left:4px solid ${border};border-radius:0px ${radius.xl} ${radius.xl} 0px">`
  if (title)
    html += `<p style="margin:0px 0px ${spacing[2]};font-size:${fontSize.xl};font-weight:${fontWeight.bold};color:${border}">${esc((icons[type] || '') + ' ' + title)}</p>`
  if (body.trim())
    html += `<section style="font-size:${fontSize.xl};color:${neutral.gray700};line-height:${lineHeight.looser};letter-spacing:${letterSpacing.wider};text-align:justify">${inlineFormat(body.trim(), t)}</section>`
  html += `</section>`
  return { html, next: i }
}

export function parseEngage(
  lines: string[],
  start: number,
  t: ThemeColors,
): { html: string; next: number } {
  const attrs = parseAttrs(lines[start])
  let html = `<section style="margin:${spacing[15]} 0px ${spacing[11]};width:677px;max-width:100%;box-sizing:border-box;overflow:hidden;text-align:center;padding:${spacing[13]} ${spacing[9]};border-radius:${radius['3xl']};background:rgba(${t.rgb},0.05);border:1px dashed ${neutral.gray250}">`
  if (attrs.title)
    html += `<p style="margin:0px 0px ${spacing[8]};font-size:${fontSize.xl};font-weight:${fontWeight.extrabold};color:${neutral.gray850};line-height:${lineHeight.loose}">${leaf(attrs.title)}</p>`
  html += `<section style="margin:0px 0px ${spacing[6]};text-align:center;font-size:0px;line-height:1;color:${t.accent}">`
  html += `<span style="display:inline-block;margin:0px ${spacing[5]};width:28px;height:28px;vertical-align:middle"><svg viewBox="0 0 24 24" width="28" height="28" style="display:block" xmlns="http://www.w3.org/2000/svg"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" fill="currentColor"></path></svg></span>`
  html += `<span style="display:inline-block;margin:0px ${spacing[5]};width:28px;height:28px;vertical-align:middle"><svg viewBox="0 0 24 24" width="28" height="28" style="display:block" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"></path></svg></span>`
  html += `<span style="display:inline-block;margin:0px ${spacing[5]};width:28px;height:28px;vertical-align:middle"><svg viewBox="0 0 24 24" width="28" height="28" style="display:block" xmlns="http://www.w3.org/2000/svg"><path d="M11.7333 8.26667V4L19.2 11.4667L11.7333 18.9333V14.5778C5.33333 14.5778 2.31111 18.2222 1.6 22.2222C2.84444 16.8889 6.22222 11.5556 11.7333 8.26667Z" fill="currentColor"></path></svg></span>`
  html += `</section>`
  html += `<p style="margin:0px 0px ${spacing[1]};font-size:${fontSize['2xs']};color:${t.accent};font-weight:${fontWeight.extrabold};letter-spacing:${letterSpacing['2xl']};text-transform:uppercase">${leaf('点赞 · 推荐 · 转发')}</p>`
  html += `<p style="font-size:${fontSize['2xs']};color:${neutral.gray400};letter-spacing:${letterSpacing.widest};margin:0px">${leaf(attrs.label || 'THANKS FOR READING')}</p>`
  html += `</section>`
  return { html, next: start + 1 }
}

export function parseGallery(lines: string[], start: number): { html: string; next: number } {
  let i = start
  const imgs: { alt: string; src: string }[] = []
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(lines[i])) !== null) {
    imgs.push({ alt: m[1], src: m[2] })
  }
  i++
  let html = `<section style="white-space:nowrap;overflow-x:auto;margin:${spacing[5]} 0px;padding:${spacing[1]} 0px">`
  imgs.forEach((img) => {
    html += `<img src="${esc(img.src)}" alt="${esc(img.alt)}" style="display:inline-block;vertical-align:top;max-height:200px;border-radius:${radius.lg};margin-right:${spacing[3]}">`
  })
  html += `</section>`
  return { html, next: i }
}
