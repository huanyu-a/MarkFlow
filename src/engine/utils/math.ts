import katex from 'katex'

// 数学公式支持：识别 $$...$$（块级）与 $...$（行内），用 KaTeX 渲染为 HTML。
//
// 为避免公式内容（含 *、_、^、~ 等字符）被 Markdown 行内规则破坏，采用「先抽取、
// 后回填」策略：解析前把公式替换为私有区 Unicode 占位符并渲染好 HTML 存表，解析
// 完成后再把占位符替换回 KaTeX 输出。

// 私有使用区字符作占位符分隔，确保不与任何 Markdown 语法冲突
const TOKEN_OPEN = '\uE000'
const TOKEN_CLOSE = '\uE001'

export interface MathStore {
  // token -> 渲染后的 HTML
  inline: Map<string, string>
  block: Map<string, string>
}

function renderKatex(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr.trim(), {
      displayMode,
      throwOnError: false,
      output: 'html',
    })
  } catch {
    // 渲染失败时退化为原始文本，避免整篇崩溃
    return displayMode ? `$$${expr}$$` : `$${expr}$`
  }
}

// 抽取公式：返回替换为占位符后的文本与渲染表
export function extractMath(md: string): { text: string; store: MathStore } {
  const store: MathStore = { inline: new Map(), block: new Map() }
  let blockIdx = 0
  let inlineIdx = 0

  // 先处理块级 $$...$$（允许跨行）
  let text = md.replace(/\$\$([\s\S]+?)\$\$/g, (_m, expr: string) => {
    const token = `${TOKEN_OPEN}B${blockIdx++}${TOKEN_CLOSE}`
    const inner = renderKatex(expr, true)
    store.block.set(
      token,
      `<section style="text-align:center;margin:18px 0;overflow-x:auto">${inner}</section>`,
    )
    return token
  })

  // 再处理行内 $...$（允许跨行，避免误吞货币符号：$ 后不接空格、内容非空）
  text = text.replace(/\$(?!\s)([\s\S]+?)(?<!\s)\$(?!\$)/g, (_m, expr: string) => {
    const token = `${TOKEN_OPEN}I${inlineIdx++}${TOKEN_CLOSE}`
    store.inline.set(token, renderKatex(expr, false))
    return token
  })

  return { text, store }
}

// 回填公式：把占位符替换回 KaTeX HTML。块级公式可能被解析器包进 <p>，一并剥离。
export function restoreMath(html: string, store: MathStore): string {
  let out = html
  for (const [token, value] of store.block) {
    // 先处理被 <p> 包裹的情况，再处理裸占位符
    out = out.split(`<p>${token}</p>`).join(value).split(token).join(value)
  }
  for (const [token, value] of store.inline) {
    out = out.split(token).join(value)
  }
  return out
}
