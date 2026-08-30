/**
 * Portions of this file are derived from html-anything (https://github.com/nexu-io/html-anything),
 * licensed under the Apache License, Version 2.0.
 * Modified by huanyu-a/MarkFlow contributors.
 */

import { forwardRef, useMemo, useState } from 'react'
import { previewHtml } from '@/lib/extractHtml'

interface HtmlSandboxProps {
  // 原始 HTML（可能含代码块围栏或解释文字，内部会自动提取）
  html: string
  // 用于强制重挂载 iframe 的 key
  refreshKey?: number
  // iframe 加载完成回调
  onLoad?: () => void
  // 是否允许 iframe 内脚本执行；默认关闭。
  // 注意：即便开启脚本，也不会放开同源权限，防止沙箱逃逸。
  allowScripts?: boolean
}

// iframe 沙箱预览：通过 srcdoc 注入，sandbox 限制权限。
// 移植自 html-anything 的 preview-pane 渲染策略。
export const HtmlSandbox = forwardRef<HTMLIFrameElement, HtmlSandboxProps>(function HtmlSandbox(
  { html, refreshKey = 0, onLoad, allowScripts = false },
  ref,
) {
  const display = useMemo(() => previewHtml(html, { allowScripts }), [html, allowScripts])
  const [loadError, setLoadError] = useState(false)

  if (!display) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm text-slate-400">
        粘贴 AI 生成的 HTML，这里会实时渲染
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm text-slate-500">
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">预览加载失败，请检查 HTML 语法</span>
      </div>
    )
  }

  return (
    <iframe
      key={refreshKey}
      ref={ref}
      title="html-preview"
      aria-label="HTML 预览沙箱"
      srcDoc={display}
      sandbox={allowScripts ? 'allow-scripts' : ''}
      className="h-full w-full border-0"
      onLoad={onLoad}
      onError={() => setLoadError(true)}
    />
  )
})
