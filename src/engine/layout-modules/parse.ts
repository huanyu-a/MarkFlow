/**
 * 高级排版模块 — body 解析 helpers
 *
 * 从 LAYOUT.md 归纳 4 种 body_format:
 *   fields      → key: value 行
 *   rows        → pipe 分隔 a | b | c
 *   json_object → 合并为单行 JSON 对象
 *   json_array  → 合并为单行 JSON 数组
 *   markdown    → 原始 markdown 行（由 inlineFormat 渲染）
 *
 * 所有模块 renderer 通过 extractBlock 收集 body 文本后，
 * 按模块声明的 body_format 调用对应 helper。
 */

import { inlineFormat } from '../utils/inlineFormat'
import type { BlockRenderContext } from '../utils/blockRenderRegistry'

export type BodyFormat = 'fields' | 'rows' | 'json_object' | 'json_array' | 'markdown'

// ── fields: key: value ─────────────────────────────────

export function parseFields(body: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = body.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const colonIdx = line.indexOf(':')
    if (colonIdx < 0) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    if (!key) continue
    // YAML 块标量：value 为 |、|-、|+（保留换行）或 >、>-（折叠为空格）时，
    // 收集后续比 key 行更缩进的行，直到出现非缩进的非空行为止。
    // 示例：
    //   body: |
    //     第一行事实
    //     第二行事实
    const blockMatch = value.match(/^([|>])([+-]?)$/)
    if (blockMatch) {
      const keepNewlines = blockMatch[1] === '|'
      const collected: string[] = []
      // 块内容缩进基准：第一个非空行的前导空白数
      let indent = -1
      let j = i + 1
      while (j < lines.length) {
        const raw = lines[j]
        // 空行：属于块的延续（可能分隔段落），先占位，最终按折叠规则决定去留
        if (!raw.trim()) {
          collected.push('')
          j++
          continue
        }
        const leading = raw.length - raw.trimStart().length
        if (indent < 0) indent = leading
        // 非缩进的非空行 → 块结束（该行交回普通 key: value 解析）
        // 基准缩进必须大于 0：`body: |` 后紧跟零缩进行是常见笔误，
        // 若按 leading>=0 收集会把后续所有字段静默吞进块里（旧解析器尚且能存活这些字段）
        if (indent === 0 || leading < indent) break
        collected.push(raw.slice(indent).trimEnd())
        j++
      }
      // 丢弃块尾部的空行（YAML 字面量会保留它们，但对排版渲染没有意义）
      while (collected.length > 0 && !collected[collected.length - 1]) collected.pop()
      // 折叠标量（>）：单个换行折为空格；连续空行产生的多个换行压缩为一个真实换行（分段）
      // 字面量标量（|）：按 \n 连接，空行原样保留（分段语义）
      let joined: string
      if (keepNewlines) {
        joined = collected.join('\n')
      } else {
        joined = collected
          .join('\n')
          .replace(/\n{2,}/g, '\u0000PARA\u0000') // 先保护段落分隔
          .replace(/\n/g, ' ') // 单换行 → 空格
          .replace(/\u0000PARA\u0000/g, '\n')
          .trim()
      }
      result[key] = joined
      i = j - 1
      continue
    }
    result[key] = value
  }
  return result
}

// ── rows: a | b | c ────────────────────────────────────

export interface RowCell {
  cells: string[]
  /** 原始一行文本（含可选的 accent/default 末列） */
  raw: string
}

export function parseRows(body: string): string[][] {
  const rows: string[][] = []
  for (const rawLine of body.split('\n')) {
    let line = rawLine.trim()
    if (!line) continue
    // 剥除行首列表标记（"- 名称 | 描述" 语法中的 "- "），避免破折号残留进单元格
    line = line.replace(/^-\s+/, '')
    // 支持行内标题语法 :::module[标题]，首行若以 [xxx] 结尾可带标题 — 但不在这里处理
    const cells = line.split('|').map((c) => c.trim()).filter((c, i, arr) => !(i === arr.length - 1 && c === ''))
    if (cells.length > 0) rows.push(cells)
  }
  return rows
}

// ── json_object / json_array ───────────────────────────

export function parseJsonObject(body: string): Record<string, unknown> | null {
  const trimmed = body.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    return null
  }
}

export function parseJsonArray(body: string): unknown[] | null {
  const trimmed = body.trim()
  if (!trimmed) return null
  try {
    const v = JSON.parse(trimmed)
    return Array.isArray(v) ? v : null
  } catch {
    return null
  }
}

// ── markdown (raw lines) ───────────────────────────────

/** 把 markdown body 行渲染为 HTML（使用 inlineFormat 简易渲染） */
export function renderMarkdownBody(body: string, ctx: BlockRenderContext): string {
  if (!body.trim()) return ''
  return body
    .split('\n')
    .filter((l) => l.trim())
    .map(
      (l) =>
        `<section style="margin:0px 0px 6px"><p style="margin:0px;line-height:1.8;letter-spacing:0.5px;text-align:justify">${inlineFormat(l.trim(), ctx.t)}</p></section>`,
    )
    .join('')
}

// ── 通用工具 ───────────────────────────────────────────

/** 从 rows 中取「颜色」列（末列为 accent(default) 时返回） */
export function rowColor(row: string[], ctx: BlockRenderContext): string {
  const last = row[row.length - 1]?.toLowerCase() ?? ''
  if (last === 'accent' || last === 'default') {
    return last === 'accent' ? ctx.t.accent : ctx.t.dark
  }
  return ctx.t.accent
}

/** 是否带 accent 色标记（rows 末列） */
export function isAccentRow(row: string[]): boolean {
  const last = row[row.length - 1]?.toLowerCase() ?? ''
  return last === 'accent'
}

/** 过滤掉 rows 末列的颜色标记，返回内容列 */
export function rowContent(row: string[]): string[] {
  const last = row[row.length - 1]?.toLowerCase() ?? ''
  if (last === 'accent' || last === 'default') return row.slice(0, -1)
  return row
}
