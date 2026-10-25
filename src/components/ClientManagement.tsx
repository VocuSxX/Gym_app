import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimarySm, btnGhost, btnDanger } from '../ui'

export default function ClientManagement({ session }: { session: any }) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [activeClients, setActiveClients] = useState<any[]>([])
  const [blockedClients, setBlockedClients] = useState<any[]>([])

  const fetchTrainerClients = async () => {
    const { data } = await supabase.from('trainer_clients').select(`id, status, welcome_message, client:profiles!client_id(id, nickname)`).eq('trainer_id', session.user.id)
    if (data) {
      setPendingRequests(data.filter(req => req.status === 'pending'))
      setActiveClients(data.filter(req => req.status === 'active'))
      setBlockedClients(data.filter(req => req.status === 'blocked'))
    }
  }

  useEffect(() => { fetchTrainerClients() }, [])

  const acceptRequest = async (id: string) => { await supabase.from('trainer_clients').update({ status: 'active' }).eq('id', id); fetchTrainerClients() }

  const blockClient = async (id: string) => {
    if (window.confirm("Zablokować tego użytkownika? Nie będzie mógł wysyłać Ci zaproszeń.")) {
      await supabase.from('trainer_clients').update({ status: 'blocked' }).eq('id', id);
      fetchTrainerClients()
    }
  }

  const unblockClient = async (id: string) => {
    await supabase.from('trainer_clients').delete().eq('id', id);
    fetchTrainerClients()
  }

  // Funkcja do zakończenia współpracy z aktywnym podopiecznym
  const removeClient = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz zakończyć współpracę z tym podopiecznym? Zniknie on z Twojej listy.")) {
      await supabase.from('trainer_clients').delete().eq('id', id);
      fetchTrainerClients()
    }
  }

  return (
    <div className="max-w-4xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Zarządzanie Podopiecznymi</h1>
        <p className="text-zinc-400">Akceptuj zaproszenia i zarządzaj współpracą.</p>
      </div>

      {/* OCZEKUJĄCE */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400">Oczekujące zaproszenia ({pendingRequests.length})</h2>
        <div className="flex flex-col gap-4">
          {pendingRequests.map(req => (
            <div key={req.id} className={`${glassCard} flex flex-col gap-4 border-amber-500/20`}>
              <div className="flex items-center justify-between gap-6">
                <p className="text-xl font-bold text-white">@{req.client.nickname}</p>
                <div className="flex gap-3">
                  <button onClick={() => acceptRequest(req.id)} className={btnPrimarySm}>Akceptuj</button>
                  <button onClick={() => blockClient(req.id)} className={btnDanger}>Blokuj</button>
                </div>
              </div>
              {req.welcome_message && (
                <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Wiadomość powitalna</p>
                  <p className="text-white">{req.welcome_message}</p>
                </div>
              )}
            </div>
          ))}
          {pendingRequests.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-zinc-400">Brak oczekujących zaproszeń.</div>
          )}
        </div>
      </section>

      {/* AKTYWNI */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Twoi aktywni podopieczni ({activeClients.length})</h2>
        <div className="flex flex-col gap-4">
          {activeClients.map(req => (
            <div key={req.id} className={`${glassCard} flex items-center justify-between gap-6`}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-xl">💪</div>
                <p className="text-xl font-bold text-white">@{req.client.nickname}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => removeClient(req.id)} className={btnGhost}>Zakończ współpracę</button>
                <button onClick={() => blockClient(req.id)} className={btnDanger}>Blokuj</button>
              </div>
            </div>
          ))}
          {activeClients.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-zinc-400">Nie masz jeszcze aktywnych podopiecznych.</div>
          )}
        </div>
      </section>

      {/* ZABLOKOWANI */}
      {blockedClients.length > 0 && (
        <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Zablokowani użytkownicy ({blockedClients.length})</h2>
          <div className="flex flex-col gap-4">
            {blockedClients.map(req => (
              <div key={req.id} className="flex items-center justify-between gap-6 rounded-3xl border border-red-500/10 bg-black/30 p-6 opacity-80">
                <p className="text-lg font-bold text-zinc-400 line-through">@{req.client.nickname}</p>
                <button onClick={() => unblockClient(req.id)} className={btnGhost}>Odblokuj</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
