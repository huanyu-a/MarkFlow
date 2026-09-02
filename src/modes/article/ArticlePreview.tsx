import { useState, useRef } from 'react'
import type { MarkdownRenderResult } from '@/lib/render/markdown'
import { copyText, copyRichText, copyHtmlSource } from '@/lib/clipboard'
import { exportMarkdownSource } from '@/lib/exportSource'
import { exportLongImage } from '@/lib/export/longImage'
import { PreviewToolbar, type ToolbarItem } from '@/components/layout/PreviewToolbar'
import { useStore } from '@/lib/store'
import { UI_LABELS } from '@/lib/uiLabels'
import { getFontFamilyCss } from '@/lib/fonts'
import { Download, Clipboard, ImageIcon, Rocket, FileText, Send } from '@/components/ui/Icon'
import { MermaidImageHostDialog } from '@/components/editor/MermaidImageHostDialog'
import { collectMermaidDiagrams } from '@engine'

/** 长图文模式固定使用黑体系统字体栈，确保复制到微信公众号时字体一致 */
const ARTICLE_FONT = getFontFamilyCss('heiti')

/**
 * 将 DOM 克隆并清理为公众号兼容的 HTML
 * - 降级 Mermaid 图表为代码块（移除 <div class="m2v-mermaid-figure">）
 * - 移除所有 class 属性（公众号禁止 class）
 * - 将 <div> 替换为 <section>（公众号禁止 div）
 * - 清理公众号禁止的 CSS 属性（display:grid, float, position:fixed/absolute/sticky 等）
 */
function cloneAndSanitizeForWeChat(
  contentEl: HTMLElement,
  markdown: string,
): HTMLElement {
  const clone = contentEl.cloneNode(true) as HTMLElement

  // 1. 降级 Mermaid 图表为代码块
  const diagrams = collectMermaidDiagrams(markdown)
  const figures = clone.querySelectorAll<HTMLElement>('.m2v-mermaid-figure')
  figures.forEach((fig, index) => {
    if (index >= diagrams.length) return
    const pre = document.createElement('pre')
    const codeEl = document.createElement('code')
    codeEl.textContent = diagrams[index].source
    pre.appendChild(codeEl)
    fig.parentNode?.replaceChild(pre, fig)
  })

  // 2. 移除所有 class 属性
  const elementsWithClass = clone.querySelectorAll<HTMLElement>('[class]')
  elementsWithClass.forEach((el) => {
    el.removeAttribute('class')
  })

  // 3. 清理公众号禁止的 CSS 属性
  const FORBIDDEN_CSS_PROPS = [
    'display:grid',
    'display: grid',
    'float:',
    'position:fixed',
    'position:absolute',
    'position:sticky',
    '@media',
    '@keyframes',
    '@import',
    'var(',
  ]

  function sanitizeStyleAttribute(el: HTMLElement) {
    const style = el.getAttribute('style')
    if (!style) return
    let sanitized = style
    for (const forbidden of FORBIDDEN_CSS_PROPS) {
      // 简单的字符串替换，保留其他样式
      const regex = new RegExp(`${forbidden.replace(/([.*+?^${}()|[\]\\])/g, '\\$1')}[^;]*;?`, 'gi')
      sanitized = sanitized.replace(regex, '')
    }
    if (sanitized.trim() === style.trim()) return
    if (sanitized.trim()) {
      el.setAttribute('style', sanitized.trim())
    } else {
      el.removeAttribute('style')
    }
  }

  // 清理所有元素的 style 属性
  const elementsWithStyle = clone.querySelectorAll<HTMLElement>('[style]')
  elementsWithStyle.forEach(sanitizeStyleAttribute)

  // 4. 将 <div> 替换为 <section>
  const divs = clone.querySelectorAll<HTMLDivElement>('div')
  divs.forEach((div) => {
    const section = document.createElement('section')
    // 复制所有属性和内容
    Array.from(div.attributes).forEach((attr) => {
      section.setAttribute(attr.name, attr.value)
    })
    section.innerHTML = div.innerHTML
    div.parentNode?.replaceChild(section, div)
  })

  return clone
}

/**
 * 导出公众号 HTML 片段（复用渲染器产出的全内联样式 HTML，不加 <style>/<head>/<body> 包装）
 * 渲染器（src/engine/）已对所有标签做了内联 style + <span leaf=""> 包裹，
 * 此函数会清理 DOM 以通过 validate_gzh_html.py 校验。
 */
const exportWeChatHtml = (
  contentRef: React.RefObject<HTMLDivElement>,
  markdown: string,
  title: string,
  onToast: (msg: string) => void,
) => {
  if (!contentRef.current) return
  const sanitized = cloneAndSanitizeForWeChat(contentRef.current, markdown)
  const html = sanitized.innerHTML
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40)}.wechat.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  onToast('已导出公众号 HTML（已降级 Mermaid、移除 class 属性）')
}

