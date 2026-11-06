import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm } from '../ui'
import { toKey, todayStr } from '../health'

const WEEKS = 26
const LEVELS = ['bg-white/5', 'bg-emerald-500/30', 'bg-emerald-500/55', 'bg-emerald-500/80', 'bg-emerald-400']

const levelFor = (n: number) => (n === 0 ? 0 : n <= 5 ? 1 : n <= 12 ? 2 : n <= 20 ? 3 : 4)

export default function ActivityCalendar({ session, profile, onChange }: { session: any; profile: any; onChange?: () => void }) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [checkedIn, setCheckedIn] = useState(false)
  const [msg, setMsg] = useState('')

  // Poniedziałek tygodnia sprzed (WEEKS - 1) tygodni
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayIdx = (today.getDay() + 6) % 7
  const start = new Date(today)
  start.setDate(today.getDate() - dayIdx - (WEEKS - 1) * 7)

  const fetchData = async () => {
    const [{ data: logs }, { data: checkins }] = await Promise.all([
      supabase.from('exercise_logs').select('logged_at').eq('client_id', session.user.id).eq('is_completed', true).gte('logged_at', start.toISOString()),
      supabase.from('gym_checkins').select('checkin_date').eq('user_id', session.user.id).gte('checkin_date', toKey(start)),
    ])
    const map: Record<string, number> = {}
    logs?.forEach(l => { const k = toKey(new Date(l.logged_at)); map[k] = (map[k] || 0) + 1 })
    checkins?.forEach(c => { map[c.checkin_date] = (map[c.checkin_date] || 0) + 1 })
    setCounts(map)
    setCheckedIn(!!checkins?.some(c => c.checkin_date === todayStr()))
  }

  useEffect(() => { fetchData() }, [session])

  const checkIn = async () => {
    const { error } = await supabase.from('gym_checkins').insert({
      user_id: session.user.id,
      gym_id: profile?.gym_id || null,
      checkin_date: todayStr(),
    })
    setMsg(error ? (error.code === '23505' ? 'Już zameldowany dziś.' : 'Nie udało się zapisać wizyty.') : '')
    await fetchData()
    onChange?.()
  }

  // Seria dni z rzędu (liczymy od dziś, a gdy dziś pusto - od wczoraj)
  let streak = 0
  const cursor = new Date(today)
  if (!counts[toKey(cursor)]) cursor.setDate(cursor.getDate() - 1)
  while (counts[toKey(cursor)]) { streak++; cursor.setDate(cursor.getDate() - 1) }

  const activeDays = Object.values(counts).filter(n => n > 0).length

  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return { key: toKey(d), future: d > today }
  })

  return (
    <div className={`${glassCard} flex flex-col gap-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-white">📅 Kalendarz aktywności</h3>
        <button onClick={checkIn} disabled={checkedIn} className={`${btnPrimarySm} disabled:opacity-50 disabled:pointer-events-none`}>
          {checkedIn ? '✓ Jesteś dziś na siłowni' : '📍 Jestem na siłowni'}
        </button>
      </div>

      {msg && <p className="text-sm font-semibold text-amber-400">{msg}</p>}

      <div className="overflow-x-auto pb-2">
        <div className="grid grid-flow-col grid-rows-7 gap-1 w-max">
          {cells.map(c => (
            <div
              key={c.key}
              title={`${c.key}: ${counts[c.key] || 0}`}
              className={`h-3.5 w-3.5 rounded-[4px] ${c.future ? 'opacity-0' : LEVELS[levelFor(counts[c.key] || 0)]}`}
            />
          ))}
        </div>
      </div>

      <p className="text-sm font-bold text-zinc-400">
        Aktywne dni: <span className="text-white">{activeDays}</span> · Seria: <span className="text-emerald-400">{streak} 🔥</span>
      </p>
    </div>
  )
}
