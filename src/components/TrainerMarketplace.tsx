import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm, inputBase } from '../ui'

export default function TrainerMarketplace({ session }: { session: any }) {
  const [trainers, setTrainers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  // Wiadomość powitalna wpisywana osobno dla każdego trenera (klucz: id trenera)
  const [welcome, setWelcome] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchPublicTrainers = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'trainer').eq('is_public', true).neq('id', session.user.id)
      if (data) setTrainers(data)
    }
    fetchPublicTrainers()
  }, [])

  const sendInvite = async (trainerId: string) => {
    const message = (welcome[trainerId] || '').trim()
    const { data: existing } = await supabase.from('trainer_clients').select('*').eq('trainer_id', trainerId).eq('client_id', session.user.id).maybeSingle()

    if (existing) {
      if (existing.status === 'pending') return alert("Już wysłałeś zaproszenie! Czekaj na akceptację.")
      if (existing.status === 'active') return alert("Ten trener już z Tobą współpracuje!")
      if (existing.status === 'blocked') return alert("Nie możesz wysłać zaproszenia do tego trenera.")
      if (existing.status === 'rejected') {
        await supabase.from('trainer_clients').update({ status: 'pending', welcome_message: message }).eq('id', existing.id)
        return alert("Prośba o współpracę wysłana ponownie!")
      }
    }

    const { error } = await supabase.from('trainer_clients').insert({ trainer_id: trainerId, client_id: session.user.id, welcome_message: message })
    if (error) alert("Wystąpił błąd: " + error.message)
    else {
      setWelcome({ ...welcome, [trainerId]: '' })
      alert("Prośba o współpracę wysłana!")
    }
  }

  const filteredTrainers = trainers.filter(t => t.nickname?.toLowerCase().includes(searchQuery.toLowerCase()))
  return (
    <div className="max-w-4xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Społeczność Trenerów</h1>
        <p className="text-zinc-400">Znajdź trenera i wyślij zaproszenie do współpracy z wiadomością powitalną.</p>
      </div>

      <input type="text" placeholder="Szukaj po nicku..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputBase} text-lg`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTrainers.map(trainer => (
          <div key={trainer.id} className={`${glassCard} flex flex-col gap-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/30`}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl">🎓</div>
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-white">@{trainer.nickname || 'Nieznajomy'}</h3>
                <span className="text-sm text-zinc-400">Trener{trainer.experience_years ? ` · ${trainer.experience_years} lat doświadczenia` : ''}</span>
              </div>
            </div>

            {trainer.bio && <p className="text-sm text-zinc-400">{trainer.bio}</p>}

            <textarea
              value={welcome[trainer.id] || ''}
              onChange={e => setWelcome({ ...welcome, [trainer.id]: e.target.value })}
              placeholder="Wiadomość powitalna: kim jesteś, jaki masz cel..."
              className={`${inputBase} h-24 resize-none`}
            />

            <button onClick={() => sendInvite(trainer.id)} className={btnPrimarySm}>🤝 Wyślij zaproszenie</button>
          </div>
        ))}
        {filteredTrainers.length === 0 && (
          <div className="md:col-span-2 rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-center text-zinc-400">Nie znaleziono żadnych trenerów.</div>
        )}
      </div>
    </div>
  )
}
