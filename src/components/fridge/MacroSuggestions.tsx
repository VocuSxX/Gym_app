import { useState, useEffect } from 'react'
import { glassCard, btnGhost } from '../../ui'
import { toast } from '../../notify'
import { supabase } from '../../supabaseClient'
import { addEntry, listRecipes } from '../../api/food'
import { macrosFor, sumMacros, type Macros, type MealKey } from '../../nutrition'
import { todayStr } from '../../health'
import Icon from '../Icon'

type Candidate = { key: string; name: string; macros: Macros }

const guessMeal = (): MealKey => {
  const h = new Date().getHours()
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack'
}

// Podpowiedź "co zjeść, żeby domknąć makro": własne dania i produkty mieszczące się w pozostałych kaloriach
export default function MacroSuggestions({ userId, remaining, onAdded }: { userId: string; remaining: Macros; onAdded: () => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([])

  useEffect(() => {
    const load = async () => {
      const [recipes, { data: foods }] = await Promise.all([
        listRecipes(userId),
        supabase.from('foods').select('*').eq('created_by', userId).eq('source', 'custom').limit(100),
      ])
      const list: Candidate[] = []
      recipes.forEach(r => {
        const total = sumMacros(r.recipe_items.filter(i => i.food).map(i => macrosFor(i.food!, Number(i.grams))))
        const s = Number(r.servings) || 1
        list.push({ key: `r-${r.id}`, name: r.name, macros: { kcal: Math.round(total.kcal / s), protein: total.protein / s, carbs: total.carbs / s, fat: total.fat / s } })
      })
      ;((foods || []) as any[]).forEach(f => {
        const grams = Number(f.serving_g) > 0 ? Number(f.serving_g) : 100
        list.push({ key: `f-${f.id}`, name: `${f.name} (${grams} g)`, macros: macrosFor(f, grams) })
      })
      setCandidates(list)
    }
    load()
  }, [userId])

  const wantProtein = Math.max(0, remaining.protein)
  const picks = candidates
    .filter(c => c.macros.kcal > 0 && c.macros.kcal <= remaining.kcal + 50)
    .sort((a, b) => Math.min(b.macros.protein, wantProtein) - Math.min(a.macros.protein, wantProtein) || b.macros.kcal - a.macros.kcal)
    .slice(0, 3)

  if (remaining.kcal < 80 || picks.length === 0) return null

  const add = async (c: Candidate) => {
    const r1 = (n: number) => Math.round(n * 10) / 10
    const ok = await addEntry(userId, { entry_date: todayStr(), meal_type: guessMeal(), name: c.name, grams: null, kcal: Math.round(c.macros.kcal), protein: r1(c.macros.protein), carbs: r1(c.macros.carbs), fat: r1(c.macros.fat) } as any)
    if (!ok) return toast.error('Nie udało się dodać wpisu.')
    toast.success(`Dodano: ${c.name}`)
    onAdded()
  }

  return (
    <div className={`${glassCard} flex flex-col gap-4`}>
      <div>
        <h3 className="text-lg font-bold text-white">Co zjeść na resztę dnia?</h3>
        <p className="text-sm text-zinc-400">Zostało {Math.round(remaining.kcal)} kcal i {Math.max(0, Math.round(remaining.protein))} g białka. Z Twoich dań i produktów pasuje:</p>
      </div>
      {picks.map(c => (
        <div key={c.key} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-bold text-white">{c.name}</p>
            <p className="text-xs text-zinc-400">{Math.round(c.macros.kcal)} kcal · B {Math.round(c.macros.protein)} · W {Math.round(c.macros.carbs)} · T {Math.round(c.macros.fat)}</p>
          </div>
          <button type="button" onClick={() => add(c)} className={`${btnGhost} shrink-0 !py-2`}><Icon name="plus" size={16} />Dodaj</button>
        </div>
      ))}
    </div>
  )
}
