// Wspólne helpery zdrowotne (kalorie, woda, daty)

export const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const todayStr = () => toKey(new Date())

export const ACTIVITY: Record<string, { label: string; factor: number }> = {
  sedentary: { label: 'Siedzący tryb życia', factor: 1.2 },
  light: { label: 'Lekka (1–2 treningi / tydz.)', factor: 1.375 },
  moderate: { label: 'Umiarkowana (3–4 treningi / tydz.)', factor: 1.55 },
  active: { label: 'Wysoka (5–6 treningów / tydz.)', factor: 1.725 },
  very_active: { label: 'Bardzo wysoka (codziennie / praca fizyczna)', factor: 1.9 },
}

export const GOALS: Record<string, { label: string; offset: number }> = {
  lose: { label: 'Redukcja', offset: -500 },
  maintain: { label: 'Utrzymanie wagi', offset: 0 },
  gain: { label: 'Masa', offset: 300 },
}

export const ageFromBirth = (birth: string) => {
  const [y, m, d] = birth.split('-').map(Number)
  const now = new Date()
  let age = now.getFullYear() - y
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--
  return age
}

// BMR wg Mifflin-St Jeor
export function calcBmr(p: any): number | null {
  if (!p?.weight_kg || !p?.height_cm || !p?.birth_date) return null
  const base = 10 * Number(p.weight_kg) + 6.25 * Number(p.height_cm) - 5 * ageFromBirth(p.birth_date)
  const bmr = p.gender === 'male' ? base + 5 : p.gender === 'female' ? base - 161 : base - 78
  return Math.round(bmr)
}

export function calcTdee(p: any): number | null {
  const bmr = calcBmr(p)
  if (bmr === null) return null
  return Math.round(bmr * (ACTIVITY[p.activity_level]?.factor ?? 1.55))
}

export function calcTarget(p: any): number | null {
  const tdee = calcTdee(p)
  if (tdee === null) return null
  return tdee + (GOALS[p.goal]?.offset ?? 0)
}

// Dzienny cel wody: 35 ml / kg masy ciała (zaokrąglone do 50 ml)
export const waterGoalMl = (p: any) =>
  p?.weight_kg ? Math.round((Number(p.weight_kg) * 35) / 50) * 50 : 2500
