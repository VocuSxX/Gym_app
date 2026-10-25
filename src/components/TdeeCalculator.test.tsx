import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TdeeCalculator from './TdeeCalculator'
import { resetMock, callsOf } from '../test/supabaseMock'

vi.mock('../supabaseClient', async () => {
  const { supabaseMock } = await import('../test/supabaseMock')
  return { supabase: supabaseMock }
})

const session = { user: { id: 'u1' } }

const profile = {
  gender: 'male',
  weight_kg: 80,
  height_cm: 180,
  birth_date: '1996-06-01',
  activity_level: 'moderate',
  goal: 'maintain',
}

// Kolejność selectów w komponencie: [0] = Cel, [1] = Aktywność
const goalSelect = () => screen.getAllByRole('combobox')[0]

describe('TdeeCalculator', () => {
  beforeEach(() => {
    resetMock()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-25T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('liczy BMR, TDEE i cel dla mężczyzny', () => {
    render(
      <TdeeCalculator session={session} profile={profile} fetchProfile={vi.fn()} />,
    )

    expect(screen.getByText('1780')).toBeInTheDocument()
    expect(screen.getAllByText('2759')).toHaveLength(2)
  })

  it('zmiana celu przelicza wynik docelowy', () => {
    render(
      <TdeeCalculator session={session} profile={profile} fetchProfile={vi.fn()} />,
    )

    fireEvent.change(goalSelect(), { target: { value: 'lose' } })
    expect(screen.getByText('2259')).toBeInTheDocument()

    fireEvent.change(goalSelect(), { target: { value: 'gain' } })
    expect(screen.getByText('3059')).toBeInTheDocument()
  })

  it('zapis parametrów aktualizuje profil i odświeża dane', async () => {
    const fetchProfile = vi.fn().mockResolvedValue(undefined)
    const onChange = vi.fn()
    render(
      <TdeeCalculator
        session={session}
        profile={profile}
        fetchProfile={fetchProfile}
        onChange={onChange}
      />,
    )

    fireEvent.change(goalSelect(), { target: { value: 'lose' } })
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz parametry' }))

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(callsOf('profiles', 'update')[0].args[0]).toEqual({
      weight_kg: 80,
      activity_level: 'moderate',
      goal: 'lose',
    })
    expect(fetchProfile).toHaveBeenCalledTimes(1)
  })

  it('BMR dla kobiety liczy się inaczej', () => {
    render(
      <TdeeCalculator
        session={session}
        profile={{ ...profile, gender: 'female' }}
        fetchProfile={vi.fn()}
      />,
    )

    expect(screen.getByText('1614')).toBeInTheDocument()
  })
})
