import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('shows config warning when not ready', () => {
    render(
      <EmptyState isRunning={false} configReady={false} error="" onRun={() => {}} onStop={() => {}} />,
    )
    expect(screen.getByText(/请先在/)).toBeInTheDocument()
  })

  it('hides config warning when ready', () => {
    render(
      <EmptyState isRunning={false} configReady error="" onRun={() => {}} onStop={() => {}} />,
    )
    expect(screen.queryByText(/请先在/)).not.toBeInTheDocument()
  })
})
