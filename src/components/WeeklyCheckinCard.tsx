import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { toast } from '../notify'
import { glassCard, btnPrimarySm, btnGhost, inputBase } from '../ui'
import { toKey } from '../health'
import Icon from './Icon'

const MOODS = ['1', '2', '3', '4', '5']

// Poniedziałek bieżącego tygodnia (YYYY-MM-DD)
export const weekStartKey = (d: Date = new Date()) => {
  const day = (d.getDay() + 6) % 7
  return toKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - day))
}

// Cotygodniowy check-in dla osób z aktywnym trenerem. Trener widzi go w przeglądzie podopiecznych.
export default function WeeklyCheckinCard({ session }: { session: any }) {
  const week = weekStartKey()
  const [hasTrainer, setHasTrainer] = useState(false)
  const [done, setDone] = useState(false)
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState(0)
  const [sleep, setSleep] = useState('')
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ count }, { data: existing }] = await Promise.all([
        supabase.from('trainer_clients').select('id', { count: 'exact', head: true }).eq('client_id', session.user.id).eq('status', 'active'),
        supabase.from('weekly_checkins').select('mood, sleep_hours, weight_kg, note').eq('client_id', session.user.id).eq('week_start', week).maybeSingle(),
      ])
      setHasTrainer((count || 0) > 0)
      if (existing) {
        setDone(true)
        setMood(existing.mood || 0)
        setSleep(existing.sleep_hours != null ? String(existing.sleep_hours) : '')
        setWeight(existing.weight_kg != null ? String(existing.weight_kg) : '')
        setNote(existing.note || '')
      }
    }
    load()
  }, [session])

  if (!hasTrainer) return null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mood) return toast.error('Zaznacz, jak się czujesz.')
    setSaving(true)
    const { error } = await supabase.from('weekly_checkins').upsert(
      {
        client_id: session.user.id,
        week_start: week,
        mood,
        sleep_hours: sleep ? Number(sleep) : null,
        weight_kg: weight ? Number(weight) : null,
        note: note.trim(),
      },
      { onConflict: 'client_id,week_start' },
    )
    setSaving(false)
    if (error) return toast.error('Nie udało się wysłać check-inu.')
    toast.success('Check-in wysłany do trenera.')
    setDone(true)
    setOpen(false)
  }

  if (!open) {
    return (
      <div className={`${glassCard} flex items-center justify-between gap-4 ${done ? '' : 'border-amber-500/30'}`}>
        <div className="flex items-center gap-4">
          <Icon name={done ? 'check' : 'clipboard'} size={26} className={done ? 'text-accent-400' : 'text-zinc-500'} />
          <div>
            <p className="text-lg font-bold text-white">Check-in tygodnia</p>
            <p className="text-sm text-zinc-400">{done ? 'Wysłany. Możesz go jeszcze poprawić.' : 'Powiedz trenerowi, jak minął tydzień (30 sekund).'}</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={done ? btnGhost : btnPrimarySm}>{done ? 'Edytuj' : 'Wypełnij'}</button>
      </div>
    )
  }

  return (
    <form onSubmit={save} className={`${glassCard} flex flex-col gap-5`}>
      <h3 className="text-xl font-bold text-white">Check-in tygodnia</h3>
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-white">Jak się czujesz? <span className="font-normal text-zinc-500">(1 słabo, 5 świetnie)</span></label>
        <div className="flex gap-2">
          {MOODS.map((m, i) => (
            <button key={m} type="button" onClick={() => setMood(i + 1)} className={`flex-1 rounded-xl border py-3 text-lg font-bold transition-all active:scale-[.97] ${mood === i + 1 ? 'border-accent-500/40 bg-accent-500/15' : 'border-zinc-800 bg-zinc-800 hover:bg-zinc-700'}`}>{m}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" step="any" min={0} max={24} value={sleep} onChange={e => setSleep(e.target.value)} placeholder="Sen (h / noc)" className={inputBase} />
        <input type="number" step="any" min={1} value={weight} onChange={e => setWeight(e.target.value)} placeholder="Waga (kg)" className={inputBase} />
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Co poszło dobrze, co gorzej? (opcjonalnie)" className={`${inputBase} h-20 resize-none`} />
      <div className="flex gap-3">
        <button type="button" onClick={() => setOpen(false)} className={`${btnGhost} flex-1`}>Anuluj</button>
        <button type="submit" disabled={saving} className={`${btnPrimarySm} flex-1 disabled:opacity-50 disabled:pointer-events-none`}>{saving ? 'Wysyłanie...' : 'Wyślij'}</button>
      </div>
    </form>
  )
}
