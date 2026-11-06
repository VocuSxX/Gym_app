import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimary } from '../ui'
import Icon from './Icon'

type Next = { name: string; exercises: number } | null

// "Dziś": następny trening z aktywnego planu albo informacja, że trening jest zrobiony
export default function TodayCard({ session, setsToday, setActiveTab }: { session: any; setsToday: number; setActiveTab: (tab: string) => void }) {
  const [state, setState] = useState<'loading' | 'noplan' | 'ready'>('loading')
  const [next, setNext] = useState<Next>(null)

  useEffect(() => {
    const load = async () => {
      const { data: plan } = await supabase
        .from('workout_plans')
        .select('id, workouts(id, name, order_index, workout_exercises(id))')
        .eq('client_id', session.user.id)
        .eq('status', 'active')
        .order('order_index', { referencedTable: 'workouts' })
        .limit(1)
        .maybeSingle()
      const workouts: any[] = plan?.workouts || []
      if (!workouts.length) return setState('noplan')

      const { data: last } = await supabase
        .from('exercise_logs')
        .select('workout_exercise_id')
        .eq('client_id', session.user.id)
        .eq('is_completed', true)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const lastIdx = last ? workouts.findIndex(w => (w.workout_exercises || []).some((e: any) => e.id === last.workout_exercise_id)) : -1
      const w = workouts[(lastIdx + 1) % workouts.length]
      setNext({ name: w.name, exercises: (w.workout_exercises || []).length })
      setState('ready')
    }
    load()
  }, [session])

  if (state === 'loading') return <div className={`${glassCard} h-28 animate-pulse`} />

  if (setsToday > 0) {
    return (
      <div className={`${glassCard} flex items-center gap-4`}>
        <Icon name="check" size={28} className="text-green-400" />
        <div>
          <p className="text-lg font-bold text-white">Trening zrobiony</p>
          <p className="text-sm text-zinc-400">Serie dziś: {setsToday}</p>
        </div>
      </div>
    )
  }

  if (state === 'noplan' || !next) {
    return (
      <div className={`${glassCard} flex flex-wrap items-center justify-between gap-4`}>
        <p className="text-lg font-bold text-white">Brak aktywnego planu</p>
        <button onClick={() => setActiveTab('training:plans')} className={btnPrimary}>Stwórz plan</button>
      </div>
    )
  }

  return (
    <div className={`${glassCard} flex flex-wrap items-center justify-between gap-4`}>
      <div>
        <p className="text-sm text-zinc-400">Dziś</p>
        <p className="text-2xl font-extrabold text-white">{next.name}</p>
        <p className="text-sm text-zinc-400">Ćwiczeń: {next.exercises}</p>
      </div>
      <button onClick={() => setActiveTab('training')} className={btnPrimary}>Zacznij</button>
    </div>
  )
}
