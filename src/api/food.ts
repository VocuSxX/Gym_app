// Warstwa danych "Lodówki". Bez Reacta: ten sam kod posłuży w aplikacji mobilnej.
import { supabase } from '../supabaseClient'
import type { Food, OffFood, MealKey, Macros } from '../nutrition'

export type FoodEntry = Macros & {
  id: string
  meal_type: MealKey
  name: string
  grams: number | null
}

export type EntryInput = Macros & {
  entry_date: string
  meal_type: MealKey
  name: string
  grams: number | null
  food_id?: string | null
}

export type RecipeRow = {
  id: string
  name: string
  servings: number
  recipe_items: { grams: number; food: Food | null }[]
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, m => '\\' + m)

// ---------- Dziennik ----------
export async function listEntries(userId: string, date: string): Promise<FoodEntry[]> {
  const { data } = await supabase
    .from('food_entries')
    .select('id, meal_type, name, grams, kcal, protein, carbs, fat')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .order('created_at', { ascending: true })
  return (data || []) as FoodEntry[]
}

export async function addEntry(userId: string, e: EntryInput): Promise<boolean> {
  const { error } = await supabase.from('food_entries').insert({ user_id: userId, ...e })
  return !error
}

export async function deleteEntry(id: string): Promise<boolean> {
  const { error } = await supabase.from('food_entries').delete().eq('id', id)
  return !error
}

// ---------- Produkty ----------
// RLS zwraca tylko własne, publiczne i zbuforowane z Open Food Facts
export async function searchLocalFoods(q: string): Promise<Food[]> {
  const { data } = await supabase
    .from('foods')
    .select('*')
    .ilike('name', `%${escapeLike(q)}%`)
    .limit(15)
  return (data || []) as Food[]
}

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

// Wyszukiwanie w Open Food Facts. Rzuca błąd, gdy serwis jest niedostępny.
export async function searchOff(q: string): Promise<OffFood[]> {
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=15&cc=pl&lc=pl' +
    '&fields=code,product_name,brands,nutriments,serving_quantity' +
    `&search_terms=${encodeURIComponent(q)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error('off_unavailable')
  const json = await res.json()
  const out: OffFood[] = []
  for (const p of json.products || []) {
    const n = p.nutriments || {}
    const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : null)
    if (!p.code || !p.product_name || kcal == null) continue
    out.push({
      off_code: String(p.code),
      name: String(p.product_name).trim(),
      brand: String(p.brands || '').split(',')[0].trim(),
      kcal_100: Math.round(num(kcal)),
      protein_100: num(n['proteins_100g']),
      carbs_100: num(n['carbohydrates_100g']),
      fat_100: num(n['fat_100g']),
      serving_g: Number(p.serving_quantity) > 0 ? Number(p.serving_quantity) : 100,
    })
  }
  return out
}

// Zapisuje produkt z OFF w bazie (bufor wspólny dla wszystkich), żeby wpis mógł mieć food_id
export async function ensureFood(userId: string, f: OffFood): Promise<Food | null> {
  const find = async () => (await supabase.from('foods').select('*').eq('off_code', f.off_code).maybeSingle()).data as Food | null
  const found = await find()
  if (found) return found
  const { data, error } = await supabase
    .from('foods')
    .insert({ ...f, barcode: f.off_code, source: 'off', created_by: userId })
    .select()
    .single()
  if (error) return await find() // ktoś zapisał go chwilę wcześniej
  return data as Food
}

export type NewFood = {
  name: string
  brand: string
  kcal_100: number
  protein_100: number
  carbs_100: number
  fat_100: number
  serving_g: number
}

export async function createFood(userId: string, input: NewFood): Promise<Food | null> {
  const { data, error } = await supabase
    .from('foods')
    .insert({ ...input, source: 'custom', created_by: userId })
    .select()
    .single()
  return error ? null : (data as Food)
}

// ---------- Dania ----------
export async function listRecipes(userId: string): Promise<RecipeRow[]> {
  const { data } = await supabase
    .from('recipes')
    .select('id, name, servings, recipe_items(grams, food:foods(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data || []) as unknown as RecipeRow[]
}

export async function createRecipe(
  userId: string,
  name: string,
  servings: number,
  items: { food_id: string; grams: number }[],
): Promise<boolean> {
  const { data, error } = await supabase.from('recipes').insert({ user_id: userId, name, servings }).select().single()
  if (error || !data) return false
  const { error: itemsError } = await supabase
    .from('recipe_items')
    .insert(items.map(i => ({ recipe_id: data.id, food_id: i.food_id, grams: i.grams })))
  if (itemsError) {
    await supabase.from('recipes').delete().eq('id', data.id)
    return false
  }
  return true
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  return !error
}
