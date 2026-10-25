import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm, btnGhost, btnDanger, inputBase } from '../ui'
import { useMyGym } from '../useMyGym'
import Banner from './Banner'

export default function GymTrainers({ session }: { session: any }) {
  const { gym, loading } = useMyGym(session)
  const [rows, setRows] = useState<any[]>([])
  const [nick, setNick] = useState('')
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string }>({ type: 'success', text: '' })

  const fetchRows = async () => {
    if (!gym) return
    const { data } = await supabase
      .from('gym_trainers')
      .select('id, status, trainer:profiles!trainer_id(id, nickname, experience_years)')
      .eq('gym_id', gym.id)
    if (data) setRows(data)
  }

  useEffect(() => { fetchRows() }, [gym])

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg({ type: 'success', text: '' })
    const name = nick.trim().replace(/^@/, '')
    if (!name || !gym) return

    const { data: target } = await supabase.from('profiles').select('id, nickname, role').ilike('nickname', name).maybeSingle()
    if (!target) return setMsg({ type: 'error', text: 'Nie znaleziono użytkownika o takim nicku.' })
    if (target.role !== 'trainer') return setMsg({ type: 'error', text: 'Ten użytkownik nie jest trenerem.' })
    if (rows.some(r => r.trainer?.id === target.id && r.status !== 'rejected')) return setMsg({ type: 'error', text: 'Ten trener jest już na liście.' })

    // Odrzucone wcześniejsze zaproszenie usuwamy, żeby zaprosić ponownie (UNIQUE gym_id + trainer_id)
    await supabase.from('gym_trainers').delete().eq('gym_id', gym.id).eq('trainer_id', target.id)
    const { error } = await supabase.from('gym_trainers').insert({ gym_id: gym.id, trainer_id: target.id })
    if (error) return setMsg({ type: 'error', text: 'Nie udało się wysłać zaproszenia.' })
    setNick('')
    setMsg({ type: 'success', text: `Zaproszenie wysłane do @${target.nickname}.` })
    fetchRows()
  }

  const remove = async (id: string) => {
    if (!window.confirm('Usunąć tego trenera z siłowni?')) return
    await supabase.from('gym_trainers').delete().eq('id', id)
    fetchRows()
  }

  if (loading) return <p className="text-zinc-400 font-bold animate-pulse">Ładowanie...</p>
  if (!gym) return <div className={`${glassCard} max-w-xl text-center text-zinc-400`}>Najpierw utwórz profil siłowni w zakładce „Moja Siłownia".</div>

  const active = rows.filter(r => r.status === 'active')
  const pending = rows.filter(r => r.status === 'pending')

  return (
    <div className="max-w-3xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Trenerzy siłowni</h1>
        <p className="text-zinc-400">Zapraszaj trenerów po nicku i zarządzaj zespołem.</p>
      </div>

      <form onSubmit={invite} className={`${glassCard} flex flex-col gap-4`}>
        <Banner type={msg.type} message={msg.text} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" value={nick} onChange={e => setNick(e.target.value)} placeholder="Nick trenera" className={inputBase} />
          <button type="submit" className={btnPrimarySm}>Zaproś</button>
        </div>
      </form>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Aktywni trenerzy ({active.length})</h2>
        {active.map(r => (
          <div key={r.id} className={`${glassCard} flex items-center justify-between gap-4`}>
            <div className="flex flex-col">
              <p className="text-lg font-bold text-white">@{r.trainer?.nickname}</p>
              {r.trainer?.experience_years ? <span className="text-sm text-zinc-400">{r.trainer.experience_years} lat doświadczenia</span> : null}
            </div>
            <button onClick={() => remove(r.id)} className={btnDanger}>Usuń</button>
          </div>
        ))}
        {active.length === 0 && <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-zinc-400">Brak trenerów.</div>}
      </section>

      {pending.length > 0 && (
        <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400">Wysłane zaproszenia ({pending.length})</h2>
          {pending.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-black/30 p-5">
              <p className="font-bold text-zinc-400">@{r.trainer?.nickname}</p>
              <button onClick={() => remove(r.id)} className={btnGhost}>Anuluj</button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
