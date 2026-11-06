import { useState } from 'react'
import { btnPrimarySm, inputBase } from '../../ui'
import { toast } from '../../notify'
import { createFood } from '../../api/food'
import type { Food } from '../../nutrition'

const field = (label: string, value: string, set: (v: string) => void, placeholder = '') => (
  <div className="flex flex-col gap-1" key={label}>
    <label className="text-xs font-bold text-zinc-400">{label}</label>
    <input type="number" inputMode="decimal" min={0} step="any" value={value} onChange={e => set(e.target.value)} placeholder={placeholder} className={inputBase} />
  </div>
)

// Własny produkt (wartości na 100 g)
export default function CustomFoodForm({ userId, onCreated }: { userId: string; onCreated: (food: Food) => void }) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [serving, setServing] = useState('100')
  const [saving, setSaving] = useState(false)

  const valid = name.trim().length > 0 && kcal !== '' && Number(kcal) >= 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    const food = await createFood(userId, {
      name: name.trim(),
      brand: brand.trim(),
      kcal_100: Number(kcal) || 0,
      protein_100: Number(protein) || 0,
      carbs_100: Number(carbs) || 0,
      fat_100: Number(fat) || 0,
      serving_g: Number(serving) > 0 ? Number(serving) : 100,
    })
    setSaving(false)
    if (!food) return toast.error('Nie udało się zapisać produktu.')
    toast.success('Produkt zapisany w Twoich produktach.')
    onCreated(food)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nazwa produktu" className={inputBase} required />
      <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Marka (opcjonalnie)" className={inputBase} />
      <p className="text-xs font-bold text-accent-400">Wartości na 100 g</p>
      <div className="grid grid-cols-2 gap-3">
        {field('Kalorie (kcal)', kcal, setKcal)}
        {field('Białko (g)', protein, setProtein)}
        {field('Węglowodany (g)', carbs, setCarbs)}
        {field('Tłuszcze (g)', fat, setFat)}
      </div>
      {field('Typowa porcja (g)', serving, setServing, '100')}
      <button type="submit" disabled={!valid || saving} className={`${btnPrimarySm} disabled:opacity-50 disabled:pointer-events-none`}>
        {saving ? 'Zapisywanie...' : 'Zapisz i wybierz ilość'}
      </button>
    </form>
  )
}
