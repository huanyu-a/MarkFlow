// 渲染 bundle 的本地冒烟测试（纯 Node 环境 + jsdom 垫片，与服务器运行形态一致）。
//
// 用法：node tools/render-server/smoke-test.mjs
// 前置：先运行 node tools/render-server/build.mjs 生成 render-bundle.mjs
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
// Node 21+ 的 navigator 是 globalThis 上的只读 getter，统一用 defineProperty 覆盖
for (const [key, value] of Object.entries({
  DOMParser: dom.window.DOMParser,
  XMLSerializer: dom.window.XMLSerializer,
  Node: dom.window.Node,
  Element: dom.window.Element,
  Document: dom.window.Document,
  DocumentFragment: dom.window.DocumentFragment,
  document: dom.window.document,
  navigator: dom.window.navigator,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
})) {
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
}

const { renderMarkdown, makeColors, getDefaultThemeProfile, buildArticleAiGuide } = await import('./render-bundle.mjs')
const { buildPreview } = await import('./preview.mjs')

let failed = 0
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}`)
  } else {
    failed += 1
    console.error(`  ❌ ${name} ${detail}`)
  }
}

const defaultProfile = getDefaultThemeProfile() // #27ae60，与前端默认主题一致
const theme = makeColors(defaultProfile.accent, defaultProfile.dark)

// ── 1. 基础 Markdown 结构 ──
console.log('[1] 基础结构')
const basic = renderMarkdown(
  ['## 二级标题', '', '这是**加粗**与*斜体*段落。', '', '- 列表项一', '- 列表项二', '', '| 列A | 列B |', '| --- | --- |', '| 1 | 2 |', '', '```js', 'const a = 1;', '```'].join('\n'),
  theme,
)
check('标题渲染', basic.html.includes('<h2'))
check('加粗渲染', basic.html.includes('<strong'))
check('表格渲染', basic.html.includes('<table'))
check('代码块渲染', basic.html.includes('data-block="code"'))

// ── 2. KaTeX 公式（同步路径） ──
console.log('[2] 数学公式')
const math = renderMarkdown('质能方程 $E=mc^2$ 与块级公式：\n\n$$\\int_0^1 x\\,dx$$\n', theme)
check('行内公式（KaTeX）', math.html.includes('katex'))
check('块级公式（KaTeX）', (math.html.match(/katex-display|katex/g) || []).length >= 2)
// preview 页应为公式内嵌 katex 样式（含 katex-display class 与内嵌 <style>）
const mathPreview = buildPreview(math.html, '公式测试', { accent: theme.accent, dark: theme.dark })
check('preview 内嵌 KaTeX 样式', mathPreview.includes('katex-display') && mathPreview.includes('<style>') && mathPreview.includes('.katex'))

// ── 3. ::: 扩展容器组件 ──
console.log('[3] 扩展容器')
const callout = renderMarkdown(':::callout type="tip"\n这是一个**提示**容器。\n:::\n', theme)
check('callout 容器渲染', callout.html.includes('data-block="callout"') || callout.html.includes('提示'))

// ── 4. mermaid 优雅降级（同步路径无预渲染 SVG） ──
console.log('[4] mermaid 降级')
const mermaid = renderMarkdown('```mermaid\ngraph TD; A-->B;\n```\n', theme)
check('mermaid 不崩溃', typeof mermaid.html === 'string' && mermaid.html.length > 0)

// ── 5. 安全净化（慢路径 DOMParser） ──
console.log('[5] 安全净化')
const xss = renderMarkdown('正常段落\n\n<script>alert(1)</script>\n\n<img src=x onerror="alert(2)">\n', theme)
check('script 被剥离', !xss.html.includes('<script'))
check('onerror 被剥离', !xss.html.includes('onerror'))

// ── 6. 主题色参数生效（h2/引用/链接/compare 等元素注入 accent） ──
console.log('[6] 主题色')
const themed = renderMarkdown(
  [
    '## 二级标题',
    '',
    '> 引用块',
    '',
    '[链接](https://example.com)',
    '',
    ':::compare',
    '维度 | A 方描述 | B 方描述 | accent',
    '另一维度 | A 方描述 | B 方描述 | default',
    ':::',
  ].join('\n'),
  makeColors('#e74c3c', '#c0392b'),
)
check('accent 注入 HTML', (themed.html.match(/#e74c3c/g) || []).length >= 3)
// compare accent 行：整行 accent 背景 + B 方浅色高亮（见 layout-modules/infographic/compare.ts）
check('compare accent 高亮行渲染', themed.html.includes('background:#e74c3c') && themed.html.includes('rgba(255,255,255,0.18)'))

// ── 7. AI 排版指令（GET 端点内容源） ──
console.log('[7] AI 指令')
const guide = buildArticleAiGuide()
check('指令包含提示框语法（GFM alert）', guide.includes('[TIP]'))
check('指令包含 compare 语法', guide.includes(':::compare'))

// ── 汇总 ──
if (failed > 0) {
  console.error(`\n冒烟测试失败 ${failed} 项`)
  process.exit(1)
}
console.log('\n冒烟测试全部通过')
