import { parseMarkdown, type ThemeColors } from '@engine'
import { extractContentMeta, type ContentMeta } from './metadata'
import type { ResolvedTokens } from '@engine/tokens'

export interface MarkdownRenderResult {
  html: string
  meta: ContentMeta
}

export function renderMarkdown(
  markdown: string,
  colors: ThemeColors,
  mermaidMap?: Map<string, { svg: string; error?: string }>,
  onWarning?: (warning: string) => void,
  tokens?: ResolvedTokens,
): MarkdownRenderResult {
  const meta = extractContentMeta(markdown)
  return {
    meta,
    html: parseMarkdown(meta.contentMarkdown, colors, undefined, mermaidMap, onWarning, tokens),
  }
}
