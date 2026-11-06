import { useState, useEffect } from 'react'
import { btnPrimarySm, btnGhost, btnDanger, inputBase } from '../../ui'
import { confirmDialog, toast } from '../../notify'
import { listRecipes, deleteRecipe, type RecipeRow } from '../../api/food'
import { macrosFor, sumMacros, type Macros } from '../../nutrition'
import RecipeBuilder from './RecipeBuilder'
import Icon from '../Icon'

// Makro jednej porcji dania
const perServing = (r: RecipeRow): Macros => {
  const total = sumMacros(r.recipe_items.filter(i => i.food).map(i => macrosFor(i.food!, Number(i.grams))))
  const s = Number(r.servings) || 1
  return {
    kcal: Math.round(total.kcal / s),
    protein: Math.round((total.protein / s) * 10) / 10,
    carbs: Math.round((total.carbs / s) * 10) / 10,
    fat: Math.round((total.fat / s) * 10) / 10,
  }
}

export default function DishesTab({ userId, onAdd }: { userId: string; onAdd: (name: string, m: Macros) => void }) {
  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<RecipeRow | null>(null)
  const [portions, setPortions] = useState('1')

  const load = async () => { setRecipes(await listRecipes(userId)); setLoading(false) }
  useEffect(() => { load() }, [])

  const remove = async (r: RecipeRow) => {
    if (!(await confirmDialog(`Usunąć danie „${r.name}”?`, { confirmLabel: 'Usuń' }))) return
    if (!(await deleteRecipe(r.id))) return toast.error('Nie udało się usunąć dania.')
    toast.success('Danie usunięte.')
    load()
  }

  if (creating) return <RecipeBuilder userId={userId} onCancel={() => setCreating(false)} onSaved={() => { setCreating(false); load() }} />

  if (selected) {
    const m = perServing(selected)
    const p = Number(portions)
    const valid = Number.isFinite(p) && p > 0 && p <= 20
    return (
      <form
        onSubmit={e => {
          e.preventDefault()
          if (valid) onAdd(selected.name, { kcal: Math.round(m.kcal * p), protein: Math.round(m.protein * p * 10) / 10, carbs: Math.round(m.carbs * p * 10) / 10, fat: Math.round(m.fat * p * 10) / 10 })
        }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <h4 className="text-xl font-bold text-white">{selected.name}</h4>
          <p className="text-sm text-zinc-400">Jedna porcja: {m.kcal} kcal · B {m.protein} · W {m.carbs} · T {m.fat}</p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold text-white">Ile porcji?</label>
          <input type="number" min={0.25} step="any" value={portions} onChange={e => setPortions(e.target.value)} className={inputBase} autoFocus />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => setSelected(null)} className={`${btnGhost} flex-1`}>Wstecz</button>
          <button type="submit" disabled={!valid} className={`${btnPrimarySm} flex-1 disabled:opacity-50 disabled:pointer-events-none`}>Dodaj</button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={() => setCreating(true)} className={btnPrimarySm}><Icon name="plus" size={16} />Nowe danie</button>
      {loading && <p className="animate-pulse text-center text-sm font-bold text-zinc-400">Ładowanie...</p>}
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {recipes.map(r => {
          const m = perServing(r)
          return (
            <div key={r.id} className="flex items-center gap-2">
              <button type="button" onClick={() => { setPortions('1'); setSelected(r) }} className="flex flex-1 items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left transition-all duration-200 hover:border-accent-500/30 hover:bg-zinc-800">
                <span className="truncate font-bold text-white">{r.name}</span>
                <span className="shrink-0 font-extrabold text-accent-400">{m.kcal} kcal</span>
              </button>
              <button type="button" onClick={() => remove(r)} className={`${btnDanger} !px-3`} aria-label="Usuń danie"><Icon name="trash" size={16} /></button>
            </div>
          )
        })}
        {!loading && recipes.length === 0 && <p className="py-4 text-center text-sm text-zinc-400">Nie masz jeszcze własnych dań. Złóż pierwsze ze składników.</p>}
      </div>
    </div>
  )
}
