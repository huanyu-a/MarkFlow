import type { ThemeColors } from '../composables/useTheme'
import { esc, leaf, lightenHex, pangu } from './helpers'
import { getCachedImageUrl } from '@/lib/editor/imageStorage'
import { color, fontSize, fontWeight, neutral, radius, spacing } from '../tokens'

export function inlineFormat(text: string, t: ThemeColors, formulaMap?: Map<string, string>): string {
  // 中英文/数字自动加空格：先保护行内代码与链接/图片 URL，避免破坏代码与网址
  {
    const stash: string[] = []
    const keep = (s: string) => `\uE000${stash.push(s) - 1}\uE001`
    text = text
      .replace(/`[^`]+`/g, keep) // 行内代码
      .replace(/!\[[^\]]*\]\([^)]+\)(?:\[[^\]]+\])?/g, keep) // 图片
      .replace(/\]\([^)]+\)/g, keep) // 链接的 ](url) 部分（保留 [文字]）
    text = pangu(text)
    text = text.replace(/\uE000(\d+)\uE001/g, (_m, n: string) => stash[Number(n)])
  }

  // 脚注占位符 __FN_N__（渲染为带下划线的文字 + 上标数字）
  // 格式：__FN_N__|显示文字，其中显示文字由 markdownParser 传入
  text = text.replace(
    /__FN_(\d+)__\|([^|]+)\|/g,
    (_m, p1: string, label: string) =>
      `<span style="color:${t.accent};text-decoration:underline;text-decoration-style:dashed;text-underline-offset:3px;cursor:pointer">${leaf(label)}</span><sup style="color:${t.accent};font-size:0.75em;font-weight:${fontWeight.semibold}">[${parseInt(p1) + 1}]</sup>`,
  )
  // 兼容没有显示文字的格式
  text = text.replace(
    /__FN_(\d+)__/g,
    (_m, p1: string) =>
      `<sup style="color:${t.accent};font-weight:${fontWeight.semibold};cursor:pointer">[${parseInt(p1) + 1}]</sup>`,
  )

  // `行内代码` — 先用占位符隔离，避免内部 $...$ / ** / ^ / ~ 等被后续正则误匹配
  const codeStore: string[] = []
  text = text.replace(
    /`([^`]+)`/g,
    (_m, p1: string) => {
      const idx = codeStore.length
      codeStore.push(`<code style="background:${neutral.gray100};padding:${spacing[0]} ${spacing[2]};border-radius:${radius.sm};font-size:${fontSize.base};font-family:SF Mono,Consolas,monospace;color:#e83e8c">${leaf(p1)}</code>`)
      return `\x00CODE_${idx}\x00`
    },
  )

  // <Badge type="tip" text="xxx" /> — VuePress-style inline badge
  // 支持属性任意顺序：<Badge text="推荐" type="tip" /> 或 <Badge type="tip" text="推荐" />
  const BADGE_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
    info:    { bg: '#e3f2fd', fg: '#1565c0', border: '#90caf9' },
    tip:     { bg: '#e8f5e9', fg: '#2e7d32', border: '#a5d6a7' },
    warning: { bg: '#fff3e0', fg: '#e65100', border: '#ffcc80' },
    danger:  { bg: '#fce4ec', fg: '#c62828', border: '#ef9a9a' },
  }
  text = text.replace(
    /<Badge\s([^>]*)\s*\/?>/gi,
    (_m, attrString: string) => {
      // 解析任意顺序的属性
      const typeMatch = attrString.match(/type="([^"]*)"/i)
      const textMatch = attrString.match(/text="([^"]*)"/i)
      const type = typeMatch ? typeMatch[1] : 'info'
      const displayText = textMatch ? textMatch[1] : type
      const colors = BADGE_COLORS[type.toLowerCase()] || BADGE_COLORS.info
      return `<span style="display:inline-block;padding:0 ${spacing[2]};margin:0 ${spacing[1]};border-radius:${radius.sm};font-size:${fontSize.xs};font-weight:${fontWeight.semibold};background:${colors.bg};color:${colors.fg};border:1px solid ${colors.border};line-height:1.6;vertical-align:middle">${leaf(displayText)}</span>`
    },
  )

  // <Icon name="material-symbols:home" size="1em" /> — VuePress-style icon via Iconify API
  text = text.replace(
    /<Icon\s+name="([^"]+)"[^/]*?(?:size="([^"]*)")?\s*\/?>/gi,
    (_m, name: string, iconSize?: string) => {
      const size = iconSize || '1em'
      const encoded = encodeURIComponent(name)
      return `<img src="https://api.iconify.design/${encoded}.svg" alt="${esc(name)}" style="width:${size};height:${size};vertical-align:-0.125em;display:inline-block">`
    },
  )

  // $行内公式$ — 仅在提供 formulaMap 时（MathJax 模式）进行替换；
  // 否则（KaTeX 模式）由于公式已被 extractMath 提取为占位符，此处正则不会匹配到它。
  if (formulaMap) {
    text = text.replace(
      /(?<!\$)(?<!\d)\$(?!\d)([^\$]+?)\$(?!\$|[\w])/g,
      (_m, formula: string) => {
        const svg = formulaMap.get(`i:${formula}`)
        if (svg) return svg
        // 降级：显示公式原文
        return `<code style="font-style:italic;background:${neutral.gray100};padding:1px 4px;border-radius:${radius.sm}">${esc(formula)}</code>`
      },
    )
  }

  // ==渐变背景==
  text = text.replace(
    /==([^=]+)==/g,
    (_m, p1: string) =>
      `<span style="background:linear-gradient(120deg,rgba(${t.rgb},0.1) 0%,rgba(${t.rgb},0.16) 100%);padding:0px ${spacing[2]};border-radius:${radius.sm};font-weight:${fontWeight.bold};color:${t.accent}">${leaf(p1)}</span>`,
  )
  // !!胶囊文字!!
  text = text.replace(
    /!!([^!]+)!!/g,
    (_m, p1: string) =>
      `<span style="display:inline-block;padding:0 ${spacing[2]};border-radius:20px;font-size:${fontSize.md};font-weight:${fontWeight.semibold};background:${t.light};color:${t.accent};border:1px solid ${t.border}">${leaf(p1)}</span>`,
  )
  // ^^加重强调^^
  text = text.replace(
    /\^\^([^^]+)\^\^/g,
    (_m, p1: string) => `<strong style="color:${t.accent}">${leaf(p1)}</strong>`,
  )
  // ::柔光重点::
  text = text.replace(/::([^:]+)::/g, (_m, p1: string) => {
    const light = lightenHex(t.accent, 0.15)
    return `<span style="color:${light};font-weight:${fontWeight.bold}">${leaf(p1)}</span>`
  })
  // __下划线__
  text = text.replace(
    /__([^_]+)__/g,
    (_m, p1: string) =>
      `<span style="text-decoration:underline;text-decoration-color:${t.accent};text-underline-offset:3px">${leaf(p1)}</span>`,
  )
  // ~~删除线~~
  text = text.replace(
    /~~([^~]+)~~/g,
    (_m, p1: string) => `<del style="color:${neutral.gray500}">${leaf(p1)}</del>`,
  )
  // ~下标~
  text = text.replace(/~([^~]+)~/g, (_m, p1: string) => `<sub>${leaf(p1)}</sub>`)
  // ^上标^
  text = text.replace(/\^([^^]+)\^/g, (_m, p1: string) => `<sup>${leaf(p1)}</sup>`)
  // **粗体**
  text = text.replace(/\*\*([^*]+)\*\*/g, (_m, p1: string) => `<strong style="font-weight:${fontWeight.extrabold};color:${color.textPrimary}">${leaf(p1)}</strong>`)
  // *斜体*
  text = text.replace(/\*([^*]+)\*/g, (_m, p1: string) => `<em>${leaf(p1)}</em>`)

  // 图片 ![alt](src)[size]
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)(?:\[([^\]]+)\])?/g,
    (_m, alt: string, src: string, size?: string) => {
      let resolvedSrc = src
      if (src.startsWith('img://')) {
        const id = src.replace('img://', '')
        resolvedSrc = getCachedImageUrl(id) || src
      }
      if (size) {
        const parts = size.split(/\s+/)
        const w = parts[0] || '100%'
        const h = parts[1] || '250px'
        return `<img src="${esc(resolvedSrc)}" alt="${esc(alt)}" style="width:${w};max-height:${h};border-radius:${radius.md};display:block">`
      }
      return `<img src="${esc(resolvedSrc)}" alt="${esc(alt)}" style="max-width:100%;border-radius:${radius.md};display:block">`
    },
  )
  // 还原行内代码占位符
  text = text.replace(/\x00CODE_(\d+)\x00/g, (_m, p1: string) => codeStore[parseInt(p1)] || _m)

  // 多行内容：合并连续空行后 \n 转 <br>（避免公众号显示多余空行）
  text = text.replace(/\n{2,}/g, '\n').replace(/[ \t]*\n[ \t]*/g, '<br>')
  return text
}
