import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CalorieCounter from './CalorieCounter'
import { setResult, resetMock, callsOf } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'u1' } }

const entries = [
  { id: '1', name: 'Jajka', calories: 300 },
  { id: '2', name: 'Ryż', calories: 450 },
]

describe('CalorieCounter', () => {
  beforeEach(() => {
    resetMock()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-25T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pokazuje sumę kalorii i procent celu', async () => {
    setResult('calorie_entries', { data: entries })
    render(<CalorieCounter session={session} target={2000} />)

    expect(await screen.findByText('750 kcal')).toBeInTheDocument()
    expect(screen.getByText('38%')).toBeInTheDocument()
  })

  it('przekroczony cel oznacza procent na czerwono', async () => {
    setResult('calorie_entries', { data: entries })
    render(<CalorieCounter session={session} target={500} />)

    expect(await screen.findByText('100%')).toHaveClass('text-red-400')
  })

  it('bez celu pokazuje podpowiedź o uzupełnieniu profilu', async () => {
    setResult('calorie_entries', { data: entries })
    render(<CalorieCounter session={session} target={null} />)

    expect(
      await screen.findByText(/uzupełnij profil, aby zobaczyć cel/),
    ).toBeInTheDocument()
  })

  it('dodanie posiłku wysyła insert z nazwą i kcal', async () => {
    setResult('calorie_entries', { data: [] })
    const onChange = vi.fn()
    render(<CalorieCounter session={session} target={2000} onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText('Posiłek (opcjonalnie)'), {
      target: { value: 'Owsianka' },
    })
    fireEvent.change(screen.getByPlaceholderText('kcal'), { target: { value: '400' } })
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj' }))

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(callsOf('calorie_entries', 'insert')[0].args[0]).toEqual({
      user_id: 'u1',
      name: 'Owsianka',
      calories: 400,
      entry_date: '2026-10-25',
    })
  })

  it('pusta nazwa zapisuje posiłek jako "Posiłek"', async () => {
    setResult('calorie_entries', { data: [] })
    const onChange = vi.fn()
    render(<CalorieCounter session={session} target={2000} onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText('kcal'), { target: { value: '200' } })
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj' }))

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(callsOf('calorie_entries', 'insert')[0].args[0].name).toBe('Posiłek')
  })
})
