import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimary, inputBase } from '../ui'

export default function Chat({ session }: { session: any }) {
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [activeContact, setActiveContact] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. KONTAKTY: tylko znajomi + relacja trener-podopieczny (aktywna)
  useEffect(() => {
    if (!session?.user?.id) return
    const me = session.user.id

    const fetchContacts = async () => {
      const [{ data: fr }, { data: tc }] = await Promise.all([
        supabase.from('friendships').select('requester_id, addressee_id').eq('status', 'accepted'),
        supabase.from('trainer_clients').select('trainer_id, client_id').eq('status', 'active').or(`trainer_id.eq.${me},client_id.eq.${me}`),
      ])

      const ids = new Set<string>()
      fr?.forEach(f => ids.add(f.requester_id === me ? f.addressee_id : f.requester_id))
      tc?.forEach(t => ids.add(t.trainer_id === me ? t.client_id : t.trainer_id))
      ids.delete(me)

      if (ids.size === 0) { setAllUsers([]); return }

      const { data } = await supabase
        .from('profiles')
        .select('id, nickname, role')
        .in('id', Array.from(ids))
        .order('nickname')
      if (data) setAllUsers(data)
    }
    fetchContacts()
  }, [session?.user?.id])

  // 2. ŁADOWANIE WIADOMOŚCI I REALTIME
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
    // RWD: na telefonie widać albo listę kontaktów, albo okno czatu
    <div className="flex h-[80vh] w-full max-w-6xl gap-6 animate-fade-in">

      {/* LEWA KOLUMNA - KONTAKTY */}
      <div className={`${glassCard} ${activeContact ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 p-0 flex-col overflow-hidden`}>
        <div className="flex flex-col gap-4 border-b border-white/10 p-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Kontakty</h2>
          <input
            type="text"
            placeholder="Szukaj kontaktu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={inputBase}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => setActiveContact(user)}
              className={`w-full text-left rounded-2xl border p-4 flex flex-col gap-1 transition-all duration-200 active:scale-95 ${activeContact?.id === user.id ? 'bg-emerald-500/15 border-emerald-500/40 text-white' : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-white'}`}
            >
              <span className="font-bold">@{user.nickname || 'Nieznajomy'}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{user.role}</span>
            </button>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-zinc-400 p-4 text-sm text-center">
              {allUsers.length === 0 ? 'Brak kontaktów. Dodaj znajomych w zakładce „Znajomi".' : 'Nikogo nie znaleziono.'}
            </p>
          )}
        </div>
      </div>

      {/* PRAWA KOLUMNA - OKNO CZATU */}
      <div className={`${glassCard} ${activeContact ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 p-0 flex-col overflow-hidden`}>
        {!activeContact ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <span className="text-5xl">💬</span>
            <p className="font-bold text-white">Wybierz osobę z listy</p>
            <p className="text-zinc-400">Kliknij kontakt po lewej, aby rozpocząć czat.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/40 backdrop-blur-md px-4 md:px-6 py-4">
              <button onClick={() => setActiveContact(null)} className="text-zinc-400 hover:text-white md:hidden">⬅</button>
              <span className="flex-1 text-lg font-bold text-white">@{activeContact.nickname}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-zinc-400">{activeContact.role}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="text-center text-zinc-400 mt-10">To początek waszej konwersacji. Napisz "Cześć!" 👋</div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === session?.user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] md:max-w-[70%] break-words rounded-3xl px-5 py-3 shadow-lg ${isMe ? 'bg-emerald-500 text-white rounded-br-md shadow-emerald-500/20' : 'bg-white/10 border border-white/10 text-white rounded-bl-md'}`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="flex gap-3 md:gap-4 border-t border-white/10 bg-black/40 backdrop-blur-md p-3 md:p-4">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Napisz wiadomość..."
                className={inputBase}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className={`${btnPrimary} !px-4 md:!px-6 disabled:opacity-50 disabled:pointer-events-none`}
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
