/**
 * 统一 ::: 渲染器工厂
 *
 * 为所有多行组件提供统一的 `:::name key=val ... :::` 容器语法。
 *
 * 每个组件导出 UnifiedComponentDef：
 *   - spec：name/label/bodyFormat/example/fields
 *   - render(attrs, rawBody, parsedBody, t)：完整签名（4 参数）
 *   - renderLegacy(attrs, body, t)：兼容旧 3 参数签名（供 blockRenderRegistry / ExtensionPage 直接调用）
 *
 * buildUnifiedRenderer(def) 返回 BlockRenderer，自动完成 ::: 容器解析 + attrs 提取 + body 解析 + 渲染调度。
 */

import type { BlockRenderer } from '../utils/blockRenderRegistry'
import { parseAttrs, leaf, unclosedTagFallback } from '../utils/helpers'
import { restoreCodePlaceholdersToText } from '../utils/codeProtect'
import {
  parseFields,
  parseRows,
  parseJsonObject,
  parseJsonArray,
  type BodyFormat,
} from '../layout-modules/parse'
import type { ThemeColors } from '../composables/useTheme'

// ── 类型 ──────────────────────────────────────────────

export type UnifiedBodyFormat = BodyFormat

export interface UnifiedComponentSpec {
  name: string
  label: string
  bodyFormat: UnifiedBodyFormat
  example: string
  fields?: { name: string; required: boolean; description: string }[]
  /**
   * 组件 render 依赖 ``` 围栏原文（如 code-block 的围栏语言 + {行标注} 解析）。
   * markdownParser 的 protectCode 会在容器解析前把围栏换成占位符，置 true 时
   * buildUnifiedRenderer 会在调用 render 前用 ctx.codeStore 把占位符还原为围栏原文。
   */
  needsFenceSource?: boolean
}

export interface ParsedBody {
  fields: Record<string, string>
  rows: string[][]
  json: Record<string, unknown> | unknown[] | null
  markdown: string
}

/** 根据 bodyFormat 解析 body 文本 */
export function parseBody(body: string, format: BodyFormat = 'fields'): ParsedBody {
  return {
    fields: format === 'fields' ? parseFields(body) : {},
    rows: format === 'rows' ? parseRows(body) : [],
    json:
      format === 'json_object'
        ? parseJsonObject(body)
        : format === 'json_array'
          ? parseJsonArray(body)
          : null,
    markdown: format === 'markdown' ? body : '',
  }
}

/** 生成预览用的渲染结果 HTML（供 ExtensionPage 展示） */
export function renderPreview(def: { spec: { name: string; example?: string; label?: string; bodyFormat?: BodyFormat } }, t: ThemeColors): string {
  const spec = def.spec
  if (!spec.example) return ''
  const lines = spec.example.split('\n')
  const headerMatch = lines[0].match(/^:::\s*\S+\s*(.*)/)
  const headerAttrs = headerMatch?.[1]?.trim() ? parseAttrs(headerMatch[1]) : {}
  const bodyLines: string[] = []
  for (let i = 1; i < lines.length; i++) {
    if (/^:::\s*$/.test(lines[i].trim())) break
    bodyLines.push(lines[i])
  }
  const body = bodyLines.join('\n').trim()
  const parsed = parseBody(body, spec.bodyFormat)
  return (def as any).render ? (def as any).render(headerAttrs, body, parsed, t) : ''
}

export interface UnifiedComponentDef {
  spec: UnifiedComponentSpec
  /** 完整渲染函数（4 参数）：::: 容器渲染器调用 */
  render: (attrs: Record<string, string>, rawBody: string, body: ParsedBody, t: ThemeColors) => string
  /** 兼容旧 3 参数签名：blockRenderRegistry / ExtensionPage 直接调用 */
  renderLegacy(attrs: Record<string, string>, body: string, t: ThemeColors): string
  /** 可选：对容器 body 做格式检查，返回降级警告文本（经 onWarning 上报给调用方） */
  bodyWarning?: (rawBody: string) => string | undefined
}

/** 构建 ::: 容器 block renderer */
export function buildUnifiedRenderer(def: UnifiedComponentDef): BlockRenderer {
  const nameRe = new RegExp(`^:::\\s*${def.spec.name}\\b`)
  return {
    name: `unified-${def.spec.name}`,
    priority: 20,
    match: (line) => nameRe.test(line),
    render: (ctx, line, lines, i) => {
      const headerMatch = line.match(/^:::\s*\S+\s*(.*)/)
      const attrs = headerMatch?.[1]?.trim() ? parseAttrs(headerMatch[1]) : {}
      // needsFenceSource：markdownParser 的 protectCode 已在容器解析前把 ``` 围栏
      // 换成占位符，依赖围栏原文的组件（如 :::code-block 的 lang{2,4-5} 行标注解析）
      // 需先把占位符还原为围栏文本，否则 renderCodeBlock 内部 hljs 会剥掉私有区字符，
      // 出口 restoreCode 匹配不上，导致代码内容整体丢失（C-4 实测结论）
      const prepareBody = (raw: string): string =>
        def.spec.needsFenceSource && ctx.codeStore
          ? restoreCodePlaceholdersToText(raw, ctx.codeStore)
          : raw
      const bodyLines: string[] = []
      let j = i + 1
      const MAX = 80
      while (j < lines.length && !/^:::\s*$/.test(lines[j])) {
        bodyLines.push(lines[j])
        j++
        if (j - i > MAX) {
          const rawBody = prepareBody(bodyLines.join('\n').trim())
          return {
            html: def.render(attrs, rawBody, parseBody(rawBody, def.spec.bodyFormat), ctx.t),
            next: j,
            warning: `模块未闭合，已扫描 ${MAX} 行`,
          }
        }
      }
      // EOF 未闭合：只消费 ::: 定界符行（转义段落），容器体各行交主循环逐行解析（正文不丢），
      // 并经 warning 通道上报——return null 会让 meta.warnings 链路无从感知降级
      if (j >= lines.length) {
        const fb = unclosedTagFallback(line, `:::${def.spec.name} 容器未闭合，后续内容按普通文本解析`)
        return { html: fb.html, next: i + 1, warning: fb.warning }
      }
      const rawBody = prepareBody(bodyLines.join('\n').trim())
      try {
        const html = def.render(attrs, rawBody, parseBody(rawBody, def.spec.bodyFormat), ctx.t)
        // bodyWarning：组件级格式降级警告（如缺列被忽略的行），经 onWarning 上报
        return { html, next: j + 1, warning: def.bodyWarning?.(rawBody) }
      } catch {
        // 组件渲染抛错：把容器 body 原文降级为纯文本（leaf 包 span 保留内容，行内语法丢弃可接受；
        // 注入面由出口 sanitizeHtml 统一净化），并经 warning 通道上报——return null 会让
        // markdownParser 丢弃告警、容器定界符字面落段落，调用方（meta.warnings 消费链路）无从感知降级
        return { html: leaf(rawBody), next: j + 1, warning: `${def.spec.name} 组件渲染异常，已降级为纯文本` }
      }
    },
  }
}
