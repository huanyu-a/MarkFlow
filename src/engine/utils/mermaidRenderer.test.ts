// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'

// [C4] 使用 vi.mock 完全替换 mermaid 模块。jsdom 未实现 SVG 测量 API
// （getBBox / getComputedTextLength 等），真实 mermaid 会进入死循环导致
// 测试超时。mock 让我们只需验证调用链路和错误降级行为，不依赖浏览器。
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn((_id: string, diagram: string) => {
      if (diagram.trim().startsWith('this is not valid')) {
        throw new Error('Parse error')
      }
      return Promise.resolve({
        svg: `<svg id="m2v-mermaid-mock">${diagram}</svg>`,
        bindFunctions: vi.fn(),
      })
    }),
  },
}))

import { renderMermaidDiagram, ensureMermaid } from './mermaidRenderer'

describe('renderMermaidDiagram', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('合法 flowchart 渲染出含 svg 的字符串', async () => {
    const { svg, error } = await renderMermaidDiagram(
      'flowchart TD\n  A --> B',
      600,
    )
    expect(error).toBeUndefined()
    expect(svg).toContain('<svg')
  })

  it('合法 sequenceDiagram 渲染出含 svg 的字符串', async () => {
    const { svg, error } = await renderMermaidDiagram(
      'sequenceDiagram\n  Alice->>Bob: Hi',
      600,
    )
    expect(error).toBeUndefined()
    expect(svg).toContain('<svg')
  })

  it('非法语法返回 error 且 svg 为空', async () => {
    const { svg, error } = await renderMermaidDiagram(
      'this is not valid mermaid at all !!!',
      600,
    )
    expect(svg).toBe('')
    expect(error).toBeTruthy()
    expect(typeof error).toBe('string')
  })

  it('offscreen 容器渲染后被移除（DOM 干净）', async () => {
    await renderMermaidDiagram('flowchart TD\n  A --> B', 600)
    expect(document.body.querySelector('[id^="m2v-mermaid-"]')).toBeNull()
  })

  it('ensureMermaid 幂等（多次调用返回同一 Promise）', async () => {
    const p1 = ensureMermaid()
    const p2 = ensureMermaid()
    expect(p1).toBe(p2)
    await p1
  })
})
