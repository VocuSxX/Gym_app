import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Chat from './Chat'
import { setResult, resetMock, callsOf } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'u1' } }

const profiles = [
  { id: 'u2', nickname: 'ania', role: 'user' },
  { id: 'u3', nickname: 'trener', role: 'trainer' },
]

describe('Chat', () => {
  beforeEach(() => {
    resetMock()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-25T12:00:00'))
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pokazuje kontakty ze znajomych i trenerów', async () => {
    setResult('friendships', { data: [{ requester_id: 'u1', addressee_id: 'u2' }] })
    setResult('trainer_clients', { data: [{ trainer_id: 'u3', client_id: 'u1' }] })
    setResult('profiles', { data: profiles })
    render(<Chat session={session} />)

    expect(await screen.findByText('@ania')).toBeInTheDocument()
    expect(screen.getByText('@trener')).toBeInTheDocument()

    const inCall = callsOf('profiles', 'in')[0]
    expect(inCall.args[0]).toBe('id')
    expect(inCall.args[1]).toEqual(expect.arrayContaining(['u2', 'u3']))
    expect(inCall.args[1]).not.toContain('u1')
  })

  it('bez kontaktów pokazuje komunikat i nie pyta o profile', async () => {
    setResult('friendships', { data: [] })
    setResult('trainer_clients', { data: [] })
    render(<Chat session={session} />)

    expect(await screen.findByText(/Brak kontaktów/)).toBeInTheDocument()
    expect(callsOf('profiles', 'in')).toHaveLength(0)
  })

  it('wysyłanie wiadomości zapisuje insert z treścią', async () => {
    setResult('friendships', { data: [{ requester_id: 'u1', addressee_id: 'u2' }] })
    setResult('trainer_clients', { data: [] })
    setResult('profiles', { data: [profiles[0]] })
    setResult('messages', { data: [] })
    render(<Chat session={session} />)

    fireEvent.click(await screen.findByRole('button', { name: /@ania/ }))
    expect(await screen.findByText(/To początek waszej konwersacji/)).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Napisz wiadomość...'), {
      target: { value: 'Hej' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Wyślij' }))

    await vi.waitFor(() => expect(callsOf('messages', 'insert')).toHaveLength(1))
    expect(callsOf('messages', 'insert')[0].args[0]).toEqual({
      sender_id: 'u1',
      receiver_id: 'u2',
      content: 'Hej',
    })
  })
})
