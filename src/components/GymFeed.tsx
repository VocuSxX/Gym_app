import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard } from '../ui'

// Najnowsze ogłoszenia siłowni (RLS pokazuje tylko te z Twojej siłowni)
export default function GymFeed() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('gym_announcements')
        .select('id, title, content, gym:gyms(name)')
        .order('created_at', { ascending: false })
        .limit(3)
      if (data) setItems(data)
    }
    load()
  }, [])

  if (items.length === 0) return null

  return (
    <div className={`${glassCard} flex flex-col gap-3 border-amber-500/20`}>
      <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400">📢 Ogłoszenia siłowni</h3>
      {items.map(a => (
        <div key={a.id} className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-black/30 p-4">
          <p className="font-bold text-white">{a.title} <span className="text-xs font-normal text-zinc-400">· {a.gym?.name}</span></p>
          {a.content && <p className="text-sm text-zinc-400">{a.content}</p>}
        </div>
      ))}
    </div>
  )
}
