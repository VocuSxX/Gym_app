import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ClientManagement({ session }: { session: any }) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [activeClients, setActiveClients] = useState<any[]>([])
  const [blockedClients, setBlockedClients] = useState<any[]>([])

  const fetchTrainerClients = async () => {
    const { data } = await supabase.from('trainer_clients').select(`id, status, client:profiles!client_id(id, nickname)`).eq('trainer_id', session.user.id)
    if (data) {
      setPendingRequests(data.filter(req => req.status === 'pending'))
      setActiveClients(data.filter(req => req.status === 'active'))
      setBlockedClients(data.filter(req => req.status === 'blocked'))
    }
  }

  useEffect(() => { fetchTrainerClients() }, [])

  const acceptRequest = async (id: string) => { await supabase.from('trainer_clients').update({ status: 'active' }).eq('id', id); fetchTrainerClients() }
  const rejectRequest = async (id: string) => { await supabase.from('trainer_clients').update({ status: 'rejected' }).eq('id', id); fetchTrainerClients() }
  
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

  // NOWE: Funkcja do zakończenia współpracy z aktywnym podopiecznym
  const removeClient = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz zakończyć współpracę z tym podopiecznym? Zniknie on z Twojej listy.")) {
      await supabase.from('trainer_clients').delete().eq('id', id);
      fetchTrainerClients()
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Zarządzanie Podopiecznymi</h1>
      
      <h2 className="text-xl font-bold text-yellow-500 mb-4">Oczekujące zaproszenia</h2>
      <div className="grid grid-cols-1 gap-4 mb-10">
        {pendingRequests.map(req => (
          <div key={req.id} className="bg-gray-800 p-4 rounded-xl border border-yellow-600/30 flex justify-between items-center">
            <p className="font-bold text-lg">@{req.client.nickname}</p>
            <div className="flex gap-2">
              <button onClick={() => acceptRequest(req.id)} className="bg-green-600 px-3 py-1 rounded font-bold hover:bg-green-500 text-sm transition-colors">Akceptuj</button>
              <button onClick={() => blockClient(req.id)} className="bg-red-600 px-3 py-1 rounded font-bold hover:bg-red-500 text-sm transition-colors">Blokuj</button>
            </div>
          </div>
        ))}
        {pendingRequests.length === 0 && <p className="text-gray-500 italic">Brak oczekujących zaproszeń.</p>}
      </div>

      <h2 className="text-xl font-bold text-pink-400 mb-4">Twoi aktywni podopieczni</h2>
      <div className="grid grid-cols-1 gap-4 mb-10">
        {activeClients.map(req => (
          <div key={req.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
            <p className="font-bold text-lg">@{req.client.nickname}</p>
            {/* NOWE: Przyciski dla aktywnych klientów */}
            <div className="flex gap-2">
              <button onClick={() => removeClient(req.id)} className="bg-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-600 text-sm transition-colors">Zakończ współpracę</button>
              <button onClick={() => blockClient(req.id)} className="bg-red-900/30 text-red-400 px-4 py-2 rounded font-bold hover:bg-red-600 hover:text-white text-sm transition-colors">Blokuj</button>
            </div>
          </div>
        ))}
        {activeClients.length === 0 && <p className="text-gray-500 italic">Nie masz jeszcze aktywnych podopiecznych.</p>}
      </div>

      {blockedClients.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-gray-500 mb-4 border-t border-gray-700 pt-8">Zablokowani użytkownicy</h2>
          <div className="grid grid-cols-1 gap-4">
            {blockedClients.map(req => (
              <div key={req.id} className="bg-gray-900 p-4 rounded-xl border border-red-900/30 flex justify-between items-center opacity-70">
                <p className="font-bold text-gray-500 line-through">@{req.client.nickname}</p>
                <button onClick={() => unblockClient(req.id)} className="border border-gray-600 px-4 py-2 rounded font-bold hover:bg-gray-700 text-gray-300 text-sm transition-colors">Odblokuj</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}