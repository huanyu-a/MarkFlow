import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('renders with value and onChange', () => {
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {}
    render(<Textarea value="abc" onChange={onChange} />)
    expect(screen.getByRole('textbox')).toHaveValue('abc')
  })

  it('applies aria-label', () => {
    render(<Textarea aria-label="note" />)
    expect(screen.getByLabelText('note')).toBeInTheDocument()
  })
})
