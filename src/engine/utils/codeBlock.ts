import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import cpp from 'highlight.js/lib/languages/cpp'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import { esc } from './helpers'
import { fontSize, lineHeight, radius, spacing } from '../tokens'

// 代码块容器专用颜色（暗色 one-dark 主题，独立于正文语义 token）
const CODE_BG = '#1e1e2e'
const CODE_FG = '#cdd6f4'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('css', css)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('python', python)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)

const LANGUAGE_ALIASES: Record<string, string> = {
  c: 'cpp',
  'c++': 'cpp',
  html: 'xml',
  js: 'javascript',
  md: 'markdown',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  ts: 'typescript',
}

// one-dark 风格 token 色，转成内联样式后复制到富文本目标也能保留高亮。
const HL_COLORS: Record<string, string> = {
  keyword: '#c678dd',
  built_in: '#56b6c2',
  type: '#e5c07b',
  literal: '#56b6c2',
  number: '#d19a66',
  string: '#98c379',
  regexp: '#98c379',
  comment: '#7f848e',
  doctag: '#7f848e',
  meta: '#7f848e',
  title: '#61afef',
  attr: '#d19a66',
  attribute: '#d19a66',
  variable: '#e06c75',
  tag: '#e06c75',
  name: '#e06c75',
  params: '#abb2bf',
  property: '#e06c75',
  operator: '#56b6c2',
  symbol: '#56b6c2',
  selector: '#e06c75',
  bullet: '#61afef',
  link: '#98c379',
  quote: '#98c379',
  addition: '#98c379',
  deletion: '#e06c75',
  section: '#61afef',
  function: '#61afef',
}

function inlineHighlight(code: string, lang: string): string {
  let out: string
  const language = LANGUAGE_ALIASES[lang] ?? lang
  try {
    out =
      language && hljs.getLanguage(language)
        ? hljs.highlight(code, { language }).value
        : hljs.highlightAuto(code).value
  } catch {
    out = esc(code)
  }

  return out.replace(/class="hljs-([a-z_]+)[^"]*"/g, (_m, c: string) =>
    HL_COLORS[c] ? `style="color:${HL_COLORS[c]}"` : '',
  )
}

// Line annotation patterns (inspired by @shikijs/transformers)
const LINE_ANNOTATION_RE = /\s*\/\/\s*\[!code\s+(highlight|\+\+|--|error|warning|focus|word:(.+?))\]\s*$/

interface LineAnnotation {
  highlight?: boolean
  add?: boolean
  remove?: boolean
  error?: boolean
  warning?: boolean
  focus?: boolean
  word?: string
}

function parseAnnotations(code: string): { cleanCode: string; annotations: Map<number, LineAnnotation> } {
  const lines = code.split('\n')
  const annotations = new Map<number, LineAnnotation>()
  const cleanLines: string[] = []

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    const m = line.match(LINE_ANNOTATION_RE)
    if (m) {
      const ann: LineAnnotation = {}
      if (m[1] === 'highlight') ann.highlight = true
      else if (m[1] === '++') ann.add = true
      else if (m[1] === '--') ann.remove = true
      else if (m[1] === 'error') ann.error = true
      else if (m[1] === 'warning') ann.warning = true
      else if (m[1] === 'focus') ann.focus = true
      else if (m[1].startsWith('word:')) ann.word = m[1].slice(5)
      annotations.set(idx, ann)
      cleanLines.push(line.replace(LINE_ANNOTATION_RE, ''))
    } else {
      cleanLines.push(line)
    }
  }

  return { cleanCode: cleanLines.join('\n'), annotations }
}

// Annotation inline styles
const ANN_BASE = 'display:inline-block;width:calc(100% + 3.5em);margin-left:-1.75em;padding:0 0.75em;border-left:3px solid transparent;'
const ANN_STYLES: Record<string, string> = {
  highlight: `${ANN_BASE}background:rgba(255,235,59,0.14);border-left-color:#f59e0b;`,
  add: `${ANN_BASE}background:rgba(46,160,67,0.14);border-left-color:#2ea043;`,
  remove: `${ANN_BASE}background:rgba(248,81,73,0.14);border-left-color:#f85149;`,
  error: `${ANN_BASE}background:rgba(248,81,73,0.14);border-left-color:#f85149;color:#ffa198;`,
  warning: `${ANN_BASE}background:rgba(210,153,34,0.14);border-left-color:#d29922;`,
  focus: `${ANN_BASE}background:rgba(56,139,253,0.1);border-left-color:#388bfd;`,
}

