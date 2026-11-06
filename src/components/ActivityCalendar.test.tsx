import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ActivityCalendar from './ActivityCalendar'
import { setResult, resetMock } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'u1' } }
const profile = { gym_id: null }

const activeDays = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[title]')).filter(el => !(el.getAttribute('title') || '').endsWith(': 0')).length

describe('ActivityCalendar', () => {
  beforeEach(() => {
    resetMock()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-25T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('liczy aktywne dni z dzisiejszych oraz wczorajszych logów', async () => {
    setResult('exercise_logs', {
      data: [
        { logged_at: '2026-10-25T09:00:00' },
        { logged_at: '2026-10-25T10:00:00' },
        { logged_at: '2026-10-25T11:00:00' },
        { logged_at: '2026-10-24T09:00:00' },
      ],
    })
    setResult('gym_checkins', { data: [] })
    const { container } = render(<ActivityCalendar session={session} profile={profile} />)

    await vi.waitFor(() => expect(activeDays(container)).toBe(2))
  })

  it('liczy dni, gdy dziś nie ma aktywności', async () => {
    setResult('exercise_logs', {
      data: [
        { logged_at: '2026-10-24T09:00:00' },
        { logged_at: '2026-10-23T09:00:00' },
      ],
    })
    setResult('gym_checkins', { data: [] })
    const { container } = render(<ActivityCalendar session={session} profile={profile} />)

    await vi.waitFor(() => expect(activeDays(container)).toBe(2))
  })

  it('bez danych aktywnych dni jest 0', async () => {
    setResult('exercise_logs', { data: [] })
    setResult('gym_checkins', { data: [] })
    const { container } = render(<ActivityCalendar session={session} profile={profile} />)

    await vi.waitFor(() => expect(activeDays(container)).toBe(0))
  })

  it('dzisiejsze zameldowanie blokuje przycisk', async () => {
    setResult('exercise_logs', { data: [] })
    setResult('gym_checkins', { data: [{ checkin_date: '2026-10-25' }] })
    render(<ActivityCalendar session={session} profile={profile} />)

    const button = await screen.findByRole('button', { name: /Jesteś dziś na siłowni/ })
    expect(button).toBeDisabled()
  })

  it('kod 23505 przy meldowaniu pokazuje komunikat o zameldowaniu', async () => {
    setResult('exercise_logs', { data: [] })
    setResult('gym_checkins', { data: [], error: { code: '23505' } })
    render(<ActivityCalendar session={session} profile={profile} />)

    fireEvent.click(await screen.findByRole('button', { name: /Jestem na siłowni/ }))

    expect(await screen.findByText('Już zameldowany dziś.')).toBeInTheDocument()
  })
})
