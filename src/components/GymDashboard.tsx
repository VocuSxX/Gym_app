import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimary, btnDisabled } from '../ui'
import { useMyGym } from '../useMyGym'
import { toKey, todayStr } from '../health'
import { emptyGymForm, type GymForm } from '../gymConfig'
import Banner from './Banner'
import GymDetailsFields from './GymDetailsFields'
import { geocodeAddress } from '../geocode'
import Icon from './Icon'

export default function GymDashboard({ session }: { session: any }) {
  const { gym, loading, refetch } = useMyGym(session)
  const [form, setForm] = useState<GymForm>(emptyGymForm)
  const [stats, setStats] = useState({ trainers: 0, members: 0, today: 0, week: 0 })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string }>({ type: 'success', text: '' })

  useEffect(() => {
    if (!gym) return
    setForm({
      name: gym.name || '',
      city: gym.city || '',
      address: gym.address || '',
      phone: gym.phone || '',
      contact_email: gym.contact_email || '',
      website: gym.website || '',
      opening_hours: gym.opening_hours || '',
      description: gym.description || '',
      amenities: gym.amenities || [],
      equipment: gym.equipment || [],
      is_public: gym.is_public ?? true,
    })

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
    if (form.contact_email && !form.contact_email.includes('@')) return setMsg({ type: 'error', text: 'Podaj poprawny e-mail kontaktowy.' })

    setSaving(true)
    const payload: any = { ...form, name: form.name.trim() }
    // Współrzędne do mapy: ustalamy przy nowym adresie albo gdy ich brakuje
    let mapNote = ''
    if (form.address.trim() && (!gym || gym.lat == null || gym.address !== form.address || gym.city !== form.city)) {
      const pos = await geocodeAddress(form.address, form.city)
      if (pos) { payload.lat = pos.lat; payload.lng = pos.lng }
      else mapNote = ' Nie znaleziono adresu na mapie, sprawdź pisownię.'
    }
    const { error } = gym
      ? await supabase.from('gyms').update(payload).eq('id', gym.id)
      : await supabase.from('gyms').insert({ ...payload, owner_id: session.user.id })
    if (error) setMsg({ type: 'error', text: 'Nie udało się zapisać: ' + error.message })
    else setMsg({ type: 'success', text: 'Zapisano profil siłowni.' + mapNote })
    await refetch()
    setSaving(false)
  }

  if (loading) return <p className="text-zinc-400 font-bold animate-pulse">Ładowanie...</p>

  const tiles = [
    { icon: 'graduation', label: 'Trenerzy', value: stats.trainers },
    { icon: 'users', label: 'Członkowie', value: stats.members },
    { icon: 'pin', label: 'Wejścia dziś', value: stats.today },
    { icon: 'calendar', label: 'Wejścia (7 dni)', value: stats.week },
  ]

  return (
    <div className="max-w-4xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-accent-400">Panel Siłowni</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">{gym ? gym.name : 'Utwórz profil siłowni'}</h1>
      </div>

      {gym && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map(t => (
            <div key={t.label} className={`${glassCard} flex flex-col gap-1`}>
              <span className="flex items-center gap-2 text-sm font-bold text-zinc-400"><Icon name={t.icon} size={16} />{t.label}</span>
              <span className="text-4xl font-extrabold text-accent-400">{t.value}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={save} className={`${glassCard} p-8 flex flex-col gap-6`}>
        <Banner type={msg.type} message={msg.text} />
        <GymDetailsFields form={form} setForm={setForm} part="all" />
        <button type="submit" disabled={saving} className={`${btnPrimary} ${btnDisabled}`}>
          {saving ? 'Zapisywanie...' : gym ? 'Zapisz zmiany' : 'Utwórz siłownię'}
        </button>
      </form>
    </div>
  )
}
