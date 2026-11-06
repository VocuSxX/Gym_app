import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm, inputBase } from '../ui'
import Banner from './Banner'

// Zaproszenie do znajomych po nicku. rows (opcjonalne) to już pobrane znajomości, żeby nie pytać bazy drugi raz.
export default function AddFriendForm({ me, rows, onSent }: { me: string; rows?: any[]; onSent?: () => void }) {
  const [nick, setNick] = useState('')
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string }>({ type: 'success', text: '' })

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg({ type: 'success', text: '' })
    const name = nick.trim().replace(/^@/, '')
    if (!name) return

    const { data: target } = await supabase.from('profiles').select('id, nickname').ilike('nickname', name).maybeSingle()
    if (!target) return setMsg({ type: 'error', text: 'Nie znaleziono użytkownika o takim nicku.' })
    if (target.id === me) return setMsg({ type: 'error', text: 'Nie możesz zaprosić samego siebie.' })

    const known = rows ?? ((await supabase.from('friendships').select('id, status, requester_id, addressee_id')).data || [])
    const existing = known.find((r: any) => r.requester_id === target.id || r.addressee_id === target.id)
    if (existing) {
      return setMsg({ type: 'error', text: existing.status === 'accepted' ? 'Jesteście już znajomymi.' : 'Zaproszenie już istnieje.' })
    }

    const { error } = await supabase.from('friendships').insert({ requester_id: me, addressee_id: target.id })
    if (error) return setMsg({ type: 'error', text: 'Nie udało się wysłać zaproszenia.' })
    setNick('')
    setMsg({ type: 'success', text: `Zaproszenie wysłane do @${target.nickname}.` })
    onSent?.()
  }

  return (
    <form onSubmit={send} className={`${glassCard} flex flex-col gap-3 !p-4`}>
      <Banner type={msg.type} message={msg.text} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input type="text" value={nick} onChange={e => setNick(e.target.value)} placeholder="Nick znajomego" className={inputBase} />
        <button type="submit" className={btnPrimarySm}>Zaproś</button>
      </div>
    </form>
  )
}
