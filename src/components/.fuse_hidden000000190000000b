import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, inputBase } from '../ui'
import { toKey } from '../health'
import CommentThread from './CommentThread'

export default function ClientSessions({ session }: { session: any }) {
  const [clients, setClients] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDay, setOpenDay] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('trainer_clients')
        .select('client:profiles!client_id(id, nickname)')
        .eq('trainer_id', session.user.id)
        .eq('status', 'active')
      if (data) setClients(data)
    }
    fetchClients()
  }, [session])

  useEffect(() => {
    if (!selected) { setLogs([]); return }
    const fetchLogs = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('exercise_logs')
        .select('id, workout_exercise_id, exercise_name, set_number, reps, weight, logged_at')
        .eq('client_id', selected)
        .eq('is_completed', true)
        .order('logged_at', { ascending: false })
        .limit(500)
      setLogs(data || [])
      setOpenDay(null)
      setLoading(false)
    }
    fetchLogs()
  }, [selected])

  // Grupowanie: dzień -> ćwiczenie -> serie
  const grouped: Record<string, Record<string, { name: string; exId: string | null; sets: any[] }>> = {}
  logs.forEach(l => {
    const day = toKey(new Date(l.logged_at))
    const exKey = l.workout_exercise_id || l.exercise_name
    grouped[day] = grouped[day] || {}
    grouped[day][exKey] = grouped[day][exKey] || { name: l.exercise_name, exId: l.workout_exercise_id, sets: [] }
    grouped[day][exKey].sets.push(l)
  })
  const days = Object.keys(grouped).sort().reverse()

  return (
    <div className="max-w-4xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Sesje podopiecznych</h1>
        <p className="text-zinc-400">Sprawdź ciężary i serie, dodawaj komentarze do ćwiczeń.</p>
      </div>

      <select value={selected} onChange={e => setSelected(e.target.value)} className={`${inputBase} text-lg`}>
        <option value="">-- Wybierz podopiecznego --</option>
        {clients.map(c => <option key={c.client.id} value={c.client.id}>@{c.client.nickname}</option>)}
      </select>

      {loading && <p className="text-zinc-400 font-bold animate-pulse">Pobieranie sesji...</p>}

      {selected && !loading && days.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-center text-zinc-400">
          Ten podopieczny nie ma jeszcze zapisanych serii.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {days.map(day => {
          const exercises = Object.values(grouped[day])
          const totalSets = exercises.reduce((s, e) => s + e.sets.length, 0)
          const volume = exercises.reduce((s, e) => s + e.sets.reduce((a, x) => a + Number(x.weight || 0) * Number(x.reps || 0), 0), 0)
          const isOpen = openDay === day

          return (
            <div key={day} className={`${glassCard} p-0 overflow-hidden`}>
              <button onClick={() => setOpenDay(isOpen ? null : day)} className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-white/5">
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-bold text-white">{day}</span>
                  <span className="text-sm text-zinc-400">{exercises.length} ćwiczeń · {totalSets} serii · objętość {Math.round(volume)} kg</span>
                </div>
                <span className="text-zinc-400">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="flex flex-col gap-6 border-t border-white/10 p-6">
                  {exercises.map(ex => (
                    <div key={ex.exId || ex.name} className="flex flex-col gap-3">
                      <h3 className="font-bold text-emerald-400">{ex.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {[...ex.sets].sort((a, b) => a.set_number - b.set_number).map(s => (
                          <span key={s.id} className="rounded-xl border border-white/5 bg-black/30 px-3 py-2 text-sm text-white">
                            <span className="text-zinc-400">#{s.set_number}</span> {s.weight} kg × {s.reps}
                          </span>
                        ))}
                      </div>
                      <CommentThread session={session} clientId={selected} sessionDate={day} workoutExerciseId={ex.exId} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
