import { useState } from 'react'
import { btnPrimarySm, inputBase } from '../../ui'
import type { Macros } from '../../nutrition'

// Szybki wpis samych kalorii (bez produktu), makroskładniki opcjonalne
export default function QuickAddForm({ onSubmit }: { onSubmit: (name: string, m: Macros) => void }) {
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const k = Number(kcal)
  const valid = Number.isFinite(k) && k > 0 && k <= 5000

  const num = (label: string, v: string, set: (s: string) => void) => (
    <input key={label} type="number" inputMode="decimal" min={0} step="any" value={v} onChange={e => set(e.target.value)} placeholder={label} className={inputBase} />
  )

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        if (valid) onSubmit(name.trim() || 'Szybki wpis', { kcal: Math.round(k), protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0 })
      }}
      className="flex flex-col gap-4"
    >
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nazwa (opcjonalnie)" className={inputBase} />
      <input type="number" inputMode="numeric" min={1} max={5000} step="any" value={kcal} onChange={e => setKcal(e.target.value)} placeholder="Kalorie (kcal)" className={inputBase} required />
      <div className="grid grid-cols-3 gap-3">
        {num('Białko g', protein, setProtein)}
        {num('Węgle g', carbs, setCarbs)}
        {num('Tłuszcz g', fat, setFat)}
      </div>
      <button type="submit" disabled={!valid} className={`${btnPrimarySm} disabled:opacity-50 disabled:pointer-events-none`}>Dodaj</button>
    </form>
  )
}
