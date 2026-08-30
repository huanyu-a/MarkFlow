import { parseMarkdown, type ThemeColors } from '@engine'
import { extractContentMeta, type ContentMeta } from './metadata'
import { sanitizeHtml } from '../htmlSanitizer'
import type { ResolvedTokens } from '@engine/tokens'

export interface MarkdownRenderResult {
  html: string
  meta: ContentMeta
}

/**
 * 统一渲染入口：解析 Markdown 并对产出 HTML 做安全净化。
 *
 * 用户粘贴的 Markdown / 原始 HTML 属于不可信输入，引擎会原样透传其中的
 * HTML 片段；所有进入主文档 DOM 的路径（预览、测量、导出前置）都必须
 * 经过本入口，确保 script/onerror/javascript: 等危险内容被剥离。
 */
export function renderMarkdown(
  markdown: string,
  colors: ThemeColors,
  mermaidMap?: Map<string, { svg: string; error?: string }>,
  onWarning?: (warning: string) => void,
  tokens?: ResolvedTokens,
): MarkdownRenderResult {
  const meta = extractContentMeta(markdown)
  const html = parseMarkdown(meta.contentMarkdown, colors, undefined, mermaidMap, onWarning, tokens)
  return {
    meta,
    html: sanitizeHtml(html),
  }
}
