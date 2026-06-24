import { useMemo, useState, useEffect, useRef } from 'react'
import CodeMirror, { EditorView, keymap, type Extension } from '@uiw/react-codemirror'
import { Decoration, ViewPlugin, WidgetType } from '@codemirror/view'
import type { ViewUpdate, DecorationSet } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import type { LanguageDescription } from '@codemirror/language'
import { html } from '@codemirror/lang-html'
import { tags } from '@lezer/highlight'
import { EditorToolbar } from './EditorToolbar'
import { useStore } from '@/lib/store'
import {
  uploadImageFile,
  preloadImagesFromMarkdown,
  clearLocalImageUrlCache,
} from '@/lib/editor/imageStorage'
import { editorShortcuts } from '@/lib/editor/shortcuts'
import { tagMap } from '@engine'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  /** 外部重置信号：递增时将最新 value 强制写入编辑器文档（恢复示例 / 版本刷新等场景） */
  externalVersion?: number
  onScrollerReady?: (el: HTMLElement) => void
  onViewReady?: (view: EditorView) => void
  language?: 'markdown' | 'html'
  mode?: 'article' | 'document' | 'card' | 'html'
  onToast?: (msg: string) => void
  /** 选中标签时回调 */
  onTagDetected?: (tag: string, from: number, to: number) => void
}

// 暖色调 Notion 风格主题
const warmTheme = EditorView.theme(
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
const warmHighlight = HighlightStyle.define([
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

// ─── Base64 折叠插件 ───
class Base64Placeholder extends WidgetType {
  constructor(readonly hidden: string) { super(); }
  toDOM() {
    const wrap = document.createElement('span')
    wrap.style.cssText =
      'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:0.92em;color:#c084fc;background:rgba(192,132,252,0.08);padding:2px 6px;border-radius:3px;border:1px dashed rgba(192,132,252,0.25);cursor:pointer;'
    wrap.textContent = '(Base64 image)'
    wrap.title = '点击展开 / 折叠'
    return wrap
  }
  eq(other: Base64Placeholder) { return this.hidden === other.hidden }
}

const placeholderField = Decoration.mark({
  class: 'cm-base64-fold',
  inclusive: true,
  attributes: { style: 'background:rgba(192,132,252,0.06);border-radius:3px;' },
})

function collapseBase64() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      folded: { from: number; to: number } | null = null
      constructor(view: EditorView) {
        this.decorations = this.buildDeco(view)
      }
      update(u: ViewUpdate) {
        if (u.docChanged) this.decorations = this.buildDeco(u.view)
      }
      buildDeco(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>()
        const re = /!\[[^\]]*\]\(data:[^)]+\)/g
        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to)
          let m: RegExpExecArray | null
          while ((m = re.exec(text))) {
            const start = from + m.index
            const end = from + m.index + m[0].length
            if (this.folded && this.folded.from === start && this.folded.to === end) {
              builder.add(start, end, Decoration.replace({ widget: new Base64Placeholder(m[0]), inclusive: true }))
            } else {
              builder.add(start, end, placeholderField)
            }
          }
        }
        return builder.finish()
      }
      toggle(view: EditorView, pos: number) {
        const line = view.state.doc.lineAt(pos)
        const m = line.text.match(/!\[[^\]]*\]\(data:[^)]+\)/)
        if (!m) return false
        const start = line.from + line.text.indexOf(m[0])
        const end = start + m[0].length
        if (this.folded && this.folded.from === start && this.folded.to === end) {
          this.folded = null
        } else {
          this.folded = { from: start, to: end }
        }
        this.decorations = this.buildDeco(view)
        return true
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        click(this: any, e: PointerEvent, view: EditorView) {
          const target = e.target as HTMLElement
          const isFolded = this.folded != null
          if (target.closest('.cm-base64-fold') || isFolded) {
            const pos = view.posAtCoords({ x: e.clientX, y: e.clientY }, false)
            if (pos != null) {
              this.toggle(view, pos)
              return true
            }
          }
          return false
        },
      },
    },
  )
}

