// 渲染 API 的 Node 打包入口（由 tools/render-server/build.mjs 用 esbuild 打包）。
//
// 只暴露同步渲染路径：
// - renderMarkdown 内部走 KaTeX（静态依赖，纯 JS，Node 可用）；
// - mermaid / MathJax 是动态懒加载且依赖浏览器 DOM，标记为 external，
//   同步路径下 mermaid 代码块自动降级为普通代码块，不会触发加载。
export { renderMarkdown } from '../../src/lib/render/markdown'
export { makeColors, THEMES } from '../../src/engine/composables/useTheme'
export { buildArticleAiGuide } from '../../src/lib/aiGuide'
