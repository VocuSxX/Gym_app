import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard } from '../ui'
import { todayStr, calcTarget, waterGoalMl } from '../health'
import ActivityCalendar from './ActivityCalendar'
import CalorieCounter from './CalorieCounter'
import WaterTracker from './WaterTracker'
import TdeeCalculator from './TdeeCalculator'
import GymFeed from './GymFeed'

export default function HomeDashboard({ session, profile, fetchProfile, setActiveTab }: { session: any; profile: any; fetchProfile: () => Promise<void>; setActiveTab: (tab: string) => void }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [kcalToday, setKcalToday] = useState(0)
  const [waterToday, setWaterToday] = useState(0)
  const [setsToday, setSetsToday] = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)
  const target = calcTarget(profile)
  const waterGoal = waterGoalMl(profile)

  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const [kcal, water, sets] = await Promise.all([
        supabase.from('calorie_entries').select('calories').eq('user_id', session.user.id).eq('entry_date', todayStr()),
        supabase.from('water_entries').select('amount_ml').eq('user_id', session.user.id).eq('entry_date', todayStr()),
        supabase.from('exercise_logs').select('id', { count: 'exact', head: true }).eq('client_id', session.user.id).eq('is_completed', true).gte('logged_at', startOfDay),
      ])
      setKcalToday((kcal.data || []).reduce((s: number, e: any) => s + e.calories, 0))
      setWaterToday((water.data || []).reduce((s: number, e: any) => s + e.amount_ml, 0))
      setSetsToday(sets.count || 0)
    }
    load()
  }, [session, refreshKey])

  const isTrainer = profile.role === 'trainer'

  const quickActions = isTrainer
    ? [
        { icon: '👥', label: 'Moi podopieczni', tab: 'clients' },
        { icon: '📝', label: 'Kreator planów', tab: 'plan_creator' },
        { icon: '💬', label: 'Wiadomości', tab: 'chat' },
        { icon: '📈', label: 'Moje postępy', tab: 'stats' },
      ]
    : [
        { icon: '🏋️', label: 'Rozpocznij trening', tab: 'journal' },
        { icon: '📈', label: 'Moje postępy', tab: 'stats' },
        { icon: '🔍', label: 'Znajdź trenera', tab: 'search' },
        { icon: '💬', label: 'Wiadomości', tab: 'chat' },
      ]

  const summary = [
    { icon: '🔥', label: 'Kalorie dziś', value: `${kcalToday}`, sub: target ? `/ ${target} kcal` : 'kcal', color: 'text-emerald-400' },
    { icon: '💧', label: 'Woda dziś', value: `${waterToday}`, sub: `/ ${waterGoal} ml`, color: 'text-sky-400' },
    { icon: '💪', label: 'Serie dziś', value: `${setsToday}`, sub: 'wykonanych', color: 'text-violet-400' },
  ]

  return (
    <div className="max-w-5xl w-full flex flex-col gap-8 animate-fade-in">
      <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
        <GymFeed />
        {isTrainer ? 'Panel Trenera' : 'Strefa Ucznia'}
      </p>

      {/* PODSUMOWANIE DNIA */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map(s => (
          <div key={s.label} className={`${glassCard} flex flex-col gap-1`}>
            <span className="text-sm font-bold text-zinc-400">{s.icon} {s.label}</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-extrabold ${s.color}`}>{s.value}</span>
              <span className="text-sm text-zinc-400">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* SZYBKIE AKCJE */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickActions.map(a => (
          <button
            key={a.tab}
            onClick={() => setActiveTab(a.tab)}
            className="flex flex-col items-start gap-2 rounded-3xl border border-white/10 bg-white/5 p-5 text-left font-bold text-white backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 active:scale-95"
          >
            <span className="text-3xl">{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      <ActivityCalendar session={session} profile={profile} onChange={refresh} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CalorieCounter session={session} target={target} onChange={refresh} />
        <WaterTracker session={session} goalMl={waterGoal} onChange={refresh} />
      </div>

      <TdeeCalculator session={session} profile={profile} fetchProfile={fetchProfile} onChange={refresh} />
    </div>
  )
}
