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
  ambientBlobs,
} from './ui'

describe('klasy Design Systemu (src/ui.ts)', () => {
  it('glassCard aplikuje efekt Apple Glass', () => {
    render(<div data-testid="card" className={glassCard} />)
    expect(screen.getByTestId('card')).toHaveClass(
      'backdrop-blur-xl',
      'border-white/10',
      'rounded-3xl',
    )
  })

  it('btnPrimary ma styl Duolingo (gruby, sprężysty) i działa z btnDisabled', () => {
    render(
      <button disabled className={`${btnPrimary} ${btnDisabled}`}>
        Zapisz
      </button>,
    )
    const btn = screen.getByRole('button', { name: 'Zapisz' })
    expect(btn).toHaveClass('bg-emerald-500', 'font-bold', 'rounded-2xl', 'active:scale-95')
    expect(btn).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
    expect(btn).toBeDisabled()
  })

  it('warianty przycisków mają różne kolory akcji', () => {
    render(
      <>
        <button className={btnGhost}>Anuluj</button>
        <button className={btnDanger}>Usuń</button>
      </>,
    )
    expect(screen.getByText('Anuluj')).toHaveClass('bg-white/5', 'text-zinc-300')
    expect(screen.getByText('Usuń')).toHaveClass('bg-red-500/10', 'text-red-400')
  })

  it('banery błędu i sukcesu mają odpowiednie kolory', () => {
    render(
      <>
        <div role="alert" className={bannerError}>Błąd</div>
        <div role="status" className={bannerSuccess}>OK</div>
      </>,
    )
    expect(screen.getByRole('alert')).toHaveClass('border-red-500/30', 'text-red-300')
    expect(screen.getByRole('status')).toHaveClass('border-emerald-500/30', 'text-emerald-300')
  })

  it('ambientBlobs to 3 nieinteraktywne plamy światła', () => {
    expect(ambientBlobs).toHaveLength(3)
    for (const blob of ambientBlobs) {
      expect(blob).toContain('pointer-events-none')
      expect(blob).toContain('blur-3xl')
    }
  })
})
