import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'
import { supabaseMock, resetMock } from './test/supabaseMock'

vi.mock('./supabaseClient', async () => {
  const { supabaseMock } = await import('./test/supabaseMock')
  return { supabase: supabaseMock }
})

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )

describe('Login', () => {
  beforeEach(() => {
    resetMock()
    supabaseMock.auth.signInWithPassword.mockClear()
  })

  it('renderuje pola e-mail, hasło i przycisk logowania', () => {
    renderLogin()

    expect(screen.getByPlaceholderText('Twój e-mail')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Hasło')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument()
  })

  it('submit wywołuje supabase.auth.signInWithPassword z danymi z formularza', async () => {
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText('Twój e-mail'), { target: { value: 'jan@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Hasło'), { target: { value: 'tajne123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }))

    await waitFor(() => expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledTimes(1))
    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'jan@example.com',
      password: 'tajne123',
    })
  })

  it('błąd z Supabase pokazuje przetłumaczony komunikat w alert', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText('Twój e-mail'), { target: { value: 'jan@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Hasło'), { target: { value: 'zle' } })
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Nieprawidłowy e-mail lub hasło.')
  })
})
