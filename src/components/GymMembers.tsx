import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnDanger } from '../ui'
import { useMyGym } from '../useMyGym'
import { toKey } from '../health'

export default function GymMembers({ session }: { session: any }) {
  const { gym, loading } = useMyGym(session)
  const [members, setMembers] = useState<any[]>([])
  const [visits, setVisits] = useState<Record<string, number>>({})

  const fetchData = async () => {
    if (!gym) return
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 29)

    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from('gym_members').select('id, created_at, user:profiles!user_id(id, nickname, first_name, last_name)').eq('gym_id', gym.id).eq('status', 'active'),
      supabase.from('gym_checkins').select('user_id').eq('gym_id', gym.id).gte('checkin_date', toKey(monthAgo)),
    ])
    const map: Record<string, number> = {}
    c?.forEach(x => { map[x.user_id] = (map[x.user_id] || 0) + 1 })
    setVisits(map)
    setMembers((m || []).sort((a: any, b: any) => (map[b.user?.id] || 0) - (map[a.user?.id] || 0)))
  }

  useEffect(() => { fetchData() }, [gym])

  const remove = async (id: string) => {
    if (!window.confirm('Usunąć tego członka z siłowni?')) return
    await supabase.from('gym_members').delete().eq('id', id)
    fetchData()
  }

  if (loading) return <p className="text-zinc-400 font-bold animate-pulse">Ładowanie...</p>
  if (!gym) return <div className={`${glassCard} max-w-xl text-center text-zinc-400`}>Najpierw utwórz profil siłowni w zakładce „Moja Siłownia".</div>

  const totalVisits = Object.values(visits).reduce((s, n) => s + n, 0)

  return (
    <div className="max-w-3xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Członkowie</h1>
        <p className="text-zinc-400">{members.length} członków · {totalVisits} wejść w ostatnich 30 dniach</p>
      </div>

      <div className="flex flex-col gap-4">
        {members.map(m => (
          <div key={m.id} className={`${glassCard} flex items-center justify-between gap-4`}>
            <div className="flex flex-col">
              <p className="text-lg font-bold text-white">@{m.user?.nickname}</p>
              <span className="text-sm text-zinc-400">{[m.user?.first_name, m.user?.last_name].filter(Boolean).join(' ')}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-400">{visits[m.user?.id] || 0} wejść / 30 dni</span>
              <button onClick={() => remove(m.id)} className={btnDanger}>Usuń</button>
            </div>
          </div>
        ))}
        {members.length === 0 && <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-zinc-400">Nikt jeszcze nie zapisał się do Twojej siłowni.</div>}
      </div>
    </div>
  )
}
