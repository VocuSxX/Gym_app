import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { toast } from '../notify'
import { glassCard } from '../ui'
import { fetchTrainingDays, weeklyProgress } from '../achievements'
import Icon from './Icon'

// Kafelek na stronie głównej: ile treningów w tym tygodniu względem własnego celu
export default function WeeklyGoalCard({ session, profile, fetchProfile }: {
  session: any
  profile: any
  fetchProfile: () => Promise<void>
}) {
  const goal = Math.min(7, Math.max(1, Number(profile?.weekly_goal) || 3))
  const [days, setDays] = useState<string[] | null>(null)

  useEffect(() => {
    fetchTrainingDays().then(setDays)
  }, [session])

  if (!days) return null

  const { thisWeek, current } = weeklyProgress(days, goal)

  const changeGoal = async (next: number) => {
    if (next < 1 || next > 7) return
    const { error } = await supabase.from('profiles').update({ weekly_goal: next }).eq('id', session.user.id)
    if (error) return toast.error('Nie udało się zmienić celu.')
    await fetchProfile()
  }

  return (
    <div className={`${glassCard} flex flex-col gap-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-zinc-400">Treningi w tym tygodniu</p>
          <p className="text-4xl font-extrabold text-white">
            {thisWeek}<span className="text-zinc-500"> / {goal}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-zinc-950 p-1" role="group" aria-label="Cel tygodniowy">
          <button type="button" onClick={() => changeGoal(goal - 1)} disabled={goal <= 1} aria-label="Zmniejsz cel" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-[background-color,color,transform] duration-150 hover:bg-zinc-800 hover:text-white active:scale-[.97] disabled:opacity-30 disabled:pointer-events-none"><Icon name="minus" size={16} /></button>
          <span className="min-w-[3.5rem] text-center text-sm font-semibold text-zinc-300">cel {goal}</span>
          <button type="button" onClick={() => changeGoal(goal + 1)} disabled={goal >= 7} aria-label="Zwiększ cel" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-[background-color,color,transform] duration-150 hover:bg-zinc-800 hover:text-white active:scale-[.97] disabled:opacity-30 disabled:pointer-events-none"><Icon name="plus" size={16} /></button>
        </div>
      </div>

      <div className="flex gap-2" aria-hidden="true">
        {Array.from({ length: goal }).map((_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${i < thisWeek ? 'bg-accent-500' : 'bg-zinc-800'}`} />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {thisWeek >= goal ? 'Cel tygodnia wykonany.' : `Do celu zostało ${goal - thisWeek}.`}
          {current > 0 ? ` Tygodnie z celem z rzędu: ${current}.` : ''}
        </p>
      </div>
    </div>
  )
}
