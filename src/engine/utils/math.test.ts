import { describe, it, expect } from 'vitest'
import { extractMath, restoreMath, createInlineMathRegex } from './math'

/**
 * extractMath 公式识别测试（重点：行内 $...$ 的货币符号防护）
 *
 * 背景：行内公式正则此前缺数字防护，「原价$99现价$59」在 KaTeX 路径被整段
 * 吞成公式，而 collectFormulas（MathJax 路径）已带防护——两条路径漂移。
 * 修复后二者共用 createInlineMathRegex() 同一防护语义。
 */

// 私有区占位符不可打印，断言时统一替换为可读标记便于匹配
const stripTokens = (s: string) => s.replace(/[\uE000\uE001]/g, '')

describe('extractMath - 行内公式的货币符号防护', () => {
  it('「原价$99现价$59」货币对字面保留，不被吞成公式', () => {
    const { text, store } = extractMath('原价$99现价$59元，非常划算')
    expect(store.inline.size).toBe(0)
    expect(stripTokens(text)).toContain('原价$99现价$59元')
  })

  it('「价格从$5涨到$6」货币对字面保留', () => {
    const { text, store } = extractMath('价格从$5涨到$6，翻了不止一倍')
    expect(store.inline.size).toBe(0)
    expect(stripTokens(text)).toContain('价格从$5涨到$6')
  })

  it('标准行内公式 $E=mc^2$（前后非数字）正常抽取渲染', () => {
    const { text, store } = extractMath('质能方程 $E=mc^2$ 很优美')
    expect(store.inline.size).toBe(1)
    const [html] = store.inline.values()
    expect(html).toContain('katex')
    expect(html).toContain('mord') // KaTeX 输出的字符 token 类名，宽松断言渲染发生
    // 占位符回填后原文恢复结构
    const restored = stripTokens(restoreMath(`<p>${text}</p>`, store))
    expect(restored).toContain('katex')
    expect(restored).toContain('很优美')
  })

  it('公式紧邻数字的边界：$x$5 / 2$x$ 不抽，$a$ 与货币混排时仅抽 $a$', () => {
    // 结束 $ 后紧跟数字（$x$5）→ 判为量价混排，不算公式
    expect(extractMath('变量 $x$5 不是公式').store.inline.size).toBe(0)
    // 起始 $ 前紧跟数字（2$x$）→ 同上
    expect(extractMath('半径2$r$圆 不是公式').store.inline.size).toBe(0)
    // 货币与公式混排：只有独立成对的 $a$ 被抽取，货币字面保留、不被跨配对吞掉
    const { text, store } = extractMath('价格从$5涨到$6。还有公式$a$在这里')
    expect(store.inline.size).toBe(1)
    expect(stripTokens(text)).toContain('价格从$5涨到$6。还有公式')
  })

  it('块级 $$...$$ 与行内共享正则互不误伤（$$ 定界符不被行内路径吃掉）', () => {
    const { text, store } = extractMath('混排 $E=mc^2$ 与块级：\n\n$$\\int_0^1 x\\,dx$$\n')
    expect(store.inline.size).toBe(1)
    expect(store.block.size).toBe(1)
    expect(stripTokens(text)).not.toMatch(/\$(?![\s])/) // 剩余文本无裸露 $公式$ 结构
  })

  it('共享正则工厂返回独立实例（global 正则 lastIndex 不互相污染）', () => {
    const r1 = createInlineMathRegex()
    const r2 = createInlineMathRegex()
    expect(r1.lastIndex).toBe(0)
    expect(r2.lastIndex).toBe(0)
    // 同一实例连续 test 会因 lastIndex 前移而漏配，实例间必须彼此独立
    const s = '$a$ 与 $b$'
    expect(r1.test(s)).toBe(true)
    expect(r1.lastIndex).toBeGreaterThan(0)
    expect(r2.test(s)).toBe(true)
  })
})
