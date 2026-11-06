import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  glassCard,
  btnPrimary,
  btnGhost,
  btnDanger,
  btnDisabled,
  bannerError,
  bannerSuccess,
  pageBg,
} from './ui'

describe('klasy Design Systemu (src/ui.ts)', () => {
  it('glassCard to nieprzezroczysty kafelek jaśniejszy od tła', () => {
    render(<div data-testid="card" className={glassCard} />)
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('bg-zinc-900', 'border-zinc-800', 'rounded-2xl')
    expect(card).not.toHaveClass('backdrop-blur-xl')
  })

  it('btnPrimary ma akcent, reakcję na naciśnięcie i działa z btnDisabled', () => {
    render(
      <button disabled className={`${btnPrimary} ${btnDisabled}`}>
        Zapisz
      </button>,
    )
    const btn = screen.getByRole('button', { name: 'Zapisz' })
    expect(btn).toHaveClass('bg-accent-500', 'rounded-xl', 'active:scale-[.97]')
    expect(btn).toHaveClass('disabled:opacity-40', 'disabled:pointer-events-none')
    expect(btn).toBeDisabled()
  })

  it('warianty przycisków mają różne kolory akcji', () => {
    render(
      <>
        <button className={btnGhost}>Anuluj</button>
        <button className={btnDanger}>Usuń</button>
      </>,
    )
    expect(screen.getByText('Anuluj')).toHaveClass('bg-zinc-800', 'text-zinc-200')
    expect(screen.getByText('Usuń')).toHaveClass('bg-red-500/10', 'text-red-300')
  })

  it('banery błędu i sukcesu mają odpowiednie kolory', () => {
    render(
      <>
        <div role="alert" className={bannerError}>Błąd</div>
        <div role="status" className={bannerSuccess}>OK</div>
      </>,
    )
    expect(screen.getByRole('alert')).toHaveClass('border-red-500/30', 'text-red-300')
    expect(screen.getByRole('status')).toHaveClass('border-green-500/30', 'text-green-300')
  })

  it('pageBg daje tło z fakturą', () => {
    expect(pageBg).toContain('bg-knurl')
  })
})
