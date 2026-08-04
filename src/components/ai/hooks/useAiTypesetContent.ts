import { useContentStore } from '@/lib/store'
import type { RenderMode } from '@/lib/store'

export function getCurrentContent(mode: RenderMode): string {
  const articleMarkdown = useContentStore((s) => s.articleMarkdown)
  const documentMarkdown = useContentStore((s) => s.documentMarkdown)
  const cardMarkdown = useContentStore((s) => s.cardMarkdown)
  const html = useContentStore((s) => s.html)
  switch (mode) {
    case 'article': return articleMarkdown
    case 'document': return documentMarkdown
    case 'card': return cardMarkdown
    case 'html': return html
  }
}

export function getSetCurrentContent(mode: RenderMode): (v: string) => void {
  const setArticleMarkdown = useContentStore((s) => s.setArticleMarkdown)
  const setDocumentMarkdown = useContentStore((s) => s.setDocumentMarkdown)
  const setCardMarkdown = useContentStore((s) => s.setCardMarkdown)
  const setHtml = useContentStore((s) => s.setHtml)
  switch (mode) {
    case 'article': return setArticleMarkdown
    case 'document': return setDocumentMarkdown
    case 'card': return setCardMarkdown
    case 'html': return setHtml
  }
}
