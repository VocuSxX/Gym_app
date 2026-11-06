import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard } from '../ui'
import { todayStr } from '../health'

type Row = { client_id: string; nickname: string; last_workout: string | null; days_7: number; sets_7: number; plan_name: string | null }
type Checkin = { client_id: string; week_start: string; mood: number | null; sleep_hours: number | null; weight_kg: number | null; note: string | null }

const MOODS = ['', 'bardzo słabo', 'słabo', 'średnio', 'dobrze', 'świetnie']

const dayDiff = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  const [ty, tm, td] = todayStr().split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000)
}

// Przegląd podopiecznych: kto trenuje, kto znika, ostatni check-in
export default function ClientsOverview({ session }: { session: any }) {
  const [rows, setRows] = useState<Row[]>([])
  const [checkins, setCheckins] = useState<Record<string, Checkin>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data }, { data: ci }] = await Promise.all([
        supabase.rpc('trainer_overview'),
        supabase.from('weekly_checkins').select('client_id, week_start, mood, sleep_hours, weight_kg, note').order('week_start', { ascending: false }).limit(300),
      ])
      setRows((data || []) as Row[])
      const latest: Record<string, Checkin> = {}
      ;((ci || []) as Checkin[]).forEach(c => { if (!latest[c.client_id]) latest[c.client_id] = c })
      setCheckins(latest)
      setLoading(false)
    }
    load()
  }, [session])

  if (loading) return <p className="text-zinc-400 font-bold animate-pulse">Ładowanie przeglądu...</p>

  const sinceLast = (r: Row) => (r.last_workout ? dayDiff(r.last_workout) : null)
  // Najpierw ci, którzy dawno nie trenowali (brak treningu = najwyżej)
  const sorted = [...rows].sort((a, b) => (sinceLast(b) ?? 9999) - (sinceLast(a) ?? 9999))
  const inactive = rows.filter(r => (sinceLast(r) ?? 9999) >= 7).length

  return (
    <div className="max-w-4xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Przegląd podopiecznych</h1>
        <p className="text-zinc-400">
          {rows.length} aktywnych · {inactive > 0 ? <span className="font-bold text-red-400">{inactive} bez treningu od 7+ dni</span> : <span className="font-bold text-accent-400">wszyscy trenują regularnie</span>}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {sorted.map(r => {
          const since = sinceLast(r)
          const alert = since === null || since >= 7
          const ci = checkins[r.client_id]
          return (
            <div key={r.client_id} className={`${glassCard} flex flex-col gap-4 ${alert ? 'border-red-500/30' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-white">@{r.nickname}</p>
                  <p className="text-sm text-zinc-400">{r.plan_name ? `Plan: ${r.plan_name}` : 'Brak aktywnego planu'}</p>
                </div>
                <span className={`rounded-full border px-4 py-1.5 text-sm font-bold ${alert ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-accent-500/30 bg-accent-500/10 text-accent-300'}`}>
                  {since === null ? 'Jeszcze nie trenował' : since === 0 ? 'Trenował dziś' : since === 1 ? 'Trenował wczoraj' : `Brak treningu od ${since} dni`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-center">
                  <p className="text-2xl font-extrabold text-accent-400">{r.days_7}</p>
                  <p className="text-xs font-bold text-zinc-400">dni treningowych (7 dni)</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-center">
                  <p className="text-2xl font-extrabold text-accent-400">{r.sets_7}</p>
                  <p className="text-xs font-bold text-zinc-400">serii (7 dni)</p>
                </div>
              </div>

              {ci ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm">
                  <p className="mb-1 text-xs font-bold text-zinc-400">Ostatni check-in (tydzień od {ci.week_start})</p>
                  <p className="text-white">
                    Nastrój {ci.mood ? MOODS[ci.mood] : '—'}
                    {ci.sleep_hours != null ? ` · sen ${ci.sleep_hours} h` : ''}
                    {ci.weight_kg != null ? ` · waga ${ci.weight_kg} kg` : ''}
                  </p>
                  {ci.note ? <p className="mt-1 text-zinc-400">„{ci.note}”</p> : null}
                </div>
              ) : (
                <p className="text-xs text-zinc-400">Brak check-inu od tego podopiecznego.</p>
              )}
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">Nie masz jeszcze aktywnych podopiecznych.</div>
        )}
      </div>
    </div>
  )
}
