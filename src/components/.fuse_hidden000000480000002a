import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm, inputBase } from '../ui'
import { ACTIVITY, GOALS, calcBmr, calcTdee, calcTarget } from '../health'

export default function TdeeCalculator({ session, profile, fetchProfile, onChange }: { session: any; profile: any; fetchProfile: () => Promise<void>; onChange?: () => void }) {
  const [weight, setWeight] = useState(profile.weight_kg ? String(profile.weight_kg) : '')
  const [activity, setActivity] = useState(profile.activity_level || 'moderate')
  const [goal, setGoal] = useState(profile.goal || 'maintain')
  const [saving, setSaving] = useState(false)

  // Podgląd na żywo na podstawie wpisanych wartości
  const preview = { ...profile, weight_kg: parseFloat(weight) || profile.weight_kg, activity_level: activity, goal }
  const bmr = calcBmr(preview)
  const tdee = calcTdee(preview)
  const target = calcTarget(preview)

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      weight_kg: parseFloat(weight) || profile.weight_kg,
      activity_level: activity,
      goal,
    }).eq('id', session.user.id)
    await fetchProfile()
    onChange?.()
    setSaving(false)
  }

  return (
    <div className={`${glassCard} flex flex-col gap-5`}>
      <h3 className="text-xl font-bold text-white">🧮 Zapotrzebowanie (TDEE)</h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-black/30 p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">BMR</span>
          <span className="text-xl font-extrabold text-white">{bmr ?? '-'}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-black/30 p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">TDEE</span>
          <span className="text-xl font-extrabold text-white">{tdee ?? '-'}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Cel</span>
          <span className="text-xl font-extrabold text-emerald-400">{target ?? '-'}</span>
        </div>
      </div>
      <p className="-mt-2 text-xs text-zinc-400">kcal / dzień · wzór Mifflin-St Jeor</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-zinc-400">Waga (kg)</label>
          <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className={inputBase} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-zinc-400">Cel</label>
          <select value={goal} onChange={e => setGoal(e.target.value)} className={inputBase}>
            {Object.entries(GOALS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wide text-zinc-400">Aktywność</label>
          <select value={activity} onChange={e => setActivity(e.target.value)} className={inputBase}>
            {Object.entries(ACTIVITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <button onClick={save} disabled={saving} className={`${btnPrimarySm} disabled:opacity-50 disabled:pointer-events-none`}>
        {saving ? 'Zapisywanie...' : 'Zapisz parametry'}
      </button>
    </div>
  )
}
