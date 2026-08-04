import { useMemo, useState, useEffect, useRef } from 'react'
import CodeMirror, { EditorView, keymap, type Extension } from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { html } from '@codemirror/lang-html'
import { EditorToolbar } from './EditorToolbar'
import { useStore } from '@/lib/store'
import {
  uploadImageFile,
  preloadImagesFromMarkdown,
  clearLocalImageUrlCache,
} from '@/lib/editor/imageStorage'
import { editorShortcuts } from '@/lib/editor/shortcuts'
import { warmTheme, warmThemeExtension } from './codemirror/warmTheme'
import { collapseBase64 } from './codemirror/base64Plugin'
import { tagDetection } from './codemirror/tagDetection'

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

const COMMON_LANGS = [
  'c', 'c++', 'css', 'go', 'html', 'java', 'javascript', 'json', 'jsx', 'markdown',
  'php', 'python', 'rust', 'sql', 'tsx', 'typescript', 'xml', 'yaml', 'shell', 'bash', 'sh', 'vue'
]

// 模块级预加载：在编辑器挂载前完成语言数据加载，避免运行时异步加载触发 reconfigure 导致输入丢失
let preloadedCodeLangs: import('@codemirror/language').LanguageDescription[] | null = null
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
  const [codeLangs, setCodeLangs] = useState<import('@codemirror/language').LanguageDescription[]>(() =>
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

    const exts: Extension[] = [langExtension, EditorView.lineWrapping, eventHandlers, warmThemeExtension]
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
