import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard } from '../ui'
import { todayStr, calcTarget, waterGoalMl } from '../health'
import ActivityCalendar from './ActivityCalendar'
import GymFeed from './GymFeed'
import WeeklyCheckinCard from './WeeklyCheckinCard'
import TodayCard from './TodayCard'
import Ring from './Ring'
import Icon from './Icon'

export default function HomeDashboard({ session, profile, setActiveTab }: { session: any; profile: any; fetchProfile: () => Promise<void>; setActiveTab: (tab: string) => void }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [kcalToday, setKcalToday] = useState(0)
  const [waterToday, setWaterToday] = useState(0)
  const [setsToday, setSetsToday] = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)
  const target = calcTarget(profile)
  const waterGoal = waterGoalMl(profile)
  const isUser = profile.role === 'user'

  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const [kcal, water, sets] = await Promise.all([
        supabase.from('food_entries').select('kcal').eq('user_id', session.user.id).eq('entry_date', todayStr()),
        supabase.from('water_entries').select('amount_ml').eq('user_id', session.user.id).eq('entry_date', todayStr()),
        supabase.from('exercise_logs').select('id', { count: 'exact', head: true }).eq('client_id', session.user.id).eq('is_completed', true).gte('logged_at', startOfDay),
      ])
      setKcalToday(Math.round((kcal.data || []).reduce((s: number, e: any) => s + Number(e.kcal), 0)))
      setWaterToday((water.data || []).reduce((s: number, e: any) => s + e.amount_ml, 0))
      setSetsToday(sets.count || 0)
    }
    load()
  }, [session, refreshKey])

  // Serie nie mają celu, więc pierścień pokazuje postęp względem przykładowych 20 serii dziennie
  const rings = [
    { icon: 'flame', label: 'Kalorie', value: kcalToday, goal: target || 0, unit: 'kcal', tab: 'fridge' },
    { icon: 'droplet', label: 'Woda', value: waterToday, goal: waterGoal, unit: 'ml', tab: 'fridge' },
    { icon: 'dumbbell', label: 'Serie', value: setsToday, goal: 20, unit: '', tab: 'training' },
  ]

  return (
    <div className="max-w-5xl w-full flex flex-col gap-6 animate-fade-in">
      <GymFeed />

      {isUser && <TodayCard session={session} setsToday={setsToday} setActiveTab={setActiveTab} />}

      {isUser && (
        <div className="stagger grid grid-cols-3 gap-3">
          {rings.map(r => (
            <button
              key={r.label}
              onClick={() => setActiveTab(r.tab)}
              className={`${glassCard} flex flex-col items-center gap-3 p-4 text-center transition-[background-color,border-color,transform] duration-150 hover:border-accent-400/60 active:scale-[.97]`}
            >
              <div className="relative">
                <Ring value={r.value} goal={r.goal} />
                <Icon name={r.icon} size={20} className="absolute inset-0 m-auto text-zinc-300" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-white">{r.value}</p>
                <p className="text-xs text-zinc-400">{r.goal ? `z ${r.goal} ${r.unit}` : r.unit || r.label}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <ActivityCalendar session={session} profile={profile} onChange={refresh} />
      {profile.role !== 'gym' && <WeeklyCheckinCard session={session} />}
    </div>
  )
}
