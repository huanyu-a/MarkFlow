import katex from 'katex'

// 数学公式支持：识别 $$...$$（块级）与 $...$（行内），用 KaTeX 渲染为 HTML。
//
// 为避免公式内容（含 *、_、^、~ 等字符）被 Markdown 行内规则破坏，采用「先抽取、
// 后回填」策略：解析前把公式替换为私有区 Unicode 占位符并渲染好 HTML 存表，解析
// 完成后再把占位符替换回 KaTeX 输出。

// ── 共享公式正则 ──────────────────────────────────────────────
// extractMath（KaTeX 抽取路径）与 collectFormulas（MathJax 预渲染收集路径）
// 必须使用同一套判定语义，否则会出现「预渲染收集了公式但抽取路径不认（或反之）」
// 的漂移（历史 bug：两条路径正则不一致，「原价$99现价$59」在 KaTeX 路径被整段
// 吞成公式）。防护规则（两端正则字面量完全一致，改一处必须同步另一处）：
//   - 起始 $：前面不接数字/$（排除 $$ 块级定界符与「2$x」量价混排）；
//     后面不接空白/数字/$（「$5涨到」式价格、$$ 紧邻均不算行内公式）
//   - 内容：非贪婪、首尾非空白、内部不含 $（拒绝跨价格配对，如
//     「价格从$5涨到$6。还有公式$a$」不会把 5涨到$6。还有公式 吞成公式）
//   - 结束 $：后面不接 $$（避免吃掉块级定界符开头）、不接字母数字/下划线
//     （「$6.99」式价格尾部、「$x$5」量价混排不算公式）
// 注意：行内 $ 允许跨行（与块级 $$ 的多行写法保持对称），行尾双空格换行等
// Markdown 细节不受影响（$ 本身不是 Markdown 控制字符）。
export const INLINE_MATH_SOURCE = String.raw`(?<![\d$])\$(?![\s\d$])([\s\S]+?)(?<!\s)\$(?!\$|\w)`
// 块级 $$...$$（允许跨行，非贪婪配对）
export const BLOCK_MATH_SOURCE = String.raw`\$\$([\s\S]+?)\$\$`

// 工厂函数：返回全新的 global 正则实例，避免 /g 的 lastIndex 在多次调用/多路径
// 之间互相污染（调用方以局部 const 缓存使用）。
export function createInlineMathRegex(): RegExp {
  return new RegExp(INLINE_MATH_SOURCE, 'g')
}
export function createBlockMathRegex(): RegExp {
  return new RegExp(BLOCK_MATH_SOURCE, 'g')
}

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

  // 先处理块级 $$...$$（允许跨行）；使用与 collectFormulas 相同的共享正则
  let text = md.replace(createBlockMathRegex(), (_m, expr: string) => {
    const token = `${TOKEN_OPEN}B${blockIdx++}${TOKEN_CLOSE}`
    const inner = renderKatex(expr, true)
    store.block.set(
      token,
      `<section style="text-align:center;margin:18px 0;overflow-x:auto">${inner}</section>`,
    )
    return token
  })

  // 再处理行内 $...$（允许跨行）；防护语义与 collectFormulas 完全一致：
  // 货币符号对（「原价$99现价$59」「价格从$5涨到$6」）保持字面，不被吞成公式
  text = text.replace(createInlineMathRegex(), (_m, expr: string) => {
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
