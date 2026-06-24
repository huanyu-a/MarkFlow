import { downloadBlob } from './exportImage'

/** 将编辑器中的 HTML 源码导出为 .html 文件 */
export function exportHtmlSource(html: string, filename = 'export.html') {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  downloadBlob(blob, filename)
}

/** 将编辑器中的 Markdown 内容导出为 .md 文件 */
export function exportMarkdownSource(markdown: string, filename = 'export.md') {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  downloadBlob(blob, filename)
}
