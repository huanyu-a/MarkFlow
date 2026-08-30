import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createRef } from 'react'
import { Button } from './Button'

describe('Button', () => {
  it('默认 outline 变体与 sm 尺寸', () => {
    render(<Button>确定</Button>)
    const btn = screen.getByRole('button', { name: '确定' })
    expect(btn.className).toContain('border')
    expect(btn.className).toContain('h-8')
  })

  it('primary 变体使用强调色背景', () => {
    render(<Button variant="primary">保存</Button>)
    expect(screen.getByRole('button', { name: '保存' }).className).toContain('bg-[var(--accent)]')
  })

  it('md 尺寸与 ghost 变体', () => {
    render(<Button variant="ghost" size="md">取消</Button>)
    const btn = screen.getByRole('button', { name: '取消' })
    expect(btn.className).toContain('h-9')
    expect(btn.className).toContain('bg-transparent')
  })

  it('透传 disabled 与 onClick', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>导出</Button>)
    const btn = screen.getByRole('button', { name: '导出' })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('支持 ref 转发', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>焦点</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
