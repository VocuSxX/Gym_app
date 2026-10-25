import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Auth from './Auth'
import { supabase } from './supabaseClient'

vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}))

const renderAuth = () =>
  render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>,
  )

const fillForm = (email: string, password: string) => {
  fireEvent.change(screen.getByPlaceholderText('Twój e-mail'), { target: { value: email } })
  fireEvent.change(screen.getByPlaceholderText('Hasło'), { target: { value: password } })
}

describe('Auth', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    alertSpy.mockRestore()
  })

  it('błędne dane logowania pokazują komunikat i nie wywołują alert()', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    } as any)
    renderAuth()
    fillForm('test@example.com', 'zlehaslo')
    fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }))

    expect(await screen.findByText('Nieprawidłowy e-mail lub hasło.')).toBeInTheDocument()
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('rejestracja bez e-maila i hasła pokazuje walidację', () => {
    renderAuth()
    fireEvent.click(screen.getByRole('button', { name: /Zarejestruj się/ }))

    expect(screen.getByText('Wpisz e-mail i hasło, aby założyć konto.')).toBeInTheDocument()
    expect(supabase.auth.signUp).not.toHaveBeenCalled()
  })

  it('rejestracja z istniejącym e-mailem pokazuje odpowiedni komunikat', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {},
      error: { message: 'User already registered' },
    } as any)
    renderAuth()
    fillForm('test@example.com', 'haslo123')
    fireEvent.click(screen.getByRole('button', { name: /Zarejestruj się/ }))

    expect(await screen.findByText('Konto z takim e-mailem już istnieje.')).toBeInTheDocument()
  })

  it('rejestracja bez sesji pokazuje komunikat o potwierdzeniu e-maila', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { session: null, user: {} },
      error: null,
    } as any)
    renderAuth()
    fillForm('nowy@example.com', 'haslo123')
    fireEvent.click(screen.getByRole('button', { name: /Zarejestruj się/ }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/^Konto utworzone!/),
    )
  })
})
