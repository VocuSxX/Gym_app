import { describe, it, expect } from 'vitest'
import { weeklyProgress } from './achievements'

// 2026-10-26 to poniedziałek, 2026-10-25 niedziela
describe('weeklyProgress', () => {
  it('liczy dni treningowe w bieżącym tygodniu (poniedziałek-niedziela)', () => {
    const r = weeklyProgress(['2026-10-26', '2026-10-27', '2026-10-27'], 3, '2026-10-28')
    expect(r.thisWeek).toBe(2)
    expect(r.current).toBe(0)
  })

  it('niedziela należy do poprzedniego tygodnia', () => {
    const r = weeklyProgress(['2026-10-25'], 1, '2026-10-26')
    expect(r.thisWeek).toBe(0)
    expect(r.current).toBe(1)
  })

  it('kolejne tygodnie z celem tworzą passę, a trwający tydzień jej nie przerywa', () => {
    const days = ['2026-10-05', '2026-10-07', '2026-10-12', '2026-10-14', '2026-10-19', '2026-10-21']
    const r = weeklyProgress(days, 2, '2026-10-27')
    expect(r.current).toBe(3)
    expect(r.best).toBe(3)
  })

  it('wykonany cel w bieżącym tygodniu zwiększa passę', () => {
    const days = ['2026-10-19', '2026-10-21', '2026-10-26', '2026-10-27']
    expect(weeklyProgress(days, 2, '2026-10-28').current).toBe(2)
  })

  it('przerwa w tygodniach zeruje bieżącą passę, ale zostaje najlepsza', () => {
    const days = ['2026-09-28', '2026-09-30', '2026-10-05', '2026-10-07']
    const r = weeklyProgress(days, 2, '2026-10-27')
    expect(r.current).toBe(0)
    expect(r.best).toBe(2)
  })
})
