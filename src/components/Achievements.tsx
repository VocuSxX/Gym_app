import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard } from '../ui'
import Icon from './Icon'
import {
  BADGES, fetchTrainingDays, fetchRecords, fetchOwnedBadges, evaluateBadges, announceBadges, weeklyProgress,
  type RecordRow,
} from '../achievements'

export default function Achievements({ session }: { session: any }) {
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState(3)
  const [weeks, setWeeks] = useState({ thisWeek: 0, current: 0, best: 0 })
  const [records, setRecords] = useState<RecordRow[]>([])
  const [owned, setOwned] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      // Najpierw przyznajemy zaległe odznaki, potem czytamy aktualny stan
      announceBadges(await evaluateBadges(session.user.id))
      const [days, recs, badges, prof] = await Promise.all([
        fetchTrainingDays(),
        fetchRecords(),
        fetchOwnedBadges(session.user.id),
        supabase.from('profiles').select('weekly_goal').eq('id', session.user.id).maybeSingle(),
      ])
      const g = Math.min(7, Math.max(1, Number(prof.data?.weekly_goal) || 3))
      setGoal(g)
      setWeeks(weeklyProgress(days, g))
      setRecords(recs)
      setOwned(badges)
      setLoading(false)
    }
    load()
  }, [session])

  if (loading) return <p className="font-semibold text-zinc-400 animate-pulse">Ładowanie...</p>

  const earned = BADGES.filter(b => owned[b.key]).length
  const stats = [
    { icon: 'calendar', label: 'Ten tydzień', value: `${weeks.thisWeek} / ${goal}` },
    { icon: 'flame', label: 'Tygodnie z celem', value: String(weeks.current) },
    { icon: 'crown', label: 'Najdłuższa passa', value: `${weeks.best} tyg.` },
    { icon: 'award', label: 'Odznaki', value: `${earned} / ${BADGES.length}` },
  ]

  return (
    <div className="flex w-full flex-col gap-8 animate-fade-in">
      <div className="stagger grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className={`${glassCard} flex flex-col gap-1 !p-5`}>
            <span className="flex items-center gap-2 text-sm text-zinc-400"><Icon name={s.icon} size={16} />{s.label}</span>
            <span className="text-2xl font-extrabold text-white">{s.value}</span>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Odznaki</h2>
        <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map(b => {
            const got = owned[b.key]
            return (
              <div key={b.key} className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors duration-200 ${got ? 'border-accent-500/40 bg-zinc-900' : 'border-zinc-800 bg-zinc-950'}`}>
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${got ? 'bg-accent-500/15 text-accent-400' : 'bg-zinc-800 text-zinc-600'}`}><Icon name={b.icon} size={24} /></span>
                <div className="min-w-0">
                  <p className={`font-bold ${got ? 'text-white' : 'text-zinc-400'}`}>{b.title}</p>
                  <p className="text-xs text-zinc-500">{got ? `Zdobyta ${new Date(got).toLocaleDateString('pl-PL')}` : b.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Rekordy ({records.length})</h2>
        {records.length === 0 ? (
          <p className="text-zinc-400">Rekordy pojawią się po pierwszych zapisanych seriach z ciężarem.</p>
        ) : (
          <div className="stagger grid grid-cols-1 gap-2 md:grid-cols-2">
            {records.map(r => (
              <div key={r.exercise_name} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{r.exercise_name}</p>
                  <p className="text-xs text-zinc-500">{new Date(r.best_at).toLocaleDateString('pl-PL')}</p>
                </div>
                <span className="shrink-0 text-xl font-extrabold text-accent-400">{r.best_weight} kg</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
