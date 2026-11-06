import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { confirmDialog } from '../notify'
import { glassCard, btnPrimarySm, btnGhost, btnDanger } from '../ui'
import AddFriendForm from './AddFriendForm'

export default function Friends({ session, showAdd = true }: { session: any; showAdd?: boolean }) {
  const me = session.user.id
  const [rows, setRows] = useState<any[]>([])

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

  const accept = async (id: string) => { await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id); fetchAll() }
  const remove = async (id: string, confirmText?: string) => {
    if (confirmText && !(await confirmDialog(confirmText, { confirmLabel: 'Usuń' }))) return
    await supabase.from('friendships').delete().eq('id', id)
    fetchAll()
  }

  return (
    <div className="max-w-3xl w-full flex flex-col gap-8 animate-fade-in">

      {showAdd && <AddFriendForm me={me} rows={rows} onSent={fetchAll} />}

      {incoming.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-amber-400">Zaproszenia do Ciebie ({incoming.length})</h2>
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
        <h2 className="text-sm font-bold text-accent-400">Twoi znajomi ({friends.length})</h2>
        {friends.map(r => (
          <div key={r.id} className={`${glassCard} flex items-center justify-between gap-4`}>
            <p className="text-lg font-bold text-white">@{otherOf(r)?.nickname}</p>
            <button onClick={() => remove(r.id, 'Usunąć tę osobę ze znajomych?')} className={btnGhost}>Usuń</button>
          </div>
        ))}
        {friends.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">Nie masz jeszcze znajomych.{!showAdd && ' Dodasz ich w Wiadomościach.'}</div>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="flex flex-col gap-4 border-t border-zinc-800 pt-8">
          <h2 className="text-sm font-bold text-zinc-400">Wysłane zaproszenia ({outgoing.length})</h2>
          {outgoing.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="font-bold text-zinc-400">@{otherOf(r)?.nickname}</p>
              <button onClick={() => remove(r.id)} className={btnGhost}>Anuluj</button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
