import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm, inputBase } from '../ui'
import { todayStr } from '../health'

export default function CalorieCounter({ session, target, onChange }: { session: any; target: number | null; onChange?: () => void }) {
  const [entries, setEntries] = useState<any[]>([])
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('calorie_entries')
      .select('id, name, calories')
      .eq('user_id', session.user.id)
      .eq('entry_date', todayStr())
      .order('created_at', { ascending: true })
    if (data) setEntries(data)
  }

  useEffect(() => { fetchEntries() }, [session])

  const total = entries.reduce((s, e) => s + e.calories, 0)
  const pct = target ? Math.min(100, Math.round((total / target) * 100)) : 0
  const over = target ? total > target : false

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const cal = parseInt(kcal)
    if (!cal || cal <= 0) return
    await supabase.from('calorie_entries').insert({
      user_id: session.user.id,
      name: name.trim() || 'Posiłek',
      calories: cal,
      entry_date: todayStr(),
    })
    setName('')
    setKcal('')
    await fetchEntries()
    onChange?.()
  }

  const remove = async (id: string) => {
    await supabase.from('calorie_entries').delete().eq('id', id)
    await fetchEntries()
    onChange?.()
  }

  return (
    <div className={`${glassCard} flex flex-col gap-5`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">🔥 Kalorie</h3>
        {target && <span className={`text-sm font-bold ${over ? 'text-red-400' : 'text-emerald-400'}`}>{pct}%</span>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="h-4 w-full overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm font-bold text-zinc-400">
          <span className="text-white">{total} kcal</span>{target ? ` / ${target} kcal` : ' (uzupełnij profil, aby zobaczyć cel)'}
        </p>
      </div>

      <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Posiłek (opcjonalnie)" className={inputBase} />
        <input type="number" min="1" value={kcal} onChange={e => setKcal(e.target.value)} placeholder="kcal" className={`${inputBase} sm:!w-28`} required />
        <button type="submit" className={btnPrimarySm}>Dodaj</button>
      </form>

      <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
        {entries.map(en => (
          <div key={en.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-2">
            <span className="text-white">{en.name}</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-emerald-400">{en.calories} kcal</span>
              <button onClick={() => remove(en.id)} className="text-zinc-400 transition-colors hover:text-red-400">✕</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-center text-sm text-zinc-400">Nic jeszcze nie dodano.</p>}
      </div>
    </div>
  )
}
