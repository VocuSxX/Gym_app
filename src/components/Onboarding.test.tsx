import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Onboarding from './Onboarding'
import { supabaseMock, setResult, resetMock } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'user-123' } }
const emptyProfile = { role: 'user', nickname: '' }

const renderOnboarding = (profile: any = emptyProfile) =>
  render(<Onboarding session={session} profile={profile} fetchProfile={vi.fn().mockResolvedValue(undefined)} />)

describe('Onboarding - wybór roli', () => {
  beforeEach(() => {
    resetMock()
    setResult('profiles', { data: null })
  })

  it('krok z wyborem roli (Ćwiczący / Trener / Siłownia) renderuje się', () => {
    renderOnboarding()

    expect(screen.getByText('Typ konta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ćwiczący/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Trener/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Siłownia/ })).toBeInTheDocument()
  })

  it('przy pustym nicku nie da się przejść dalej', async () => {
    renderOnboarding()

    fireEvent.click(screen.getByRole('button', { name: /Dalej/ }))

    expect(await screen.findByText('Nickname musi mieć co najmniej 3 znaki.')).toBeInTheDocument()
    expect(screen.queryByText('Podaj imię i nazwisko.')).not.toBeInTheDocument()
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('wybór roli „Siłownia” pokazuje pola siłowni', () => {
    renderOnboarding()

    fireEvent.click(screen.getByRole('button', { name: /Siłownia/ }))

    expect(screen.getByText('O Twojej siłowni')).toBeInTheDocument()
    expect(screen.queryByText('Imię')).not.toBeInTheDocument()
  })
})
