import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimary, btnDisabled, inputBase } from '../ui'
import { useMyGym } from '../useMyGym'
import { toKey, todayStr } from '../health'
import Banner from './Banner'

export default function GymDashboard({ session }: { session: any }) {
  const { gym, loading, refetch } = useMyGym(session)
  const [form, setForm] = useState({ name: '', description: '', address: '', is_public: true })
  const [stats, setStats] = useState({ trainers: 0, members: 0, today: 0, week: 0 })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string }>({ type: 'success', text: '' })

  useEffect(() => {
    if (!gym) return
    setForm({ name: gym.name, description: gym.description || '', address: gym.address || '', is_public: gym.is_public })

    const loadStats = async () => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 6)
      const [t, m, td, wk] = await Promise.all([
        supabase.from('gym_trainers').select('id', { count: 'exact', head: true }).eq('gym_id', gym.id).eq('status', 'active'),
        supabase.from('gym_members').select('id', { count: 'exact', head: true }).eq('gym_id', gym.id).eq('status', 'active'),
        supabase.from('gym_checkins').select('id', { count: 'exact', head: true }).eq('gym_id', gym.id).eq('checkin_date', todayStr()),
        supabase.from('gym_checkins').select('id', { count: 'exact', head: true }).eq('gym_id', gym.id).gte('checkin_date', toKey(weekAgo)),
      ])
      setStats({ trainers: t.count || 0, members: m.count || 0, today: td.count || 0, week: wk.count || 0 })
    }
    loadStats()
  }, [gym])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg({ type: 'success', text: '' })
    if (!form.name.trim()) return setMsg({ type: 'error', text: 'Podaj nazwę siłowni.' })
    setSaving(true)
    const payload = { name: form.name.trim(), description: form.description, address: form.address, is_public: form.is_public }
    const { error } = gym
      ? await supabase.from('gyms').update(payload).eq('id', gym.id)
      : await supabase.from('gyms').insert({ ...payload, owner_id: session.user.id })
    if (error) setMsg({ type: 'error', text: 'Nie udało się zapisać: ' + error.message })
    else setMsg({ type: 'success', text: 'Zapisano profil siłowni.' })
    await refetch()
    setSaving(false)
  }

  if (loading) return <p className="text-zinc-400 font-bold animate-pulse">Ładowanie...</p>

  const tiles = [
    { icon: '🎓', label: 'Trenerzy', value: stats.trainers },
    { icon: '👥', label: 'Członkowie', value: stats.members },
    { icon: '📍', label: 'Wejścia dziś', value: stats.today },
    { icon: '📅', label: 'Wejścia (7 dni)', value: stats.week },
  ]

  return (
    <div className="max-w-4xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Panel Siłowni</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">{gym ? gym.name : 'Utwórz profil siłowni'}</h1>
      </div>

      {gym && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map(t => (
            <div key={t.label} className={`${glassCard} flex flex-col gap-1`}>
              <span className="text-sm font-bold text-zinc-400">{t.icon} {t.label}</span>
              <span className="text-4xl font-extrabold text-emerald-400">{t.value}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={save} className={`${glassCard} p-8 flex flex-col gap-6`}>
        <Banner type={msg.type} message={msg.text} />
        <div className="flex flex-col gap-2">
          <label className="font-bold text-white">Nazwa siłowni</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputBase} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold text-white">Adres</label>
          <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputBase} placeholder="ul. Przykładowa 1, Warszawa" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold text-white">Opis</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputBase} h-28 resize-none`} />
        </div>
        <label className="flex items-center gap-4 cursor-pointer">
          <input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} className="h-6 w-6 accent-emerald-500" />
          <span className="text-zinc-400">Widoczna publicznie (ćwiczący mogą się do niej zapisać)</span>
        </label>
        <button type="submit" disabled={saving} className={`${btnPrimary} ${btnDisabled}`}>
          {saving ? 'Zapisywanie...' : gym ? 'Zapisz zmiany' : 'Utwórz siłownię'}
        </button>
      </form>
    </div>
  )
}
