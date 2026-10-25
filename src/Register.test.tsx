import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Register from './Register'
import { supabaseMock, resetMock } from './test/supabaseMock'

vi.mock('./supabaseClient', async () => {
  const { supabaseMock } = await import('./test/supabaseMock')
  return { supabase: supabaseMock }
})

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  )

const fill = (password: string, password2: string) => {
  fireEvent.change(screen.getByPlaceholderText('Twój e-mail'), { target: { value: 'jan@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Hasło (min. 6 znaków)'), { target: { value: password } })
  fireEvent.change(screen.getByPlaceholderText('Powtórz hasło'), { target: { value: password2 } })
  fireEvent.click(screen.getByRole('button', { name: /Dalej/ }))
}

describe('Register', () => {
  beforeEach(() => {
    resetMock()
    supabaseMock.auth.signUp.mockClear()
  })

  it('różne hasła pokazują błąd „Hasła nie są takie same.”', async () => {
    renderRegister()
    fill('haslo123', 'inne123')

    expect(await screen.findByRole('alert')).toHaveTextContent('Hasła nie są takie same.')
    expect(supabaseMock.auth.signUp).not.toHaveBeenCalled()
  })

  it('hasło krótsze niż 6 znaków pokazuje błąd', async () => {
    renderRegister()
    fill('abc', 'abc')

    expect(await screen.findByRole('alert')).toHaveTextContent('Hasło musi mieć co najmniej 6 znaków.')
    expect(supabaseMock.auth.signUp).not.toHaveBeenCalled()
  })

  it('poprawny submit wywołuje supabase.auth.signUp', async () => {
    renderRegister()
    fill('haslo123', 'haslo123')

    await waitFor(() => expect(supabaseMock.auth.signUp).toHaveBeenCalledTimes(1))
    expect(supabaseMock.auth.signUp).toHaveBeenCalledWith({
      email: 'jan@example.com',
      password: 'haslo123',
    })
  })

  it('brak sesji w odpowiedzi pokazuje ekran „Sprawdź skrzynkę”', async () => {
    supabaseMock.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'u1' }, session: null },
      error: null,
    })
    renderRegister()
    fill('haslo123', 'haslo123')

    expect(await screen.findByText('Sprawdź skrzynkę')).toBeInTheDocument()
  })
})
