import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

/** 测试用：抛出运行时异常的子组件 */
function Boom(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('正常渲染子组件', () => {
    render(
      <ErrorBoundary fallback={<div>出错了</div>}>
        <div>正常内容</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('正常内容')).toBeInTheDocument()
    expect(screen.queryByText('出错了')).not.toBeInTheDocument()
  })

  it('捕获子组件异常后渲染 fallback', () => {
    // ErrorBoundary 内部会 console.error 记录异常，避免污染测试输出
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={<div>出错了</div>}>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText('出错了')).toBeInTheDocument()
    spy.mockRestore()
  })
})
