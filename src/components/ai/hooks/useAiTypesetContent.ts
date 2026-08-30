import { useContentStore } from '@/lib/store'
import type { RenderMode } from '@/lib/store'

// 在普通函数（非 React 组件/Hook）中访问 zustand 状态，必须使用 getState()；
// 直接调用 useContentStore(selector) 会在事件回调/异步流程中触发 Invalid hook call。
// 注意：需要在渲染期响应内容变化的场景不能用本模块，应在 Hook 内用 selector 订阅
// （见 useAiTypeset.ts 的 currentContent）。
export function getSetCurrentContent(mode: RenderMode): (v: string) => void {
  const s = useContentStore.getState()
  switch (mode) {
    case 'article': return s.setArticleMarkdown
    case 'document': return s.setDocumentMarkdown
    case 'card': return s.setCardMarkdown
    case 'html': return s.setHtml
  }
}
