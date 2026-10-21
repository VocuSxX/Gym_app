import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function TrainerMarketplace({ session }: { session: any }) {
  const [trainers, setTrainers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchPublicTrainers = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'trainer').eq('is_public', true).neq('id', session.user.id)
      if (data) setTrainers(data)
    }
    fetchPublicTrainers()
  }, [])

  const sendInvite = async (trainerId: string) => {
    const { data: existing } = await supabase.from('trainer_clients').select('*').eq('trainer_id', trainerId).eq('client_id', session.user.id).maybeSingle()
    
    if (existing) {
      if (existing.status === 'pending') return alert("Już wysłałeś zaproszenie! Czekaj na akceptację.")
      if (existing.status === 'active') return alert("Ten trener już z Tobą współpracuje!")
      if (existing.status === 'blocked') return alert("Nie możesz wysłać zaproszenia do tego trenera.")
      if (existing.status === 'rejected') {
        await supabase.from('trainer_clients').update({ status: 'pending' }).eq('id', existing.id)
        return alert("Prośba o współpracę wysłana ponownie!")
      }
    }

    const { error } = await supabase.from('trainer_clients').insert({ trainer_id: trainerId, client_id: session.user.id })
    if (error) alert("Wystąpił błąd: " + error.message)
    else alert("Prośba o współpracę wysłana!")
  }

  const filteredTrainers = trainers.filter(t => t.nickname?.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Społeczność Trenerów</h1>
      <input type="text" placeholder="Szukaj po nicku..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full mb-8 p-4 rounded-xl bg-gray-800 border border-gray-700 outline-none focus:border-pink-500" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTrainers.map(trainer => (
          <div key={trainer.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-2">@{trainer.nickname || 'Nieznajomy'}</h3>
            <button onClick={() => sendInvite(trainer.id)} className="bg-gray-700 w-full py-3 rounded-lg font-bold hover:bg-pink-600 transition-colors mt-4">🤝 Wyślij zaproszenie</button>
          </div>
        ))}
      </div>
    </div>
  )
}