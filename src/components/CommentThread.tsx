import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { btnPrimarySm, inputBase } from '../ui'

// Wątek komentarzy do jednego ćwiczenia w danym dniu (trener <-> podopieczny)
export default function CommentThread({ session, clientId, sessionDate, workoutExerciseId }: {
  session: any
  clientId: string
  sessionDate: string
  workoutExerciseId: string | null
}) {
  const [comments, setComments] = useState<any[]>([])
  const [text, setText] = useState('')

  const fetchComments = async () => {
    let q = supabase
      .from('session_comments')
      .select('id, content, created_at, author_id, author:profiles!author_id(nickname)')
      .eq('client_id', clientId)
      .eq('session_date', sessionDate)
      .order('created_at', { ascending: true })
    q = workoutExerciseId ? q.eq('workout_exercise_id', workoutExerciseId) : q.is('workout_exercise_id', null)
    const { data } = await q
    if (data) setComments(data)
  }

  useEffect(() => { fetchComments() }, [clientId, sessionDate, workoutExerciseId])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    await supabase.from('session_comments').insert({
      author_id: session.user.id,
      client_id: clientId,
      session_date: sessionDate,
      workout_exercise_id: workoutExerciseId,
      content,
    })
    fetchComments()
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/20 p-4">
      {comments.map(c => {
        const isMe = c.author_id === session.user.id
        return (
          <div key={c.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">@{c.author?.nickname || '?'}</span>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${isMe ? 'bg-emerald-500 text-white' : 'border border-white/10 bg-white/10 text-white'}`}>
              {c.content}
            </div>
          </div>
        )
      })}
      <form onSubmit={send} className="flex gap-3">
        <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Dodaj komentarz..." className={inputBase} />
        <button type="submit" disabled={!text.trim()} className={`${btnPrimarySm} disabled:opacity-50 disabled:pointer-events-none`}>Wyślij</button>
      </form>
    </div>
  )
}
