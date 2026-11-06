import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { confirmDialog, toast } from '../notify'
import { glassCard, btnPrimarySm, btnGhost, inputBase, bannerError } from '../ui'
import { todayStr } from '../health'

// Limity bezpieczeństwa (picie bardzo dużo wody w krótkim czasie bywa groźne)
const MAX_SINGLE_ML = 2000   // jednorazowy wpis (zgodne z ograniczeniem w bazie)
const WARN_RATIO = 1.5       // powyżej 150% celu: pomarańczowe ostrzeżenie
const DANGER_ML = 4000       // od 4 l dziennie: czerwone ostrzeżenie + pytanie przed dodaniem

export default function WaterTracker({ session, goalMl, onChange }: { session: any; goalMl: number; onChange?: () => void }) {
  const [entries, setEntries] = useState<any[]>([])
  const [custom, setCustom] = useState('')
  const [formError, setFormError] = useState('')

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
  const pct = Math.round((total / goalMl) * 100)
  const barPct = Math.min(100, pct)
  const danger = total >= DANGER_ML
  const warn = !danger && total > goalMl * WARN_RATIO

  const barColor = danger ? 'bg-red-500' : warn ? 'bg-amber-500 shadow-amber-500/40' : 'bg-accent-500'
  const pctColor = danger ? 'text-red-400' : warn ? 'text-amber-400' : 'text-accent-400'

  const add = async (ml: number) => {
    if (!Number.isInteger(ml) || ml <= 0) return setFormError('Podaj dodatnią liczbę mililitrów.')
    if (ml > MAX_SINGLE_ML) return setFormError(`Jednorazowo możesz dodać maksymalnie ${MAX_SINGLE_ML} ml.`)
    setFormError('')

    // Pytamy tylko, gdy ten wpis przekroczy próg niebezpiecznej ilości
    if (total < DANGER_ML && total + ml >= DANGER_ML) {
      const ok = await confirmDialog(
        `Po dodaniu wyjdzie ${total + ml} ml wody dziś, czyli ponad ${DANGER_ML} ml. To może być niebezpieczne. Na pewno dodać?`,
        { confirmLabel: 'Dodaj mimo to' },
      )
      if (!ok) return
    }

    const { error } = await supabase.from('water_entries').insert({ user_id: session.user.id, amount_ml: ml, entry_date: todayStr() })
    if (error) return toast.error('Nie udało się dodać wody.')
    setCustom('')
    await fetchEntries()
    onChange?.()
  }

  const addCustom = (e: React.FormEvent) => {
    e.preventDefault()
    add(Number(custom))
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
        <h3 className="text-xl font-bold text-white">Woda</h3>
        <span className={`text-sm font-bold ${pctColor}`}>{pct}%</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${barPct}%` }} />
        </div>
        <p className="text-sm font-bold text-zinc-400">
          <span className="text-white">{total} ml</span> / {goalMl} ml
        </p>
      </div>

      {danger && (
        <div className={bannerError}>
          Wypiłeś już {total} ml. Tyle wody w ciągu doby może być niebezpieczne (zaburzenia sodu we krwi). Zrób przerwę, a przy złym samopoczuciu skontaktuj się z lekarzem.
        </div>
      )}
      {warn && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-300">
          Przekroczyłeś zalecaną ilość o ponad 50%. Nie musisz pić więcej, nadmiar nie przynosi korzyści.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => add(250)} className={btnPrimarySm}>+250</button>
        <button onClick={() => add(500)} className={btnPrimarySm}>+500</button>
        <button onClick={() => add(1000)} className={btnPrimarySm}>+1000</button>
      </div>

      <form noValidate onSubmit={addCustom} className="flex flex-col gap-3">
        <div className="flex gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_SINGLE_ML}
            value={custom}
            onChange={e => { setCustom(e.target.value); setFormError('') }}
            placeholder="Własna ilość (ml)"
            className={inputBase}
          />
          <button type="submit" disabled={!custom} className={`${btnPrimarySm} disabled:opacity-50 disabled:pointer-events-none`}>Dodaj</button>
        </div>
        {formError && <p className="text-sm font-semibold text-red-400">{formError}</p>}
      </form>

      <button onClick={undo} disabled={entries.length === 0} className={`${btnGhost} disabled:opacity-40 disabled:pointer-events-none`}>
        ↩ Cofnij ostatni
      </button>
    </div>
  )
}
