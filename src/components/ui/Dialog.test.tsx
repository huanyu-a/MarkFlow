import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dialog } from './Dialog'

describe('Dialog', () => {
  it('renders children when open', () => {
    render(
      <Dialog isOpen onClose={() => {}}>
        <span>hello</span>
      </Dialog>,
    )
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(
      <Dialog isOpen={false} onClose={() => {}}>
        <span>hidden</span>
      </Dialog>,
    )
    expect(screen.queryByText('hidden')).not.toBeInTheDocument()
  })

  it('calls onClose when overlay is clicked', () => {
    let closed = false
    render(
      <Dialog isOpen onClose={() => { closed = true }}>
        <span>overlay test</span>
      </Dialog>,
    )
    const overlay = screen.getByRole('dialog').parentElement!
    overlay.click()
    expect(closed).toBe(true)
  })
})
