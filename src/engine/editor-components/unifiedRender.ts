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
import { parseAttrs } from '../utils/helpers'
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
      const bodyLines: string[] = []
      let j = i + 1
      const MAX = 80
      while (j < lines.length && !/^:::\s*$/.test(lines[j])) {
        bodyLines.push(lines[j])
        j++
        if (j - i > MAX) {
          const rawBody = bodyLines.join('\n').trim()
          return {
            html: def.render(attrs, rawBody, parseBody(rawBody, def.spec.bodyFormat), ctx.t),
            next: j,
            warning: `模块未闭合，已扫描 ${MAX} 行`,
          }
        }
      }
      if (j >= lines.length) return null
      const rawBody = bodyLines.join('\n').trim()
      try {
        const html = def.render(attrs, rawBody, parseBody(rawBody, def.spec.bodyFormat), ctx.t)
        return { html, next: j + 1 }
      } catch {
        return null
      }
    },
  }
}