function wrapAnnotatedLines(highlightedHtml: string, annotations: Map<number, LineAnnotation>): string {
  if (annotations.size === 0) return highlightedHtml

  const hasFocus = Array.from(annotations.values()).some(a => a.focus)
  const lines = highlightedHtml.split('\n')
  const result: string[] = []

  for (let idx = 0; idx < lines.length; idx++) {
    const ann = annotations.get(idx)
    if (!ann) {
      // Dim non-focus lines when focus mode is active
      if (hasFocus) {
        result.push(`<span style="opacity:0.4">${lines[idx]}</span>`)
      } else {
        result.push(lines[idx])
      }
      continue
    }

    let style = ANN_BASE
    if (ann.error) style = ANN_STYLES.error
    else if (ann.warning) style = ANN_STYLES.warning
    else if (ann.add) style = ANN_STYLES.add
    else if (ann.remove) style = ANN_STYLES.remove
    else if (ann.highlight) style = ANN_STYLES.highlight
    else if (ann.focus) style = ANN_STYLES.focus

    let line = lines[idx]
    if (ann.word) {
      const wordEsc = ann.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      line = line.replace(new RegExp(`(${wordEsc})`, 'gi'), `<span style="background:rgba(255,235,59,0.3);border-radius:2px;padding:0 2px">$1</span>`)
    }

    result.push(`<span style="${style}">${line}</span>`)
  }

  return result.join('\n')
}

export function renderCodeBlock(code: string, lang = 'text', options?: { lineNumbers?: boolean; maxHeight?: string }): string {
  const language = lang.trim() || 'text'

  // Strip line-numbers/lang suffix from lang string (e.g. "js{1,3-5}" or "js line-numbers")
  const cleanLang = language.replace(/\{[^}]*\}/, '').replace(/\s+line-numbers\s*$/, '').trim() || 'text'

  const { cleanCode, annotations } = parseAnnotations(code.trimEnd())
  const highlighted = inlineHighlight(cleanCode, cleanLang)
  const finalHtml = wrapAnnotatedLines(highlighted, annotations)

  const showLineNumbers = options?.lineNumbers || /\bline-numbers\b/.test(lang)
  const maxH = options?.maxHeight

  // Build line numbers if requested
  let lineNumsHtml = ''
  if (showLineNumbers) {
    const lineCount = cleanCode.split('\n').length
    const nums = Array.from({ length: lineCount }, (_, i) => `<span class="code-line-num">${i + 1}</span>`).join('\n')
    lineNumsHtml = `<span class="code-line-numbers" aria-hidden="true">${nums}</span>`
  }

  const preStyle = [
    'margin:0px',
    'white-space:pre-wrap',
    'overflow-wrap:anywhere',
    'word-break:break-word',
    'font-family:SFMono-Regular,Consolas,Monaco,monospace',
    showLineNumbers ? 'padding-left:3.5em' : '',
    maxH ? `max-height:${maxH};overflow-y:auto` : '',
  ].filter(Boolean).join(';')

  return `<section data-block="code" style="background:${CODE_BG};color:${CODE_FG};padding:${spacing[6]} ${spacing[7]};border-radius:${radius.lg};overflow:hidden;margin:${spacing[6]} 0px;font-size:${fontSize.sm};line-height:${lineHeight.relaxed}"><pre data-lang="${esc(cleanLang)}" style="${preStyle}">${lineNumsHtml}<code style="background:none;color:inherit;padding:0;font-size:inherit;font-family:inherit;white-space:inherit;overflow-wrap:inherit;word-break:inherit">${finalHtml || '&nbsp;'}</code></pre></section>`
}
