import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import type { ThemeColors } from '@engine'
import { collectMermaidDiagrams, preRenderMermaid } from '@engine'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { useScrollSync } from '@/lib/useScrollSync'
import { renderMarkdown } from '@/lib/render/markdown'
import { ArticlePreview } from './ArticlePreview'
import { useEditorDocSync } from '@/lib/useEditorDocSync'
import { UserGuidePopover } from '@/components/ui/UserGuidePopover'
import { useStore } from '@/lib/store'
import { ModeLayout } from '@/components/layout/ModeLayout'
import { ComponentAttrEditor } from '@/components/extension/ComponentAttrEditor'

interface ArticleModeProps {
  markdown: string
  setMarkdown: (markdown: string) => void
  colors: ThemeColors
  onToast: (message: string) => void
}

export function ArticleMode({ markdown, setMarkdown, colors, onToast }: ArticleModeProps) {
  const guideTrigger = useStore((s) => s.guideTrigger.article)
  // store ↔ 编辑器双向同步（防抖回写 + 外部变更信号）
  const {
    localValue: localMarkdown,
    debouncedValue: debouncedMarkdown,
    setLocalValue: setLocalMarkdown,
    externalVersion,
  } = useEditorDocSync(markdown, setMarkdown)

  // mermaid 预渲染 state（需在 rendered useMemo 之前声明）
  const [mermaidMap, setMermaidMap] = useState<Map<string, { svg: string; error?: string }> | undefined>(undefined)

  const rendered = useMemo(
    () => renderMarkdown(debouncedMarkdown, colors, mermaidMap, onToast),
    [debouncedMarkdown, colors, mermaidMap, onToast],
  )
  const editorScrollerRef = useRef<HTMLElement | null>(null)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const [editorReady, setEditorReady] = useState(0)

  // mermaid 预渲染：collectMermaidDiagrams → preRenderMermaid → 存入 state
  // rendered.html 依赖此 map，map 就绪后 mermaid 块才正确渲染（就绪前降级为代码块）
  useEffect(() => {
    const diagrams = collectMermaidDiagrams(debouncedMarkdown)
    if (diagrams.length === 0) {
      setMermaidMap(undefined)
      return
    }
    // 长图文模式使用固定内容宽度 678px（公众号排版标准宽度）
    const ARTICLE_CONTENT_W = 678
    let cancelled = false
    preRenderMermaid(diagrams, ARTICLE_CONTENT_W).then((map) => {
      if (!cancelled) setMermaidMap(map)
    })
    return () => {
      cancelled = true
    }
  }, [debouncedMarkdown])

  useScrollSync(editorScrollerRef, previewScrollRef, [editorReady])

  // 标签检测状态
  const [detectedTag, setDetectedTag] = useState('')
  const [detectedFrom, setDetectedFrom] = useState(0)
  const [detectedTo, setDetectedTo] = useState(0)
  const [editorView, setEditorView] = useState<import('@uiw/react-codemirror').EditorView | null>(null)

  const handleTagDetected = useCallback((tag: string, from: number, to: number) => {
    setDetectedTag(tag)
    setDetectedFrom(from)
    setDetectedTo(to)
  }, [])

  return (
    <>
      <ModeLayout
        editor={
          <div className="relative h-full">
            <CodeEditor
              value={localMarkdown}
              onChange={setLocalMarkdown}
              externalVersion={externalVersion}
              onScrollerReady={(el) => {
                editorScrollerRef.current = el
                setEditorReady((n) => n + 1)
              }}
              onViewReady={setEditorView}
              onTagDetected={handleTagDetected}
              onToast={onToast}
            />
            {detectedTag && (
              <ComponentAttrEditor
                tag={detectedTag}
                from={detectedFrom}
                to={detectedTo}
                view={editorView}
                onClose={() => setDetectedTag('')}
              />
            )}
          </div>
        }
        preview={
          <ArticlePreview
            rendered={rendered}
            markdown={debouncedMarkdown}
            scrollRef={previewScrollRef}
            onToast={onToast}
          />
        }
      />
      <UserGuidePopover
        guideKey="m2v-article-guide-seen"
        forceOpenTrigger={guideTrigger}
        title="长图文排版 使用指引"
        subtitle="利用 AI 提示词与公众号排版引擎，轻松渲染出专业的内容设计"
        steps={[
          {
            icon: 'ai',
            title: '点击左侧「AI 排版」',
            shortDesc: '点击左侧导航栏的 AI 排版图标，在弹窗中一键增强排版效果。',
          },
          {
            icon: 'copy',
            title: '预览并应用结果',
            shortDesc: '查看 AI 排版结果，确认后点击「应用到编辑器」替换内容。',
          },
          {
            icon: 'export',
            title: '导出或复制',
            shortDesc: '粘贴 Markdown 到编辑器，实时预览后点击「复制富文本」即可发布。',
          },
        ]}
      />
    </>
  )
}
