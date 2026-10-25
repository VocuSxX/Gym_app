import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Friends from './Friends'
import { setResult, resetMock, callsOf } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'u1' } }

const friendships = [
  {
    id: 'f1',
    status: 'accepted',
    requester_id: 'u1',
    addressee_id: 'u2',
    requester: { id: 'u1', nickname: 'ja' },
    addressee: { id: 'u2', nickname: 'ania' },
  },
  {
    id: 'f2',
    status: 'pending',
    requester_id: 'u3',
    addressee_id: 'u1',
    requester: { id: 'u3', nickname: 'bartek' },
    addressee: { id: 'u1', nickname: 'ja' },
  },
  {
    id: 'f3',
    status: 'pending',
    requester_id: 'u1',
    addressee_id: 'u4',
    requester: { id: 'u1', nickname: 'ja' },
    addressee: { id: 'u4', nickname: 'celina' },
  },
]

const sendInvite = async (nick: string) => {
  fireEvent.change(screen.getByPlaceholderText('Nick znajomego'), { target: { value: nick } })
  fireEvent.click(screen.getByRole('button', { name: 'Zaproś' }))
}

describe('Friends', () => {
  beforeEach(() => {
    resetMock()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-25T12:00:00'))
    setResult('friendships', { data: friendships })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pokazuje znajomych, zaproszenia i wysłane zaproszenia', async () => {
    render(<Friends session={session} />)

    expect(await screen.findByText('@ania')).toBeInTheDocument()
    expect(screen.getByText('@bartek')).toBeInTheDocument()
    expect(screen.getByText('@celina')).toBeInTheDocument()
    expect(screen.getByText('Twoi znajomi (1)')).toBeInTheDocument()
    expect(screen.getByText('Zaproszenia do Ciebie (1)')).toBeInTheDocument()
    expect(screen.getByText('Wysłane zaproszenia (1)')).toBeInTheDocument()
  })

  it('akceptacja zaproszenia aktualizuje status', async () => {
    render(<Friends session={session} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Akceptuj' }))

    await vi.waitFor(() =>
      expect(callsOf('friendships', 'update')[0].args[0]).toEqual({ status: 'accepted' }),
    )
  })

  it('nieistniejący nick pokazuje błąd', async () => {
    setResult('profiles', { data: null })
    render(<Friends session={session} />)
    await screen.findByText('@ania')

    await sendInvite('zed')

    expect(await screen.findByText('Nie znaleziono użytkownika o takim nicku.')).toBeInTheDocument()
  })

  it('zaproszenie do samego siebie pokazuje błąd', async () => {
    setResult('profiles', { data: { id: 'u1', nickname: 'ja' } })
    render(<Friends session={session} />)
    await screen.findByText('@ania')

    await sendInvite('ja')

    expect(await screen.findByText('Nie możesz zaprosić samego siebie.')).toBeInTheDocument()
  })

  it('zaproszenie do istniejącego znajomego pokazuje błąd', async () => {
    setResult('profiles', { data: { id: 'u2', nickname: 'ania' } })
    render(<Friends session={session} />)
    await screen.findByText('@ania')

    await sendInvite('ania')

    expect(await screen.findByText('Jesteście już znajomymi.')).toBeInTheDocument()
  })

  it('poprawne zaproszenie wysyła insert i pokazuje potwierdzenie', async () => {
    setResult('profiles', { data: { id: 'u9', nickname: 'zed' } })
    render(<Friends session={session} />)
    await screen.findByText('@ania')

    await sendInvite('zed')

    expect(await screen.findByText('Zaproszenie wysłane do @zed.')).toBeInTheDocument()
    expect(callsOf('friendships', 'insert')[0].args[0]).toEqual({
      requester_id: 'u1',
      addressee_id: 'u9',
    })
  })
})
