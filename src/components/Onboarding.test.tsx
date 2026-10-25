import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Onboarding from './Onboarding'
import { supabase } from '../supabaseClient'

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: { signOut: vi.fn() },
  },
}))

const session = { user: { id: 'user-123' } }

const emptyProfile = { role: 'user', nickname: '' }

const mockUpdate = (result: { error: any }) => {
  const eq = vi.fn().mockResolvedValue(result)
  const update = vi.fn(() => ({ eq }))
  vi.mocked(supabase.from).mockReturnValue({ update } as any)
  return { update, eq }
}

const fillValid = () => {
  fireEvent.change(screen.getByPlaceholderText('np. silacz92'), { target: { value: 'tester1' } })
  const inputs = screen.getAllByRole('textbox')
  fireEvent.change(inputs[1], { target: { value: 'Jan' } })
  fireEvent.change(inputs[2], { target: { value: 'Kowalski' } })
  fireEvent.change(screen.getByDisplayValue('-- Wybierz --'), { target: { value: 'male' } })
  const date = document.querySelector('input[type="date"]') as HTMLInputElement
  fireEvent.change(date, { target: { value: '1996-06-01' } })
  fireEvent.change(screen.getByPlaceholderText('180'), { target: { value: '180' } })
  fireEvent.change(screen.getByPlaceholderText('75'), { target: { value: '80' } })
}

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Zapisz i zaczynamy' }))

describe('Onboarding', () => {
  const fetchProfile = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderOnboarding = () =>
    render(
      <Onboarding
        session={session}
        profile={emptyProfile}
        fetchProfile={fetchProfile}
      />,
    )

  it('pusty formularz pokazuje błąd nicku', () => {
    renderOnboarding()
    submit()
    expect(screen.getByText('Nickname musi mieć co najmniej 3 znaki.')).toBeInTheDocument()
  })

  it('poprawny nick bez imienia pokazuje błąd imienia i nazwiska', () => {
    renderOnboarding()
    fireEvent.change(screen.getByPlaceholderText('np. silacz92'), { target: { value: 'tester1' } })
    submit()
    expect(screen.getByText('Podaj imię i nazwisko.')).toBeInTheDocument()
  })

  it('kod błędu 23505 pokazuje komunikat o zajętym nicku', async () => {
    mockUpdate({ error: { code: '23505', message: 'duplicate key' } })
    renderOnboarding()
    fillValid()
    submit()

    expect(await screen.findByText('Ten nickname jest już zajęty. Wybierz inny.')).toBeInTheDocument()
    expect(fetchProfile).not.toHaveBeenCalled()
  })

  it('poprawny formularz zapisuje onboarding_done i odświeża profil', async () => {
    const { update, eq } = mockUpdate({ error: null })
    renderOnboarding()
    fillValid()
    submit()

    await waitFor(() => expect(fetchProfile).toHaveBeenCalledTimes(1))
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: 'tester1',
        first_name: 'Jan',
        last_name: 'Kowalski',
        gender: 'male',
        birth_date: '1996-06-01',
        height_cm: 180,
        weight_kg: 80,
        onboarding_done: true,
      }),
    )
    expect(eq).toHaveBeenCalledWith('id', 'user-123')
  })
})
