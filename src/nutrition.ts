// Czyste helpery żywieniowe (bez Reacta i bazy) - współdzielone z przyszłą aplikacją mobilną

export const MEALS = [
  { key: 'breakfast', label: 'Śniadanie', icon: 'sun' },
  { key: 'lunch', label: 'Obiad', icon: 'utensils' },
  { key: 'dinner', label: 'Kolacja', icon: 'moon' },
  { key: 'snack', label: 'Przekąski', icon: 'cup' },
] as const

export type MealKey = (typeof MEALS)[number]['key']

export type Macros = { kcal: number; protein: number; carbs: number; fat: number }

// Wartości odżywcze na 100 g
export type FoodValues = { kcal_100: number; protein_100: number; carbs_100: number; fat_100: number }

export type Food = FoodValues & {
  id: string
  name: string
  brand: string
  serving_g: number
  source: 'custom' | 'off'
}

// Produkt z Open Food Facts, jeszcze nie zapisany w bazie
export type OffFood = FoodValues & {
  off_code: string
  name: string
  brand: string
  serving_g: number
}

const r1 = (n: number) => Math.round(n * 10) / 10

export const macrosFor = (f: FoodValues, grams: number): Macros => ({
  kcal: Math.round((Number(f.kcal_100) * grams) / 100),
  protein: r1((Number(f.protein_100) * grams) / 100),
  carbs: r1((Number(f.carbs_100) * grams) / 100),
  fat: r1((Number(f.fat_100) * grams) / 100),
})

export const sumMacros = (rows: Partial<Macros>[]): Macros => {
  const t = rows.reduce<Macros>(
    (s, r) => ({
      kcal: s.kcal + Number(r.kcal || 0),
      protein: s.protein + Number(r.protein || 0),
      carbs: s.carbs + Number(r.carbs || 0),
      fat: s.fat + Number(r.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
  return { kcal: Math.round(t.kcal), protein: r1(t.protein), carbs: r1(t.carbs), fat: r1(t.fat) }
}

// Cele makroskładników: białko 1,8 g/kg, tłuszcz 25% kcal, reszta to węglowodany
export function macroTargets(kcal: number | null, weightKg: number | null): Macros | null {
  if (!kcal) return null
  const protein = weightKg ? Math.round(1.8 * weightKg) : Math.round((kcal * 0.2) / 4)
  const fat = Math.round((kcal * 0.25) / 9)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  return { kcal, protein, carbs, fat }
}
