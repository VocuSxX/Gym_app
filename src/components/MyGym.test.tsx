import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MyGym from './MyGym'
import { setResult, resetMock, callsOf } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'u1' } }

describe('MyGym', () => {
  beforeEach(() => {
    resetMock()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-25T12:00:00'))
    window.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ćwiczący widzi siłownię z trenerem i może do niej dołączyć', async () => {
    setResult('gym_members', { data: [] })
    setResult('gyms', {
      data: [{ id: 'g1', name: 'Iron', address: 'Warszawa', description: 'd' }],
    })
    setResult('gym_trainers', {
      data: [{ gym_id: 'g1', trainer: { nickname: 'coach' } }],
    })
    const fetchProfile = vi.fn().mockResolvedValue(undefined)
    render(
      <MyGym session={session} profile={{ role: 'user' }} fetchProfile={fetchProfile} />,
    )

    expect(await screen.findByText(/Iron/)).toBeInTheDocument()
    expect(screen.getByText(/coach/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dołącz' }))

    await vi.waitFor(() => expect(fetchProfile).toHaveBeenCalledTimes(1))
    expect(callsOf('gym_members', 'delete')).toHaveLength(1)
    expect(callsOf('gym_members', 'insert')[0].args[0]).toEqual({
      gym_id: 'g1',
      user_id: 'u1',
    })
    expect(callsOf('profiles', 'update')[0].args[0]).toEqual({ gym_id: 'g1' })
  })

  it('trener akceptuje zaproszenie i zmienia status na active', async () => {
    setResult('gym_trainers', {
      data: [{ id: 'r1', status: 'pending', gym: { id: 'g1', name: 'Iron', address: 'W' } }],
    })
    render(
      <MyGym session={session} profile={{ role: 'trainer' }} fetchProfile={vi.fn()} />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Akceptuj' }))

    await vi.waitFor(() =>
      expect(callsOf('gym_trainers', 'update')[0].args[0]).toEqual({ status: 'active' }),
    )
  })

  it('trener odrzuca zaproszenie i zmienia status na rejected', async () => {
    setResult('gym_trainers', {
      data: [{ id: 'r1', status: 'pending', gym: { id: 'g1', name: 'Iron', address: 'W' } }],
    })
    render(
      <MyGym session={session} profile={{ role: 'trainer' }} fetchProfile={vi.fn()} />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Odrzuć' }))

    await vi.waitFor(() =>
      expect(callsOf('gym_trainers', 'update')[0].args[0]).toEqual({ status: 'rejected' }),
    )
  })
})
