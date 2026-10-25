import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WaterTracker from './WaterTracker'
import { setResult, resetMock, callsOf } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'u1' } }

describe('WaterTracker', () => {
  beforeEach(() => {
    resetMock()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-25T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pokazuje sumę wypitej wody i procent celu', async () => {
    setResult('water_entries', {
      data: [{ id: '1', amount_ml: 250 }, { id: '2', amount_ml: 500 }],
    })
    render(<WaterTracker session={session} goalMl={2000} />)

    expect(await screen.findByText('750 ml')).toBeInTheDocument()
    expect(screen.getByText('38%')).toBeInTheDocument()
  })

  it('kliknięcie +500 dodaje wpis i wywołuje onChange', async () => {
    setResult('water_entries', { data: [] })
    const onChange = vi.fn()
    render(<WaterTracker session={session} goalMl={2000} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '+500' }))

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(callsOf('water_entries', 'insert')[0].args[0]).toEqual({
      user_id: 'u1',
      amount_ml: 500,
      entry_date: '2026-10-25',
    })
  })

  it('kliknięcie "Cofnij ostatni" usuwa ostatni wpis', async () => {
    setResult('water_entries', {
      data: [{ id: '1', amount_ml: 250 }, { id: '2', amount_ml: 500 }],
    })
    const onChange = vi.fn()
    render(<WaterTracker session={session} goalMl={2000} onChange={onChange} />)

    await screen.findByText('750 ml')
    fireEvent.click(screen.getByRole('button', { name: /Cofnij ostatni/ }))

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(callsOf('water_entries', 'delete')).toHaveLength(1)
    expect(callsOf('water_entries', 'eq').some(c => c.args[0] === 'id' && c.args[1] === '2')).toBe(true)
  })

  it('przycisk "Cofnij ostatni" jest wyłączony bez wpisów', async () => {
    setResult('water_entries', { data: [] })
    render(<WaterTracker session={session} goalMl={2000} />)

    await vi.waitFor(() => expect(callsOf('water_entries', 'select')).not.toHaveLength(0))
    expect(screen.getByRole('button', { name: /Cofnij ostatni/ })).toBeDisabled()
  })
})
