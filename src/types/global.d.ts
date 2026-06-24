/**
 * 浏览器全局对象最小扩展类型。
 *
 * 3.7 优化落地：替代 (window as any).Xxx，为 MathJax、Paged iframe 通信等提供类型安全。
 */

interface M2vMathJax {
  /** 初始化配置：fontCache='none' 让路径直接内联 */
  svg: { fontCache: 'none' | 'local' | 'global' }
  /** startup 配置与加载完成后的 adaptor */
  startup: {
    typeset: boolean
    adaptor?: {
      remove: (node: Element) => void
      outerHTML: (node: Element) => string
    }
  }
  /** 将 LaTeX 渲染为 SVG 节点（加载完成后可用） */
  tex2svg?: (formula: string, options: { display: boolean }) => HTMLElement
}

declare global {
  interface Window {
    /** MathJax：公式渲染全局对象 */
    MathJax?: M2vMathJax
    /** Paged.js iframe 引导脚本就绪标记 */
    __m2vReady?: boolean
    /** Paged.js iframe 渲染入口 */
    __m2vRender?: (contentHtml: string, pageCss: string) => Promise<number>
  }
}

export {}
