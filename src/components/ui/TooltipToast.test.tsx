import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tooltip } from './Tooltip'
import { Toast, type ToastState } from './Toast'

describe('Tooltip', () => {
  it('悬停触发时在 Portal 中显示 role=tooltip', () => {
    render(
      <Tooltip text="导出为 PNG">
        <button>操作</button>
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.mouseEnter(screen.getByRole('button'))
    expect(screen.getByRole('tooltip').textContent).toBe('导出为 PNG')
    fireEvent.mouseLeave(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('disabled 时不显示提示', () => {
    render(
      <Tooltip text="提示" disabled>
        <button>操作</button>
      </Tooltip>,
    )
    fireEvent.mouseEnter(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})

describe('Toast', () => {
  it('渲染消息文本', () => {
    const toast: ToastState = { message: '已复制到剪贴板', key: 1 }
    render(<Toast toast={toast} />)
    expect(screen.getByText('已复制到剪贴板')).toBeTruthy()
  })

  it('toast 为 null 时不渲染', () => {
    const { container } = render(<Toast toast={null} />)
    expect(container.firstChild).toBeNull()
  })
})
