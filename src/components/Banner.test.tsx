import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Banner from './Banner'

describe('Banner', () => {
  it('type="error" renderuje role="alert" z tekstem', () => {
    render(<Banner type="error" message="Coś poszło nie tak" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Coś poszło nie tak')
  })

  it('type="success" renderuje role="status"', () => {
    render(<Banner type="success" message="Zapisano" />)
    expect(screen.getByRole('status')).toHaveTextContent('Zapisano')
  })

  it('pusty message nic nie renderuje', () => {
    const { container } = render(<Banner type="error" message="" />)
    expect(container).toBeEmptyDOMElement()
  })
})
