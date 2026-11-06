import { useState } from 'react'
import { btnPrimarySm, btnGhost, inputBase } from '../../ui'
import { toast } from '../../notify'
import { createRecipe } from '../../api/food'
import { macrosFor, sumMacros, type Food } from '../../nutrition'
import FoodSearch from './FoodSearch'
import PortionForm from './PortionForm'
import Icon from '../Icon'

type Item = { food: Food; grams: number }

// Kreator własnego dania: nazwa, liczba porcji i składniki
export default function RecipeBuilder({ userId, onSaved, onCancel }: { userId: string; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [servings, setServings] = useState('1')
  const [items, setItems] = useState<Item[]>([])
  const [adding, setAdding] = useState(false)
  const [picked, setPicked] = useState<Food | null>(null)
  const [saving, setSaving] = useState(false)

  const total = sumMacros(items.map(i => macrosFor(i.food, i.grams)))
  const s = Number(servings)
  const validServings = Number.isFinite(s) && s > 0
  const canSave = name.trim().length > 0 && items.length > 0 && validServings

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    const ok = await createRecipe(userId, name.trim(), s, items.map(i => ({ food_id: i.food.id, grams: i.grams })))
    setSaving(false)
    if (!ok) return toast.error('Nie udało się zapisać dania.')
    toast.success('Danie zapisane.')
    onSaved()
  }

  if (adding) {
    return picked ? (
      <PortionForm
        food={picked}
        submitLabel="Dodaj składnik"
        onBack={() => setPicked(null)}
        onSubmit={grams => { setItems([...items, { food: picked, grams }]); setPicked(null); setAdding(false) }}
      />
    ) : (
      <div className="flex flex-col gap-4">
        <FoodSearch userId={userId} onPick={setPicked} />
        <button type="button" onClick={() => setAdding(false)} className={btnGhost}>Wstecz</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nazwa dania, np. Owsianka z bananem" className={inputBase} />
      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-zinc-400">Liczba porcji</label>
        <input type="number" min={1} step="1" value={servings} onChange={e => setServings(e.target.value)} className={`${inputBase} !w-24`} />
      </div>

      <div className="flex flex-col gap-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2">
            <span className="text-white">{it.food.name} <span className="text-sm text-zinc-400">· {it.grams} g</span></span>
            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-zinc-400 transition-colors hover:text-red-400" aria-label="Usuń składnik"><Icon name="x" size={16} /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-sm text-zinc-400">Dodaj pierwszy składnik.</p>}
      </div>

      <button type="button" onClick={() => setAdding(true)} className={btnGhost}><Icon name="plus" size={16} />Dodaj składnik</button>

      {items.length > 0 && validServings && (
        <p className="text-center text-sm text-zinc-400">
          Na porcję: <span className="font-bold text-accent-400">{Math.round(total.kcal / s)} kcal</span> · B {Math.round((total.protein / s) * 10) / 10} · W {Math.round((total.carbs / s) * 10) / 10} · T {Math.round((total.fat / s) * 10) / 10}
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className={`${btnGhost} flex-1`}>Anuluj</button>
        <button type="button" onClick={save} disabled={!canSave || saving} className={`${btnPrimarySm} flex-1 disabled:opacity-50 disabled:pointer-events-none`}>
          {saving ? 'Zapisywanie...' : 'Zapisz danie'}
        </button>
      </div>
    </div>
  )
}
