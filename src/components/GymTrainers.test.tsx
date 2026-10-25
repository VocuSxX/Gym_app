import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GymTrainers from './GymTrainers'
import { setResult, resetMock, callsOf } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'u1' } }
const gym = { id: 'g1', name: 'Iron' }

const invite = (nick: string) => {
  fireEvent.change(screen.getByPlaceholderText('Nick trenera'), { target: { value: nick } })
  fireEvent.click(screen.getByRole('button', { name: 'Zaproś' }))
}

describe('GymTrainers', () => {
  beforeEach(() => {
    resetMock()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-25T12:00:00'))
    setResult('gyms', { data: gym })
    setResult('gym_trainers', { data: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('bez siłowni pokazuje komunikat o utworzeniu profilu', async () => {
    setResult('gyms', { data: null })
    render(<GymTrainers session={session} />)

    expect(await screen.findByText(/Najpierw utwórz profil siłowni/)).toBeInTheDocument()
  })

  it('nieistniejący nick pokazuje błąd', async () => {
    setResult('profiles', { data: null })
    render(<GymTrainers session={session} />)
    await screen.findByPlaceholderText('Nick trenera')

    invite('nikt')

    expect(await screen.findByText('Nie znaleziono użytkownika o takim nicku.')).toBeInTheDocument()
  })

  it('użytkownik bez roli trenera nie może zostać zaproszony', async () => {
    setResult('profiles', { data: { id: 't1', nickname: 'coach', role: 'user' } })
    render(<GymTrainers session={session} />)
    await screen.findByPlaceholderText('Nick trenera')

    invite('coach')

    expect(await screen.findByText('Ten użytkownik nie jest trenerem.')).toBeInTheDocument()
  })

  it('trener już na liście nie może być zaproszony ponownie', async () => {
    setResult('gym_trainers', {
      data: [{ id: 'r1', status: 'active', trainer: { id: 't1', nickname: 'coach' } }],
    })
    setResult('profiles', { data: { id: 't1', nickname: 'coach', role: 'trainer' } })
    render(<GymTrainers session={session} />)
    await screen.findByText('@coach')

    invite('coach')

    expect(await screen.findByText('Ten trener jest już na liście.')).toBeInTheDocument()
  })

  it('zaproszenie trenera zapisuje insert i pokazuje potwierdzenie', async () => {
    setResult('profiles', { data: { id: 't1', nickname: 'coach', role: 'trainer' } })
    render(<GymTrainers session={session} />)
    await screen.findByPlaceholderText('Nick trenera')

    invite('coach')

    expect(await screen.findByText('Zaproszenie wysłane do @coach.')).toBeInTheDocument()
    expect(callsOf('gym_trainers', 'insert')[0].args[0]).toEqual({
      gym_id: 'g1',
      trainer_id: 't1',
    })
  })
})
