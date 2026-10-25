import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard } from '../ui'
import CommentThread from './CommentThread'

// Widok podopiecznego: komentarze trenera do jego ćwiczeń (z możliwością odpowiedzi)
export default function MyComments({ session }: { session: any }) {
  const [threads, setThreads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchThreads = async () => {
      const { data } = await supabase
        .from('session_comments')
        .select('session_date, workout_exercise_id, exercise:workout_exercises(name)')
        .eq('client_id', session.user.id)
        .order('session_date', { ascending: false })

      const seen = new Set<string>()
      const unique: any[] = []
      data?.forEach((c: any) => {
        const key = `${c.session_date}|${c.workout_exercise_id}`
        if (!seen.has(key)) { seen.add(key); unique.push(c) }
      })
      setThreads(unique)
      setLoading(false)
    }
    fetchThreads()
  }, [session])

  if (loading) return <p className="text-zinc-400 font-bold animate-pulse">Ładowanie komentarzy...</p>

  return (
    <div className="max-w-3xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Komentarze trenera</h1>
        <p className="text-zinc-400">Uwagi do Twoich treningów. Możesz odpowiadać.</p>
      </div>

      {threads.length === 0 && (
        <div className={`${glassCard} text-center py-16 flex flex-col gap-3 border-dashed`}>
          <span className="text-5xl">💭</span>
          <p className="text-xl font-bold text-white">Brak komentarzy</p>
          <p className="text-zinc-400">Gdy trener skomentuje Twoje ćwiczenie, zobaczysz to tutaj.</p>
        </div>
      )}

      {threads.map(t => (
        <div key={`${t.session_date}|${t.workout_exercise_id}`} className={`${glassCard} flex flex-col gap-4`}>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-white">{t.exercise?.name || 'Cała sesja'}</h3>
            <span className="text-sm text-zinc-400">{t.session_date}</span>
          </div>
          <CommentThread session={session} clientId={session.user.id} sessionDate={t.session_date} workoutExerciseId={t.workout_exercise_id} />
        </div>
      ))}
    </div>
  )
}
