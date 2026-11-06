import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { toast } from '../notify'
import { glassCard, btnPrimarySm, btnGhost, inputBase } from '../ui'
import { defaultReminders, type Reminders } from '../useReminders'

// Ustawienia przypomnień. Działają, gdy aplikacja jest otwarta w przeglądarce.
export default function ReminderSettings({ session, profile, fetchProfile }: { session: any; profile: any; fetchProfile: () => Promise<void> }) {
  const [rem, setRem] = useState<Reminders>({ ...defaultReminders, ...(profile?.reminders || {}) })
  const [saving, setSaving] = useState(false)
  const supported = typeof Notification !== 'undefined'
  const [perm, setPerm] = useState<string>(supported ? Notification.permission : 'unsupported')

  const set = <K extends keyof Reminders>(key: K, patch: Partial<Reminders[K]>) =>
    setRem({ ...rem, [key]: { ...rem[key], ...patch } })

  const askPermission = async () => {
    if (!supported) return
    setPerm(await Notification.requestPermission())
  }

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ reminders: rem }).eq('id', session.user.id)
    setSaving(false)
    if (error) return toast.error('Nie udało się zapisać przypomnień.')
    toast.success('Przypomnienia zapisane.')
    fetchProfile()
  }

  const row = (on: boolean, onToggle: (v: boolean) => void, title: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" checked={on} onChange={e => onToggle(e.target.checked)} className="h-5 w-5 accent-accent-500" />
        <span className="font-bold text-white">{title}</span>
      </label>
      {on && children}
    </div>
  )

  return (
    <div className={`${glassCard} flex flex-col gap-5`}>
      <div>
        <h3 className="text-lg font-bold text-white">Przypomnienia</h3>
        <p className="text-sm text-zinc-400">Działają, gdy aplikacja jest otwarta w przeglądarce.</p>
      </div>

      {supported && perm !== 'granted' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-200">{perm === 'denied' ? 'Powiadomienia przeglądarki są zablokowane. Odblokuj je w ustawieniach strony. Do tego czasu zobaczysz przypomnienia w aplikacji.' : 'Włącz powiadomienia przeglądarki, żeby widzieć przypomnienia, gdy karta jest w tle.'}</p>
          {perm !== 'denied' && <button type="button" onClick={askPermission} className={btnGhost}>Włącz powiadomienia</button>}
        </div>
      )}

      {row(rem.workout.on, v => set('workout', { on: v }), 'Trening (jeśli dziś jeszcze nie trenowałeś)',
        <input type="time" value={rem.workout.time} onChange={e => set('workout', { time: e.target.value })} className={`${inputBase} !w-36`} />)}

      {row(rem.water.on, v => set('water', { on: v }), 'Woda (w ciągu dnia, 8:00–21:00)',
        <select value={rem.water.every} onChange={e => set('water', { every: Number(e.target.value) })} className={`${inputBase} !w-48`}>
          {[60, 90, 120, 180].map(m => <option key={m} value={m}>co {m} minut</option>)}
        </select>)}

      {row(rem.meals.on, v => set('meals', { on: v }), 'Dziennik posiłków (gdy wpisano mniej niż 3 posiłki)',
        <input type="time" value={rem.meals.time} onChange={e => set('meals', { time: e.target.value })} className={`${inputBase} !w-36`} />)}

      <button type="button" onClick={save} disabled={saving} className={`${btnPrimarySm} w-fit disabled:opacity-50 disabled:pointer-events-none`}>{saving ? 'Zapisywanie...' : 'Zapisz przypomnienia'}</button>
    </div>
  )
}
