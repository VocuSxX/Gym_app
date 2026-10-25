import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm, btnGhost, btnDanger, inputBase } from '../ui'
import Banner from './Banner'

export default function Friends({ session }: { session: any }) {
  const me = session.user.id
  const [rows, setRows] = useState<any[]>([])
  const [nick, setNick] = useState('')
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string }>({ type: 'success', text: '' })

  const fetchAll = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('id, status, requester_id, addressee_id, requester:profiles!requester_id(id, nickname), addressee:profiles!addressee_id(id, nickname)')
    if (data) setRows(data)
  }

  useEffect(() => { fetchAll() }, [])

  const friends = rows.filter(r => r.status === 'accepted')
  const incoming = rows.filter(r => r.status === 'pending' && r.addressee_id === me)
  const outgoing = rows.filter(r => r.status === 'pending' && r.requester_id === me)

  const otherOf = (r: any) => (r.requester_id === me ? r.addressee : r.requester)

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg({ type: 'success', text: '' })
    const name = nick.trim().replace(/^@/, '')
    if (!name) return

    const { data: target } = await supabase.from('profiles').select('id, nickname').ilike('nickname', name).maybeSingle()
    if (!target) return setMsg({ type: 'error', text: 'Nie znaleziono użytkownika o takim nicku.' })
    if (target.id === me) return setMsg({ type: 'error', text: 'Nie możesz zaprosić samego siebie.' })

    const existing = rows.find(r => r.requester_id === target.id || r.addressee_id === target.id)
    if (existing) {
      return setMsg({ type: 'error', text: existing.status === 'accepted' ? 'Jesteście już znajomymi.' : 'Zaproszenie już istnieje.' })
    }

    const { error } = await supabase.from('friendships').insert({ requester_id: me, addressee_id: target.id })
    if (error) return setMsg({ type: 'error', text: 'Nie udało się wysłać zaproszenia.' })
    setNick('')
    setMsg({ type: 'success', text: `Zaproszenie wysłane do @${target.nickname}.` })
    fetchAll()
  }

  const accept = async (id: string) => { await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id); fetchAll() }
  const remove = async (id: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    await supabase.from('friendships').delete().eq('id', id)
    fetchAll()
  }

  return (
    <div className="max-w-3xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Znajomi</h1>
        <p className="text-zinc-400">Dodaj znajomych po nicku, aby móc z nimi pisać.</p>
      </div>

      <form onSubmit={sendRequest} className={`${glassCard} flex flex-col gap-4`}>
        <Banner type={msg.type} message={msg.text} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" value={nick} onChange={e => setNick(e.target.value)} placeholder="Nick znajomego" className={inputBase} />
          <button type="submit" className={btnPrimarySm}>Zaproś</button>
        </div>
      </form>

      {incoming.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400">Zaproszenia do Ciebie ({incoming.length})</h2>
          {incoming.map(r => (
            <div key={r.id} className={`${glassCard} flex items-center justify-between gap-4 border-amber-500/20`}>
              <p className="text-lg font-bold text-white">@{otherOf(r)?.nickname}</p>
              <div className="flex gap-3">
                <button onClick={() => accept(r.id)} className={btnPrimarySm}>Akceptuj</button>
                <button onClick={() => remove(r.id)} className={btnDanger}>Odrzuć</button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Twoi znajomi ({friends.length})</h2>
        {friends.map(r => (
          <div key={r.id} className={`${glassCard} flex items-center justify-between gap-4`}>
            <p className="text-lg font-bold text-white">@{otherOf(r)?.nickname}</p>
            <button onClick={() => remove(r.id, 'Usunąć tę osobę ze znajomych?')} className={btnGhost}>Usuń</button>
          </div>
        ))}
        {friends.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-zinc-400">Nie masz jeszcze znajomych.</div>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Wysłane zaproszenia ({outgoing.length})</h2>
          {outgoing.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-black/30 p-5">
              <p className="font-bold text-zinc-400">@{otherOf(r)?.nickname}</p>
              <button onClick={() => remove(r.id)} className={btnGhost}>Anuluj</button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
