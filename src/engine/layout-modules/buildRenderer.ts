/**
 * 排版模块 renderer 工厂 — 减少各模块文件中的样板代码
 */

import type { BlockRenderer, BlockRenderContext } from '../utils/blockRenderRegistry'
import type { LayoutModuleSpec } from './types'
import {
  parseFields,
  parseRows,
  parseJsonObject,
  parseJsonArray,
  renderMarkdownBody,
  type BodyFormat,
} from './parse'

export interface LayoutBody {
  fields: Record<string, string>
  rows: string[][]
  json: Record<string, unknown> | unknown[] | null
  markdown: string
}

/** 解析 :::module 容器 body 为统一结构 */
export function extractModuleBody(
  lines: string[],
  start: number,
): { body: string; next: number; warning?: string } | null {
  const line = lines[start]
  const openMatch = line.match(/^:::\s*\S+\b(.*)$/)
  if (!openMatch) return null

  // 跨行 ::: 容器 → 在独立行找 :::
  const collected: string[] = []
  let i = start + 1
  const MAX = 80
  while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
    collected.push(lines[i])
    i++
    if (i - start > MAX) {
      return { body: collected.join('\n').trim(), next: i, warning: `模块未闭合，已扫描 ${MAX} 行` }
    }
  }
  if (i >= lines.length) return null // 未闭合，回退
  return { body: collected.join('\n').trim(), next: i + 1 }
}

/** 根据 body_format 分发解析 */
export function parseBody(body: string, format: BodyFormat): LayoutBody {
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

/** 构建一个标准的 :::module block renderer */
export function buildModuleRenderer(
  spec: LayoutModuleSpec,
  renderFn: (body: LayoutBody, ctx: BlockRenderContext, raw: string) => string,
): BlockRenderer {
  const nameRe = new RegExp(`^:::\\s*${spec.name}\\b`)
  return {
    name: `layout-${spec.name}`,
    priority: 20, // 在 callout/quote 等之后、heading 之前匹配
    match: (line) => nameRe.test(line),
    render: (ctx, _line, lines, i) => {
      // 行内标题 :::module[标题] — 收集 body
      const extracted = collectModuleContainer(lines, i)
      if (!extracted) return null
      const layoutBody = parseBody(extracted.body, spec.bodyFormat)
      const html = renderFn(layoutBody, ctx, extracted.body)
      return { html, next: extracted.next, warning: extracted.warning }
    },
  }
}

/**
 * 收集 :::module ... ::: 容器内容。
 * 支持：
 *   跨行：start 行即 :::module，到独立行 ::: 结束
 * 返回的 body 不含首尾容器行。
 */
function collectModuleContainer(
  lines: string[],
  start: number,
): { body: string; next: number; warning?: string } | null {
  // start 行是 :::module[title] 或 :::module key=val 等形式
  // 从 start+1 开始收集，到独立行 ::: 结束
  const collected: string[] = []
  let i = start + 1
  const MAX = 80
  while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
    collected.push(lines[i])
    i++
    if (i - start > MAX) {
      return { body: collected.join('\n').trim(), next: i, warning: `模块未闭合，已扫描 ${MAX} 行` }
    }
  }
  if (i >= lines.length) return null
  return { body: collected.join('\n').trim(), next: i + 1 }
}

// ── 公共片段：各模块复用的内联样式 token ──────────────

export function moduleLabel(text: string, accent: string): string {
  return `<p style="margin:0px 0px 8px;font-size:11px;letter-spacing:2.4px;text-transform:uppercase;font-weight:800;color:${accent};line-height:1.4">${esc(text)}</p>`
}

export function moduleTitle(text: string, opts?: { color?: string; size?: string; weight?: string; align?: string }): string {
  const color = opts?.color ?? '#1a1a1a'
  const size = opts?.size ?? '22px'
  const weight = opts?.weight ?? '800'
  const align = opts?.align ?? 'left'
  return `<p style="margin:0px 0px 12px;font-size:${size};font-weight:${weight};color:${color};line-height:1.35;letter-spacing:-0.5px;text-align:${align};word-break:break-word">${esc(text)}</p>`
}

export function moduleSubtitle(text: string, opts?: { color?: string; size?: string; align?: string }): string {
  const color = opts?.color ?? '#64748b'
  const size = opts?.size ?? '14px'
  const align = opts?.align ?? 'left'
  return `<p style="margin:0px;font-size:${size};color:${color};line-height:1.7;letter-spacing:0.3px;text-align:${align};text-align:justify">${esc(text)}</p>`
}

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export { renderMarkdownBody }