interface ArticlePreviewProps {
  rendered: MarkdownRenderResult
  markdown: string
  // 滚动容器引用，供滚动联动使用
  scrollRef: React.RefObject<HTMLDivElement>
  // 统一 Toast 反馈
  onToast: (message: string) => void
}

// 长图文预览：标题/摘要作为独立可复制元信息展示，正文继续复用共享 Markdown 渲染内核。
export function ArticlePreview({ rendered, markdown, scrollRef, onToast }: ArticlePreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const { html, meta } = rendered
  const imageHostConfig = useStore((s) => s.imageHostConfig)

  const [showMermaidDialog, setShowMermaidDialog] = useState(false)
  const [pendingCopyType, setPendingCopyType] = useState<'richText' | 'htmlSource' | null>(null)
  const [publishingWeChat, setPublishingWeChat] = useState(false)
  const wechatDraftConfig = useStore((s) => s.wechatDraftConfig)

  const hasMermaid = html.includes('m2v-mermaid-figure')

  const checkAndCopy = (copyType: 'richText' | 'htmlSource') => {
    if (hasMermaid && imageHostConfig.activeType === 'local') {
      setPendingCopyType(copyType)
      setShowMermaidDialog(true)
      return
    }
    executeCopy(copyType)
  }

  const executeCopy = async (copyType: 'richText' | 'htmlSource') => {
    if (!contentRef.current) return
    if (copyType === 'richText') {
      const ok = await copyRichText(contentRef.current, ARTICLE_FONT, imageHostConfig)
      onToast(ok ? '已复制富文本，可粘贴到长图文编辑器' : '复制失败，请重试')
    } else {
      const ok = await copyHtmlSource(contentRef.current, imageHostConfig)
      onToast(ok ? '已复制 HTML 源码（全内联样式）' : '复制失败，请重试')
    }
  }

  const handleDowngradeMermaid = async () => {
    if (!contentRef.current) return
    const clone = contentRef.current.cloneNode(true) as HTMLElement
    const diagrams = collectMermaidDiagrams(markdown)
    const figures = clone.querySelectorAll<HTMLElement>('.m2v-mermaid-figure')
    figures.forEach((fig, index) => {
      if (index >= diagrams.length) return
      const pre = document.createElement('pre')
      const codeEl = document.createElement('code')
      codeEl.className = 'language-mermaid'
      codeEl.textContent = diagrams[index].source
      pre.appendChild(codeEl)
      fig.parentNode?.replaceChild(pre, fig)
    })
    if (pendingCopyType === 'richText') {
      const ok = await copyRichText(clone, ARTICLE_FONT)
      onToast(ok ? '已复制富文本（mermaid 已降级为代码块）' : '复制失败，请重试')
    } else if (pendingCopyType === 'htmlSource') {
      const ok = await copyHtmlSource(clone)
      onToast(ok ? '已复制 HTML 源码（mermaid 已降级为代码块）' : '复制失败，请重试')
    }
    setShowMermaidDialog(false)
    setPendingCopyType(null)
  }

  const handleConfigureImageHost = () => {
    setShowMermaidDialog(false)
    setPendingCopyType(null)
    window.dispatchEvent(new CustomEvent('m2v-open-settings'))
  }

  const hasLocalImages = html.includes('blob:') || html.includes('img://') || meta.contentMarkdown.includes('img://')

  const handleCopyTitle = async () => {
    const ok = await copyText(meta.title)
    onToast(ok ? '已复制标题' : '没有可复制的标题')
  }

  const handleCopySummary = async () => {
    const ok = await copyText(meta.summary)
    onToast(ok ? '已复制摘要' : '没有可复制的摘要')
  }

  const handleCopyHtml = () => {
    checkAndCopy('htmlSource')
  }

  const handleCopyRichText = () => {
    checkAndCopy('richText')
  }

  const handleExportLongImage = async () => {
    if (!contentRef.current) return
    try {
      await exportLongImage(contentRef.current, {
        filename: meta.title || 'article',
      })
      onToast('已导出长图')
    } catch (e) {
      onToast(`导出失败：${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  const handlePublishWeChatDraft = async () => {
    if (!contentRef.current || publishingWeChat) return
    const { appId, appSecret, thumbMediaId, coverImageUrl, publishEndpoint } = wechatDraftConfig
    if (!appId || !appSecret) {
      onToast('请先在设置中配置公众号 AppID / AppSecret')
      window.dispatchEvent(new CustomEvent('m2v-open-settings'))
      return
    }
    setPublishingWeChat(true)
    try {
      const sanitized = cloneAndSanitizeForWeChat(contentRef.current, markdown)
      const res = await fetch(publishEndpoint || '/__markflow_wechat_publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          appSecret,
          thumbMediaId: thumbMediaId ?? '',
          coverImageUrl: coverImageUrl ?? '',
          title: meta.title || '未命名文章',
          content: sanitized.innerHTML,
        }),
      })
      // 发布端点可能返回 HTML 页（服务未部署、SPA fallback、网关错误页），
      // 直接 res.json() 会抛 "Unexpected token '<'"，这里显式拦截并给出可操作的提示
      const raw = await res.text()
      let data: { ok?: boolean; media_id?: string; error?: string }
      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error(
          res.status === 404
            ? '未找到发布服务：请确认服务器已部署 /__markflow_wechat_publish 端点，或在设置中填写正确的发布接口地址'
            : '发布服务返回了非 JSON 响应，请检查发布接口地址是否指向有效的发布服务',
        )
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `发布失败（HTTP ${res.status}）`)
      }
      onToast(`已创建公众号草稿 media_id=${data.media_id}`)
    } catch (e) {
      onToast(`发布失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setPublishingWeChat(false)
    }
  }
  const toolbarActions: ToolbarItem[] = [
    'separator',
    {
      id: 'exportSource',
      icon: <Download size={14} />,
      label: UI_LABELS.toolbar.exportSource.label,
      tooltip: '导出为 .md 文件',
      onClick: () => {
        const title = (meta.title || 'article').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40)
        exportMarkdownSource(markdown, `${title}.md`)
      },
    },
    {
      id: 'exportWeChatHtml',
      icon: <FileText size={14} />,
      label: '导出公众号 HTML',
      tooltip: '导出全内联 HTML 片段（可通过 validate_gzh_html.py 校验）',
      onClick: () => {
        const title = meta.title || 'article'
        exportWeChatHtml(contentRef, markdown, title, onToast)
      },
    },
    {
      id: 'copyHtml',
      icon: <Clipboard size={14} />,
      label: '复制源码',
      tooltip: '复制渲染后的完整 HTML 源码（含内联样式）',
      onClick: handleCopyHtml,
    },
    {
      id: 'exportImage',
      icon: <ImageIcon size={14} />,
      label: UI_LABELS.toolbar.exportLongImage.label,
      tooltip: UI_LABELS.toolbar.exportLongImage.tooltip,
      onClick: handleExportLongImage,
    },
    {
      id: 'copyRichText',
      icon: <Rocket size={14} />,
      label: UI_LABELS.toolbar.copyRichText.label,
      tooltip: UI_LABELS.toolbar.copyRichText.tooltip,
      onClick: handleCopyRichText,
      variant: 'primary',
      className: 'shadow-sm',
    },
    {
      id: 'publishWeChatDraft',
      icon: <Send size={14} />,
      label: publishingWeChat ? '推送中…' : '发布到草稿箱',
      tooltip: '直接创建微信公众号草稿',
      onClick: handlePublishWeChatDraft,
      variant: publishingWeChat ? undefined : 'primary',
    },
  ]

  return (
    <section className="flex h-full flex-col">
      {/* 操作工具栏 */}
      <PreviewToolbar actions={toolbarActions} />

      {/* 公众号本地图片裂图警告 */}
      {hasLocalImages && imageHostConfig.activeType === 'local' && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-700 flex items-center gap-2">
          <svg className="shrink-0 text-amber-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span>
            检测到本地存储的图片。直接复制到微信公众号会导致<strong>图片失效（裂图）</strong>。建议在顶部配置第三方云图床，或手动在微信后台重新上传这些图片。
          </span>
        </div>
      )}

      {/* 可滚动预览区域 */}
      <div ref={scrollRef} className="preview-scroll flex-1 overflow-y-auto p-4 bg-slate-50">
        {(meta.title || meta.summary) && (
          <section className="mx-auto mb-2 grid w-full max-w-[700px] gap-2">
            {meta.title && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">标题</span>
                  <button
                    onClick={handleCopyTitle}
                    className="rounded px-2 py-0.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    复制
                  </button>
                </div>
                <div className="mt-0.5 text-sm font-semibold leading-5 text-slate-900">{meta.title}</div>
              </div>
            )}
            {meta.summary && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">摘要</span>
                  <button
                    onClick={handleCopySummary}
                    className="rounded px-2 py-0.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    复制
                  </button>
                </div>
                <div className="mt-0.5 text-xs leading-5 text-slate-600">{meta.summary}</div>
              </div>
            )}
          </section>
        )}

        <div className="phone-frame mx-auto">
          <div
            ref={contentRef}
            style={{
              padding: '20px 20px',
              color: '#333',
              fontSize: 15,
              lineHeight: 1.8,
              fontFamily: ARTICLE_FONT,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              backgroundColor: '#fff',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {/* Mermaid 图床提醒弹窗 */}
      <MermaidImageHostDialog
        isOpen={showMermaidDialog}
        onClose={() => {
          setShowMermaidDialog(false)
          setPendingCopyType(null)
        }}
        onDowngrade={handleDowngradeMermaid}
        onConfigure={handleConfigureImageHost}
      />

    </section>
  )
}