// 标签检测：检测选中文本是否为组件标签 / ::: 容器 / 代码块
function tagDetection(onTagDetected: ((tag: string, from: number, to: number) => void) | null) {
  if (!onTagDetected) return []
  return EditorView.updateListener.of((update) => {
    if (!update.selectionSet) return
    const { from, to } = update.state.selection.main
    if (from === to) {
      onTagDetected('', 0, 0)
      return
    }
    const selected = update.state.doc.sliceString(from, to).trim()
    // <tag> 语法
    const tagMatch = selected.match(/^<\/?([A-Za-z_][\w.-]*)/)
    if (tagMatch) {
      const tagName = tagMatch[1]
      if (tagMap[tagName]) {
        onTagDetected(tagName, from, to)
        return
      }
    }
    // ::: container 语法 — 扩展选区到完整容器
    const containerMatch = selected.match(/^:{3,4}\s*(tip|note|info|warning|caution|important|table)\b/)
    if (containerMatch) {
      const type = containerMatch[1]
      const tag = type === 'table' ? 'table' : 'hint'
      if (tagMap[tag]) {
        // 向前向后搜索完整容器范围
        const fullDoc = update.state.doc.toString()
        const colons = containerMatch[0].match(/^(:{3,4})/)![1]
        const closeRe = new RegExp(`^${colons}\\s*$`, 'm')
        let expandFrom = from
        let expandTo = to
        // 向前搜索闭合 :::
        const closeMatch = fullDoc.substring(from).match(closeRe)
        if (closeMatch && closeMatch.index !== undefined) {
          const closePos = from + closeMatch.index + closeMatch[0].length
          // 跳过闭合行后的 footer 行
          const afterClose = fullDoc.substring(closePos)
          const footerMatch = afterClose.match(/^[^\n]+\n?/)
          const footerLen = (footerMatch && !footerMatch[0].startsWith(':::') && !footerMatch[0].includes('|')) ? footerMatch[0].length : 0
          expandTo = closePos + footerLen
        }
        onTagDetected(tag, expandFrom, expandTo)
        return
      }
    }
    // ``` 代码块语法 — 扩展选区到完整围栏
    const fenceMatch = selected.match(/^```(\w*)/)
    if (fenceMatch) {
      if (tagMap['code-block']) {
        const fullDoc = update.state.doc.toString()
        const closeFence = fullDoc.indexOf('\n```', from + 3)
        if (closeFence > 0) {
          // 找到闭合 ``` 后的换行
          const end = fullDoc.indexOf('\n', closeFence + 4)
          const expandTo = end > 0 ? end : closeFence + 4
          onTagDetected('code-block', from, expandTo)
        } else {
          onTagDetected('code-block', from, to)
        }
        return
      }
    }
    onTagDetected('', 0, 0)
  })
}

const COMMON_LANGS = [
  'c', 'c++', 'css', 'go', 'html', 'java', 'javascript', 'json', 'jsx', 'markdown',
  'php', 'python', 'rust', 'sql', 'tsx', 'typescript', 'xml', 'yaml', 'shell', 'bash', 'sh', 'vue'
]

// 模块级预加载：在编辑器挂载前完成语言数据加载，避免运行时异步加载触发 reconfigure 导致输入丢失
let preloadedCodeLangs: LanguageDescription[] | null = null
const preloadPromise = import('@codemirror/language-data').then((m) => {
  preloadedCodeLangs = m.languages.filter((l) =>
    COMMON_LANGS.includes(l.name.toLowerCase()) || l.alias.some((a) => COMMON_LANGS.includes(a.toLowerCase()))
  )
})

