import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  toKey,
  ageFromBirth,
  calcBmr,
  calcTdee,
  calcTarget,
  waterGoalMl,
} from './health'

const profile = {
  weight_kg: 80,
  height_cm: 180,
  birth_date: '1996-06-01',
  activity_level: 'moderate',
  goal: 'maintain',
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-25T12:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('calcBmr (Mifflin-St Jeor)', () => {
  it('liczy BMR dla mężczyzny', () => {
    expect(calcBmr({ ...profile, gender: 'male' })).toBe(1780)
  })

  it('liczy BMR dla kobiety', () => {
    expect(calcBmr({ ...profile, gender: 'female' })).toBe(1614)
  })

  it('liczy BMR dla niepodanej płci', () => {
    expect(calcBmr({ ...profile, gender: 'not_specified' })).toBe(1697)
  })

  it('zwraca null, gdy brakuje wagi, wzrostu lub daty urodzenia', () => {
    expect(calcBmr({ ...profile, gender: 'male', weight_kg: undefined })).toBeNull()
    expect(calcBmr({ ...profile, gender: 'male', height_cm: undefined })).toBeNull()
    expect(calcBmr({ ...profile, gender: 'male', birth_date: undefined })).toBeNull()
  })
})

describe('calcTdee i calcTarget', () => {
  it('calcTdee dla mężczyzny o umiarkowanej aktywności', () => {
    expect(calcTdee({ ...profile, gender: 'male' })).toBe(2759)
  })

  it('calcTarget uwzględnia cel', () => {
    const male = { ...profile, gender: 'male' }
    expect(calcTarget({ ...male, goal: 'lose' })).toBe(2259)
    expect(calcTarget({ ...male, goal: 'gain' })).toBe(3059)
    expect(calcTarget({ ...male, goal: 'maintain' })).toBe(2759)
  })
})

describe('waterGoalMl', () => {
  it('liczy 35 ml na kg masy ciała', () => {
    expect(waterGoalMl({ weight_kg: 80 })).toBe(2800)
    expect(waterGoalMl({ weight_kg: 75 })).toBe(2650)
  })

  it('zwraca domyślne 2500 ml bez wagi', () => {
    expect(waterGoalMl({})).toBe(2500)
  })
})

describe('toKey', () => {
  it('formatuje datę jako YYYY-MM-DD', () => {
    expect(toKey(new Date(2026, 9, 5))).toBe('2026-10-05')
  })
})

describe('ageFromBirth', () => {
  it('zwraca 30 lat dla daty urodzenia 1996-06-01', () => {
    expect(ageFromBirth('1996-06-01')).toBe(30)
  })

  // BŁĄD: w dniu urodzin wynik to 29 zamiast 30 (patrz BUGS.md)
  it.fails('zwraca 30 lat w dniu urodzin 1996-10-25', () => {
    expect(ageFromBirth('1996-10-25')).toBe(30)
  })
})
