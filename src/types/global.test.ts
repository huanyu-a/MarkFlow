import { describe, it, expect, beforeEach } from 'vitest'

describe('global window extensions (3.7)', () => {
  beforeEach(() => {
    // 每个测试前清理挂在 window 上的扩展属性
    delete window.MathJax
    delete (window as Window).__m2vReady
    delete (window as Window).__m2vRender
  })

  it('allows typed assignment to window.MathJax', () => {
    window.MathJax = {
      svg: { fontCache: 'none' },
      startup: { typeset: false },
      tex2svg: (formula: string, options: { display: boolean }) => {
        const el = document.createElement('div')
        el.textContent = `${options.display ? 'block' : 'inline'}:${formula}`
        return el
      },
    }

    expect(window.MathJax).toBeDefined()
    expect(window.MathJax?.svg.fontCache).toBe('none')
  })

  it('allows typed access to __m2vRender and __m2vReady', () => {
    const render = async (_html: string, _css: string) => 3
    window.__m2vRender = render
    window.__m2vReady = true

    expect(window.__m2vReady).toBe(true)
    expect(typeof window.__m2vRender).toBe('function')
  })
})
