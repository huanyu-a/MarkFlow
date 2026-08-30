import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FontSelect } from './FontSelect'

describe('FontSelect', () => {
  it('渲染三个字体选项，当前值正确回显', () => {
    render(<FontSelect value="songti" onChange={() => {}} />)
    const select = screen.getByRole('combobox', { name: '字体选择' })
    expect(select).toHaveValue('songti')
    expect(screen.getByRole('option', { name: '宋体' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '仿宋' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '黑体' })).toBeInTheDocument()
  })

  it('切换选项时以 FontFamilyOption 类型回调新值', () => {
    const onChange = vi.fn()
    render(<FontSelect value="songti" onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox', { name: '字体选择' }), {
      target: { value: 'heiti' },
    })
    expect(onChange).toHaveBeenCalledWith('heiti')
  })
})
