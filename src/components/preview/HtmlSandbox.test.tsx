import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HtmlSandbox } from './HtmlSandbox'

describe('HtmlSandbox', () => {
  it('默认不开放任何沙箱权限，避免预览内容访问同源存储或执行脚本', () => {
    render(<HtmlSandbox html="<div>hello</div>" />)
    const iframe = screen.getByTitle('html-preview')
    expect(iframe.getAttribute('sandbox')).toBe('')
  })

  it('允许脚本时仍不开放同源权限，防止沙箱逃逸', () => {
    render(<HtmlSandbox html="<div>hello</div>" allowScripts />)
    const iframe = screen.getByTitle('html-preview')
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts')
  })

  it('空内容显示占位提示', () => {
    render(<HtmlSandbox html="" />)
    expect(screen.getByText(/粘贴 AI 生成的 HTML/)).toBeInTheDocument()
  })
})
