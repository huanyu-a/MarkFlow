import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { Input } from './Input'
import { Select } from './Select'

describe('Input', () => {
  it('渲染输入框并携带焦点环类', () => {
    render(<Input aria-label="标题" placeholder="请输入" />)
    const input = screen.getByLabelText('标题')
    expect(input).toHaveAttribute('placeholder', '请输入')
    expect(input.className).toContain('focus-visible:ring-2')
    expect(input.className).toContain('h-8')
  })

  it('透传 type 与 value', () => {
    render(<Input type="number" value="42" onChange={() => {}} aria-label="数量" />)
    expect(screen.getByLabelText('数量')).toHaveAttribute('type', 'number')
  })

  it('支持 ref 转发', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})

describe('Select', () => {
  it('渲染选项并可选择', () => {
    render(
      <Select aria-label="字号">
        <option value="sm">小</option>
        <option value="lg">大</option>
      </Select>,
    )
    const select = screen.getByLabelText('字号') as HTMLSelectElement
    expect(select.options).toHaveLength(2)
    expect(select.value).toBe('sm')
  })

  it('携带自定义 className', () => {
    render(<Select className="w-40" aria-label="字号" />)
    expect(screen.getByLabelText('字号').className).toContain('w-40')
  })
})
