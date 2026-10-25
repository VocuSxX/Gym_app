import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorkoutBuilder from './WorkoutBuilder'
import { setResult, resetMock, callsOf } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'u1' } }

// Przejście z kroku 1 do kroku 3: nazwa planu, dzień, ćwiczenie
const goToSummary = async () => {
  fireEvent.change(screen.getByPlaceholderText('np. Hipertrofia - Blok A'), {
    target: { value: 'Plan A' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Poniedziałek/ }))
  fireEvent.click(screen.getByRole('button', { name: /Dalej/ }))

  fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'e1' } })
  fireEvent.click(screen.getByRole('button', { name: /Podsumowanie/ }))
}

describe('WorkoutBuilder', () => {
  beforeEach(() => {
    resetMock()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-25T12:00:00'))
    window.alert = vi.fn()
    setResult('exercises', {
      data: [{ id: 'e1', name: 'Przysiad', image_url: '' }],
    })
    setResult('workout_plans', { data: { id: 'p1' } })
    setResult('workouts', { data: { id: 'w1' } })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('zwykły użytkownik zapisuje plan dla siebie bez wyboru odbiorcy', async () => {
    render(<WorkoutBuilder session={session} profile={{ role: 'user' }} />)
    await goToSummary()

    expect(screen.queryByText('-- Wybierz odbiorcę --')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Zapisz mój plan/ }))

    await vi.waitFor(() => expect(callsOf('workout_exercises', 'insert')).toHaveLength(1))
    expect(callsOf('workout_plans', 'update')[0].args[0]).toEqual({ status: 'archived' })
    expect(callsOf('workout_plans', 'insert')[0].args[0]).toEqual(
      expect.objectContaining({
        trainer_id: null,
        client_id: 'u1',
        name: 'Plan A',
        is_self_made: true,
      }),
    )
    expect(callsOf('workout_exercises', 'insert')[0].args[0][0]).toEqual(
      expect.objectContaining({
        workout_id: 'w1',
        name: 'Przysiad',
        target_sets: 3,
        target_reps: '10',
        rir: '2',
        order_index: 0,
      }),
    )
  })

  it('trener przypisuje plan do siebie jako "Dla siebie"', async () => {
    setResult('trainer_clients', { data: [{ client: { id: 'c1', nickname: 'kid' } }] })
    render(<WorkoutBuilder session={session} profile={{ role: 'trainer' }} />)
    await goToSummary()

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'self' } })
    fireEvent.click(screen.getByRole('button', { name: /Zatwierdź i Wyślij Plan/ }))

    await vi.waitFor(() => expect(callsOf('workout_plans', 'insert')).toHaveLength(1))
    expect(callsOf('workout_plans', 'insert')[0].args[0]).toEqual(
      expect.objectContaining({ trainer_id: 'u1', client_id: 'u1', is_self_made: true }),
    )
  })

  it('trener przypisuje plan podopiecznemu', async () => {
    setResult('trainer_clients', { data: [{ client: { id: 'c1', nickname: 'kid' } }] })
    render(<WorkoutBuilder session={session} profile={{ role: 'trainer' }} />)
    await goToSummary()

    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'c1' } })
    fireEvent.click(screen.getByRole('button', { name: /Zatwierdź i Wyślij Plan/ }))

    await vi.waitFor(() => expect(callsOf('workout_plans', 'insert')).toHaveLength(1))
    expect(callsOf('workout_plans', 'insert')[0].args[0]).toEqual(
      expect.objectContaining({ trainer_id: 'u1', client_id: 'c1', is_self_made: false }),
    )
  })

  it('trener bez wyboru odbiorcy dostaje alert i plan nie jest zapisany', async () => {
    setResult('trainer_clients', { data: [{ client: { id: 'c1', nickname: 'kid' } }] })
    render(<WorkoutBuilder session={session} profile={{ role: 'trainer' }} />)
    await goToSummary()

    fireEvent.click(screen.getByRole('button', { name: /Zatwierdź i Wyślij Plan/ }))

    expect(window.alert).toHaveBeenCalledWith('Wybierz odbiorcę planu z listy!')
    expect(callsOf('workout_plans', 'insert')).toHaveLength(0)
  })
})
