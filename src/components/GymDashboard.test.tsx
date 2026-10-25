import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GymDashboard from './GymDashboard'
import { setResult, resetMock, callsOf } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'u1' } }

describe('GymDashboard', () => {
  beforeEach(() => {
    resetMock()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-25T12:00:00'))
    setResult('gyms', { data: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pusta nazwa siłowni pokazuje błąd walidacji', async () => {
    render(<GymDashboard session={session} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Utwórz siłownię' }))

    expect(await screen.findByText('Podaj nazwę siłowni.')).toBeInTheDocument()
    expect(callsOf('gyms', 'insert')).toHaveLength(0)
  })

  it('utworzenie siłowni wysyła insert z właścicielem i nazwą', async () => {
    render(<GymDashboard session={session} />)

    await screen.findByRole('button', { name: 'Utwórz siłownię' })
    // Pierwsze pole tekstowe w formularzu to nazwa siłowni
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Iron' } })
    fireEvent.click(screen.getByRole('button', { name: 'Utwórz siłownię' }))

    await vi.waitFor(() => expect(callsOf('gyms', 'insert')).toHaveLength(1))
    expect(callsOf('gyms', 'insert')[0].args[0]).toEqual(
      expect.objectContaining({ owner_id: 'u1', name: 'Iron' }),
    )
  })
})
