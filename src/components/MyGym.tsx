import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm, btnGhost, btnDanger } from '../ui'

// "Moja Siłownia": dla ćwiczącego - wybór i zapis do siłowni; dla trenera - zaproszenia od siłowni
export default function MyGym({ session, profile, fetchProfile }: { session: any; profile: any; fetchProfile: () => Promise<void> }) {
  const me = session.user.id
  const isTrainer = profile.role === 'trainer'

  const [memberships, setMemberships] = useState<any[]>([])
  const [gyms, setGyms] = useState<any[]>([])
  const [gymTrainers, setGymTrainers] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])

  const load = async () => {
    let activeIds: string[] = []

    if (isTrainer) {
      const { data } = await supabase
        .from('gym_trainers')
        .select('id, status, gym:gyms(id, name, address)')
        .eq('trainer_id', me)
        .in('status', ['pending', 'active'])
      setMemberships(data || [])
      activeIds = (data || []).filter((r: any) => r.status === 'active').map((r: any) => r.gym?.id)
    } else {
      const [{ data: mem }, { data: g }, { data: gt }] = await Promise.all([
        supabase.from('gym_members').select('id, gym:gyms(id, name, description, address)').eq('user_id', me).eq('status', 'active'),
        supabase.from('gyms').select('*').eq('is_public', true).order('name'),
        supabase.from('gym_trainers').select('gym_id, trainer:profiles!trainer_id(nickname)').eq('status', 'active'),
      ])
      setMemberships(mem || [])
      setGyms(g || [])
      setGymTrainers(gt || [])
      activeIds = (mem || []).map((r: any) => r.gym?.id)
    }

    if (activeIds.length > 0) {
      const { data: ann } = await supabase
        .from('gym_announcements')
        .select('id, title, content, created_at, gym_id')
        .in('gym_id', activeIds)
        .order('created_at', { ascending: false })
        .limit(10)
      setAnnouncements(ann || [])
    } else {
      setAnnouncements([])
    }
  }

  useEffect(() => { load() }, [session, profile.role])

  // --- ĆWICZĄCY ---
  const join = async (gymId: string) => {
    await supabase.from('gym_members').delete().eq('user_id', me) // jedna siłownia naraz
    const { error } = await supabase.from('gym_members').insert({ gym_id: gymId, user_id: me })
    if (!error) await supabase.from('profiles').update({ gym_id: gymId }).eq('id', me)
    await fetchProfile()
    load()
  }

  const leaveMember = async (rowId: string) => {
    if (!window.confirm('Opuścić tę siłownię?')) return
    await supabase.from('gym_members').delete().eq('id', rowId)
    await supabase.from('profiles').update({ gym_id: null }).eq('id', me)
    await fetchProfile()
    load()
  }

  // --- TRENER ---
  const respond = async (rowId: string, status: 'active' | 'rejected') => {
    await supabase.from('gym_trainers').update({ status }).eq('id', rowId)
    load()
  }

  const leaveTrainer = async (rowId: string) => {
    if (!window.confirm('Opuścić tę siłownię jako trener?')) return
    await supabase.from('gym_trainers').delete().eq('id', rowId)
    load()
  }

  const currentGymIds = memberships.map(m => m.gym?.id)

  return (
    <div className="max-w-3xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Moja Siłownia</h1>
        <p className="text-zinc-400">{isTrainer ? 'Zaproszenia i siłownie, w których pracujesz.' : 'Wybierz siłownię, w której ćwiczysz.'}</p>
      </div>

      {/* OGŁOSZENIA */}
      {announcements.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400">📢 Ogłoszenia</h2>
          {announcements.map(a => (
            <div key={a.id} className={`${glassCard} flex flex-col gap-1 border-amber-500/20`}>
              <h3 className="font-bold text-white">{a.title}</h3>
              {a.content && <p className="text-zinc-400">{a.content}</p>}
            </div>
          ))}
        </section>
      )}

      {/* TRENER */}
      {isTrainer && (
        <section className="flex flex-col gap-4">
          {memberships.map(r => (
            <div key={r.id} className={`${glassCard} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${r.status === 'pending' ? 'border-amber-500/20' : ''}`}>
              <div className="flex flex-col">
                <p className="text-xl font-bold text-white">🏢 {r.gym?.name}</p>
                <span className="text-sm text-zinc-400">{r.gym?.address || 'Brak adresu'}</span>
              </div>
              {r.status === 'pending' ? (
                <div className="flex gap-3">
                  <button onClick={() => respond(r.id, 'active')} className={btnPrimarySm}>Akceptuj</button>
                  <button onClick={() => respond(r.id, 'rejected')} className={btnDanger}>Odrzuć</button>
                </div>
              ) : (
                <button onClick={() => leaveTrainer(r.id)} className={btnGhost}>Opuść</button>
              )}
            </div>
          ))}
          {memberships.length === 0 && <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-zinc-400">Brak zaproszeń od siłowni.</div>}
        </section>
      )}

      {/* ĆWICZĄCY */}
      {!isTrainer && (
        <>
          {memberships.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Twoja siłownia</h2>
              {memberships.map(m => (
                <div key={m.id} className={`${glassCard} flex items-center justify-between gap-4 border-emerald-500/20`}>
                  <div className="flex flex-col">
                    <p className="text-xl font-bold text-white">🏢 {m.gym?.name}</p>
                    <span className="text-sm text-zinc-400">{m.gym?.address}</span>
                  </div>
                  <button onClick={() => leaveMember(m.id)} className={btnGhost}>Opuść</button>
                </div>
              ))}
            </section>
          )}

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Dostępne siłownie</h2>
            {gyms.filter(g => !currentGymIds.includes(g.id)).map(g => {
              const trainers = gymTrainers.filter(t => t.gym_id === g.id)
              return (
                <div key={g.id} className={`${glassCard} flex flex-col gap-4`}>
                  <div className="flex flex-col gap-1">
                    <p className="text-xl font-bold text-white">🏢 {g.name}</p>
                    {g.address && <span className="text-sm text-zinc-400">{g.address}</span>}
                    {g.description && <p className="mt-2 text-zinc-400">{g.description}</p>}
                  </div>
                  {trainers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {trainers.map((t, i) => (
                        <span key={i} className="rounded-full bg-violet-500/15 px-3 py-1 text-sm font-bold text-violet-300">🎓 @{t.trainer?.nickname}</span>
                      ))}
                    </div>
                  )}
                  <button onClick={() => join(g.id)} className={`${btnPrimarySm} w-fit`}>Dołącz</button>
                </div>
              )
            })}
            {gyms.length === 0 && <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-zinc-400">Brak publicznych siłowni.</div>}
          </section>
        </>
      )}
    </div>
  )
}
