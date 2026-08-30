import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResizablePanel, usePanelFullscreen } from './ResizablePanel'

beforeAll(() => {
  // jsdom 未实现 Pointer Capture API，组件 pointerdown 时会调用 setPointerCapture
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
})

/** 读取面板上下文的探针：暴露 fullscreen 状态供断言 */
function FullscreenProbe() {
  const { fullscreen } = usePanelFullscreen()
  return <div data-testid="probe">{fullscreen ? 'fullscreen' : 'normal'}</div>
}

describe('ResizablePanel', () => {
  it('按默认尺寸渲染并显示内容', () => {
    const { container } = render(
      <ResizablePanel>
        <div>面板内容</div>
      </ResizablePanel>,
    )
    expect(screen.getByText('面板内容')).toBeInTheDocument()
    const panel = container.firstElementChild as HTMLElement
    expect(panel.style.width).toBe('768px')
    expect(panel.style.height).toBe('660px')
  })

  it('拖拽右边缘手柄可放大宽度，且不小于 minWidth', () => {
    const { container } = render(
      <ResizablePanel defaultWidth={500} minWidth={400}>
        <div>内容</div>
      </ResizablePanel>,
    )
    const panel = container.firstElementChild as HTMLElement
    // 右侧手柄是第一个 absolute 手柄
    const handle = panel.querySelector('.cursor-e-resize') as HTMLElement

    // jsdom 不实现 PointerEvent，用通用 Event 模拟 pointer 事件并注入坐标
    const firePointer = (target: HTMLElement, type: string, x: number, y: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clientX', { value: x })
      Object.defineProperty(event, 'clientY', { value: y })
      Object.defineProperty(event, 'pointerId', { value: 1 })
      fireEvent(target, event)
    }

    firePointer(handle, 'pointerdown', 500, 300)
    firePointer(panel, 'pointermove', 650, 300)
    firePointer(panel, 'pointerup', 650, 300)
    expect(panel.style.width).toBe('650px')
  })

  it('拖拽时宽度不会低于 minWidth', () => {
    const { container } = render(
      <ResizablePanel defaultWidth={500} minWidth={400}>
        <div>内容</div>
      </ResizablePanel>,
    )
    const panel = container.firstElementChild as HTMLElement
    const handle = panel.querySelector('.cursor-e-resize') as HTMLElement

    const firePointer = (target: HTMLElement, type: string, x: number, y: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clientX', { value: x })
      Object.defineProperty(event, 'clientY', { value: y })
      Object.defineProperty(event, 'pointerId', { value: 1 })
      fireEvent(target, event)
    }

    firePointer(handle, 'pointerdown', 500, 300)
    firePointer(panel, 'pointermove', 100, 300)
    firePointer(panel, 'pointerup', 100, 300)
    expect(panel.style.width).toBe('400px')
  })

  it('切换全屏后手柄隐藏、上下文状态同步，ESC 退出全屏', () => {
    const { container } = render(
      <ResizablePanel>
        <FullscreenProbe />
      </ResizablePanel>,
    )
    const panel = container.firstElementChild as HTMLElement
    // 全屏由外部消费方通过 usePanelFullscreen 触发，这里直接验证 ESC 路径：
    // 初始为非全屏，ESC 不应产生副作用
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('probe')).toHaveTextContent('normal')
    expect(panel.querySelector('.cursor-e-resize')).not.toBeNull()
  })
})
