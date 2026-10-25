import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm, btnDanger, inputBase } from '../ui'
import { useMyGym } from '../useMyGym'

export default function GymAnnouncements({ session }: { session: any }) {
  const { gym, loading } = useMyGym(session)
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const fetchItems = async () => {
    if (!gym) return
    const { data } = await supabase.from('gym_announcements').select('*').eq('gym_id', gym.id).order('created_at', { ascending: false })
    if (data) setItems(data)
  }

  useEffect(() => { fetchItems() }, [gym])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !gym) return
    await supabase.from('gym_announcements').insert({ gym_id: gym.id, title: title.trim(), content })
    setTitle('')
    setContent('')
    fetchItems()
  }

  const remove = async (id: string) => {
    await supabase.from('gym_announcements').delete().eq('id', id)
    fetchItems()
  }

  if (loading) return <p className="text-zinc-400 font-bold animate-pulse">Ładowanie...</p>
  if (!gym) return <div className={`${glassCard} max-w-xl text-center text-zinc-400`}>Najpierw utwórz profil siłowni w zakładce „Moja Siłownia".</div>

  return (
    <div className="max-w-3xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Ogłoszenia</h1>
        <p className="text-zinc-400">Widoczne na stronie głównej członków i trenerów siłowni.</p>
      </div>

      <form onSubmit={add} className={`${glassCard} flex flex-col gap-4`}>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tytuł (np. Święto – skrócone godziny)" className={inputBase} />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Treść ogłoszenia..." className={`${inputBase} h-24 resize-none`} />
        <button type="submit" className={`${btnPrimarySm} w-fit`}>📢 Opublikuj</button>
      </form>

      <div className="flex flex-col gap-4">
        {items.map(a => (
          <div key={a.id} className={`${glassCard} flex items-start justify-between gap-4`}>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-white">{a.title}</h3>
              {a.content && <p className="text-zinc-400">{a.content}</p>}
              <span className="text-xs text-zinc-400">{new Date(a.created_at).toLocaleDateString('pl-PL')}</span>
            </div>
            <button onClick={() => remove(a.id)} className={btnDanger}>Usuń</button>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-zinc-400">Brak ogłoszeń.</div>}
      </div>
    </div>
  )
}
