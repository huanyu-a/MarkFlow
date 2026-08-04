import { EditorView } from '@uiw/react-codemirror'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

// 暖色调 Notion 风格主题
export const warmTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#fffdf8',
      color: '#37352f',
      fontSize: '14px',
      fontFamily: 'ui-monospace, SF Mono, SFMono-Regular, Menlo, Consolas, monospace',
      lineHeight: '1.6',
      height: '100%',
    },
    '.cm-content': {
      padding: '16px',
      caretColor: '#37352f',
      minHeight: '100%',
    },
    '.cm-gutters': {
      backgroundColor: '#fffdf8',
      color: '#b4b4b4',
      borderRight: '1px solid #e8e5e0',
      minWidth: '40px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#fffdf8',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(55,53,47,0.04)',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(35,131,226,0.15) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(35,131,226,0.2) !important',
    },
    '.cm-cursor': {
      borderLeftColor: '#37352f',
      borderLeftWidth: '2px',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(35,131,226,0.15)',
      outline: '1px solid rgba(35,131,226,0.3)',
    },
    '.cm-foldGutter': {
      color: '#b4b4b4',
    },
    '.cm-scroller': {
      overflow: 'auto',
      scrollbarWidth: 'none',
    },
    '.cm-scroller::-webkit-scrollbar': {
      display: 'none',
    },
  },
  { dark: false },
)

// 暖色调语法高亮
export const warmHighlight = HighlightStyle.define([
  { tag: tags.heading, textDecoration: 'none', fontWeight: '700', color: '#e879f9' },
  { tag: tags.heading1, textDecoration: 'none', fontWeight: '700', color: '#e879f9' },
  { tag: tags.heading2, textDecoration: 'none', fontWeight: '700', color: '#e879f9' },
  { tag: tags.heading3, textDecoration: 'none', fontWeight: '700', color: '#e879f9' },
  { tag: tags.heading4, textDecoration: 'none', fontWeight: '700', color: '#e879f9' },
  { tag: tags.heading5, textDecoration: 'none', fontWeight: '700', color: '#e879f9' },
  { tag: tags.heading6, textDecoration: 'none', fontWeight: '700', color: '#e879f9' },
  { tag: tags.strong, fontWeight: '700', color: '#f0abfc' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#f0abfc' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#9ca3af' },
  { tag: tags.link, color: '#67e8f9' },
  { tag: tags.url, color: '#67e8f9' },
  { tag: tags.meta, color: '#9ca3af' },
  { tag: tags.comment, color: '#9ca3af' },
  { tag: tags.string, color: '#86efac' },
  { tag: tags.number, color: '#fbbf24' },
  { tag: tags.monospace, color: '#f472b6', backgroundColor: 'rgba(244,114,182,0.08)', padding: '1px 4px', borderRadius: '3px' },
  { tag: tags.quote, color: '#9ca3af', fontStyle: 'italic' },
  { tag: tags.keyword, color: '#c084fc' },
  { tag: tags.atom, color: '#fbbf24' },
  { tag: tags.operator, color: '#67e8f9' },
  { tag: tags.special(tags.string), color: '#86efac' },
  { tag: tags.processingInstruction, color: '#9ca3af' },
])

// 主题与高亮组合，供编辑器 extensions 直接使用
export const warmThemeExtension = syntaxHighlighting(warmHighlight)