export function CodeEditor({
  value,
  onChange,
  externalVersion = 0,
  onScrollerReady,
  onViewReady,
  language = 'markdown',
  mode,
  onToast,
  onTagDetected,
}: CodeEditorProps) {
  const [codeLangs, setCodeLangs] = useState<LanguageDescription[]>(() =>
    preloadedCodeLangs ?? []
  )

  const [editorView, setEditorView] = useState<EditorView | null>(null)
  const imageHostConfig = useStore((s) => s.imageHostConfig)

  // 编辑器为「挂载时受控、之后非受控」：仅用初始值创建文档，后续输入由 CodeMirror 自身维护。
  // 避免 react-codemirror 受控 value 全文替换与 IME 组合输入产生竞态导致丢字。
  const [initialValue] = useState(value)
  const viewRef = useRef<EditorView | null>(null)
  // 始终指向最新 value，供外部重置时读取（不触发受控同步）
  const valueRef = useRef(value)
  valueRef.current = value

  // 预加载当前文档中的本地图片
  useEffect(() => {
    if (language !== 'markdown') return
    const timer = window.setTimeout(() => {
      preloadImagesFromMarkdown(value).catch((err) => {
        console.error('[m2v] 预加载本地图片失败:', err)
      })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [language, value])

  useEffect(() => {
    return () => clearLocalImageUrlCache()
  }, [])

  // 将最新 value 覆盖写入编辑器文档（仅外部变更时调用）
  const applyExternalValue = (view: EditorView) => {
    const current = view.state.doc.toString()
    if (valueRef.current !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: valueRef.current } })
    }
  }

  // 外部重置信号变化 → 命令式写入；编辑器尚未创建时挂起，创建后补齐
  const appliedVersionRef = useRef(externalVersion)
  const pendingExternalRef = useRef(false)
  useEffect(() => {
    if (externalVersion === appliedVersionRef.current) return
    appliedVersionRef.current = externalVersion
    const view = viewRef.current
    if (view) {
      applyExternalValue(view)
    } else {
      pendingExternalRef.current = true
    }
  }, [externalVersion])

  // 如果模块级预加载尚未完成，等待完成后同步一次
  useEffect(() => {
    if (language === 'markdown' && preloadedCodeLangs === null) {
      preloadPromise.then(() => {
        if (preloadedCodeLangs) setCodeLangs(preloadedCodeLangs)
      })
    }
  }, [language])

  // 监听组件库「插入」事件：将文本插入到当前光标位置
  useEffect(() => {
    const handler = (e: Event) => {
      const view = viewRef.current
      if (!view) return
      const text = (e as CustomEvent<{ text: string }>).detail?.text
      if (!text) return
      const pos = view.state.selection.main.from
      view.dispatch({ changes: { from: pos, to: pos, insert: text } })
      view.focus()
    }
    window.addEventListener('m2v-editor-insert', handler)
    return () => window.removeEventListener('m2v-editor-insert', handler)
  }, [])

  // 处理图片粘贴或拖拽上传
  const handlePasteOrDrop = async (
    event: ClipboardEvent | DragEvent,
    view: EditorView
  ) => {
    let files: FileList | null = null
    let dropPos: number | null = null

    if (event.type === 'paste') {
      const clipboardEvent = event as ClipboardEvent
      files = clipboardEvent.clipboardData?.files || null
    } else if (event.type === 'drop') {
      const dragEvent = event as DragEvent
      dragEvent.preventDefault()
      files = dragEvent.dataTransfer?.files || null
      const coords = { x: dragEvent.clientX, y: dragEvent.clientY }
      const pos = view.posAtCoords(coords)
      if (pos !== null) {
        dropPos = pos
      }
    }

    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) return

    event.preventDefault()

    try {
      const url = await uploadImageFile(file, imageHostConfig)
      const insertText = `![${file.name.split('.')[0]}](${url})`
      const insertPos = dropPos !== null ? dropPos : view.state.selection.main.from

      view.dispatch({
        changes: { from: insertPos, to: insertPos, insert: insertText },
        selection: { anchor: insertPos + insertText.length },
      })
      view.focus()
    } catch (err) {
      console.error('Paste/Drop image error:', err)
      const msg = `图片导入失败: ${err instanceof Error ? err.message : '未知错误'}`
      if (onToast) {
        onToast(msg)
      } else {
        alert(msg)
      }
    }
  }

  // 快捷键 keymap 绑定
  const customKeymap = useMemo(() => {
    return keymap.of(editorShortcuts)
  }, [])

  // 绑定事件和快捷键
  const extensions = useMemo<Extension[]>(() => {
    const langExtension =
      language === 'html'
        ? html()
        : markdown({ base: markdownLanguage, codeLanguages: codeLangs })

    const eventHandlers = EditorView.domEventHandlers({
      paste: (event, view) => {
        handlePasteOrDrop(event, view)
      },
      drop: (event, view) => {
        handlePasteOrDrop(event, view)
      },
    })

    const exts: Extension[] = [langExtension, EditorView.lineWrapping, eventHandlers, syntaxHighlighting(warmHighlight)]
    if (language === 'markdown') {
      exts.push(customKeymap, collapseBase64(), tagDetection(onTagDetected ?? null))
    }
    return exts
  }, [language, codeLangs, customKeymap, imageHostConfig, onTagDetected])

  return (
    <div className="flex h-full flex-col">
      {language === 'markdown' && <EditorToolbar view={editorView} mode={mode} onToast={onToast} />}
      <div className="flex-1 min-h-0">
        <CodeMirror
          value={initialValue}
          onChange={onChange}
          theme={warmTheme}
          height="100%"
          style={{ height: '100%', fontSize: 14 }}
          onCreateEditor={(view) => {
            viewRef.current = view
            setEditorView(view)
            if (pendingExternalRef.current) {
              pendingExternalRef.current = false
              requestAnimationFrame(() => applyExternalValue(view))
            }
            onScrollerReady?.(view.scrollDOM)
            onViewReady?.(view)
          }}
          extensions={extensions}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
          }}
        />
      </div>
    </div>
  )
}
