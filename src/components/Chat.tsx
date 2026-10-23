import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export default function Chat({ session }: { session: any }) {
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [activeContact, setActiveContact] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. POBIERAMY WSZYSTKICH UŻYTKOWNIKÓW Z BAZY (Każdy z każdym)
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchAllUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, nickname, role')
        .neq('id', session.user.id) // Pobieramy wszystkich OPRÓCZ zalogowanego użytkownika
        .order('nickname');

      if (data) setAllUsers(data);
    }
    fetchAllUsers();
  }, [session?.user?.id])

  // 2. ŁADOWANIE WIADOMOŚCI I REALTIME (Zostaje bez zmian - działa świetnie!)
  useEffect(() => {
    if (!activeContact || !session?.user?.id) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${activeContact.id}),and(sender_id.eq.${activeContact.id},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data)
    }

    fetchMessages()

    const channel = supabase
      .channel('realtime_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new
        if (
          (newMsg.sender_id === session.user.id && newMsg.receiver_id === activeContact.id) ||
          (newMsg.sender_id === activeContact.id && newMsg.receiver_id === session.user.id)
        ) {
          setMessages(prev => [...prev, newMsg])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeContact, session?.user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeContact || !session?.user?.id) return

    const msgContent = newMessage
    setNewMessage('') 

    await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: activeContact.id,
      content: msgContent
    })
  }

  // Wyszukiwarka kontaktów (filtrowanie)
  const filteredUsers = allUsers.filter(user => 
    user.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-[80vh] border border-zinc-700 rounded-3xl overflow-hidden bg-zinc-900">
      
      {/* LEWA KOLUMNA - LISTA WSZYSTKICH UŻYTKOWNIKÓW */}
      <div className="w-1/3 border-r border-zinc-700 bg-zinc-950 flex flex-col">
        <div className="p-4 border-b border-zinc-700 bg-zinc-900">
          <h2 className="font-bold text-emerald-400 mb-3">Społeczność</h2>
          <input 
            type="text" 
            placeholder="Szukaj użytkownika..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-2 text-white outline-none focus:border-emerald-500 text-sm"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredUsers.map(user => (
            <button 
              key={user.id} 
              onClick={() => setActiveContact(user)} 
              className={`w-full text-left p-3 rounded-2xl transition-colors flex flex-col ${activeContact?.id === user.id ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              <span className="font-bold">@{user.nickname || 'Nieznajomy'}</span>
              <span className="text-xs opacity-70 uppercase mt-1">{user.role}</span>
            </button>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-zinc-500 p-4 text-sm text-center">Nikogo nie znaleziono.</p>
          )}
        </div>
      </div>

      {/* PRAWA KOLUMNA - OKNO CZATU */}
      <div className="flex-1 flex flex-col bg-zinc-900">
        {!activeContact ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <span className="text-4xl mb-4">💬</span>
            <p className="font-bold">Wybierz osobę z listy, aby rozpocząć czat.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-zinc-700 bg-zinc-800 flex justify-between items-center shadow-md z-10">
              <span className="font-bold text-white">Czat z: @{activeContact.nickname}</span>
              <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full uppercase">{activeContact.role}</span>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col bg-zinc-900/50">
              {messages.length === 0 ? (
                <div className="text-center text-zinc-500 mt-10">To początek waszej konwersacji. Napisz "Cześć!" 👋</div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === session?.user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-zinc-700 text-zinc-100 rounded-bl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-700 bg-zinc-800 flex gap-2">
              <input 
                type="text" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Napisz wiadomość..." 
                className="flex-1 bg-zinc-900 border border-zinc-600 rounded-2xl p-3 text-white outline-none focus:border-emerald-500" 
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()} 
                className="bg-emerald-600 px-6 py-3 rounded-2xl font-bold hover:bg-emerald-500 disabled:opacity-50 text-white transition-all active:scale-95"
              >
                Wyślij
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}