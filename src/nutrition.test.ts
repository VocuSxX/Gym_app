import { describe, it, expect } from 'vitest'
import { macrosFor, sumMacros, macroTargets } from './nutrition'

const chicken = { kcal_100: 165, protein_100: 31, carbs_100: 0, fat_100: 3.6 }

describe('macrosFor', () => {
  it('liczy wartości dla 100 g', () => {
    expect(macrosFor(chicken, 100)).toEqual({ kcal: 165, protein: 31, carbs: 0, fat: 3.6 })
  })

  it('liczy wartości dla 50 g', () => {
    expect(macrosFor(chicken, 50)).toEqual({ kcal: 83, protein: 15.5, carbs: 0, fat: 1.8 })
  })
})

describe('sumMacros', () => {
  it('zwraca zera dla pustej listy', () => {
    expect(sumMacros([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })

  it('sumuje wiersze', () => {
    expect(
      sumMacros([
        { kcal: 100, protein: 10, carbs: 20, fat: 5 },
        { kcal: 200, protein: 5, carbs: 30, fat: 10 },
      ]),
    ).toEqual({ kcal: 300, protein: 15, carbs: 50, fat: 15 })
  })

  it('zaokrągla kcal do liczby całkowitej, a makra do 1 miejsca po przecinku', () => {
    expect(
      sumMacros([
        { kcal: 10.4, protein: 0.11, carbs: 0.22, fat: 0.33 },
        { kcal: 10.4, protein: 0.11, carbs: 0.22, fat: 0.33 },
      ]),
    ).toEqual({ kcal: 21, protein: 0.2, carbs: 0.4, fat: 0.7 })
  })
})

describe('macroTargets', () => {
  it('zwraca null, gdy brak kcal', () => {
    expect(macroTargets(null, 80)).toBeNull()
    expect(macroTargets(0, 80)).toBeNull()
  })

  it('liczy białko 1,8 g na kg masy ciała', () => {
    expect(macroTargets(2500, 80)?.protein).toBe(144)
  })

  it('suma kcal z makr jest zbliżona do celu', () => {
    const t = macroTargets(2500, 80)!
    const fromMacros = t.protein * 4 + t.carbs * 4 + t.fat * 9
    expect(Math.abs(fromMacros - 2500)).toBeLessThanOrEqual(10)
  })
})
