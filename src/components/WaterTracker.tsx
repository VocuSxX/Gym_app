import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm, btnGhost } from '../ui'
import { todayStr } from '../health'

export default function WaterTracker({ session, goalMl, onChange }: { session: any; goalMl: number; onChange?: () => void }) {
  const [entries, setEntries] = useState<any[]>([])

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('water_entries')
      .select('id, amount_ml')
      .eq('user_id', session.user.id)
      .eq('entry_date', todayStr())
      .order('created_at', { ascending: true })
    if (data) setEntries(data)
  }

  useEffect(() => { fetchEntries() }, [session])

  const total = entries.reduce((s, e) => s + e.amount_ml, 0)
  const pct = Math.min(100, Math.round((total / goalMl) * 100))

  const add = async (ml: number) => {
    await supabase.from('water_entries').insert({ user_id: session.user.id, amount_ml: ml, entry_date: todayStr() })
    await fetchEntries()
    onChange?.()
  }

  const undo = async () => {
    const last = entries[entries.length - 1]
    if (!last) return
    await supabase.from('water_entries').delete().eq('id', last.id)
    await fetchEntries()
    onChange?.()
  }

  return (
    <div className={`${glassCard} flex flex-col gap-5`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">💧 Woda</h3>
        <span className="text-sm font-bold text-sky-400">{pct}%</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="h-4 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-sky-500 shadow-lg shadow-sky-500/40 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm font-bold text-zinc-400">
          <span className="text-white">{total} ml</span> / {goalMl} ml
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => add(250)} className={btnPrimarySm}>+250</button>
        <button onClick={() => add(500)} className={btnPrimarySm}>+500</button>
        <button onClick={() => add(1000)} className={btnPrimarySm}>+1000</button>
      </div>

      <button onClick={undo} disabled={entries.length === 0} className={`${btnGhost} disabled:opacity-40 disabled:pointer-events-none`}>
        ↩ Cofnij ostatni
      </button>
    </div>
  )
}
