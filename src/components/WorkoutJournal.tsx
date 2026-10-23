import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimary, btnPrimarySm } from '../ui'

export default function WorkoutJournal({ session }: { session: any }) {
  const [activePlan, setActivePlan] = useState<any>(null)
  const [activeWorkout, setActiveWorkout] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Ghost data przechowuje ostatnie ciężary/powtórzenia dla każdego ćwiczenia (klucz to ID ćwiczenia)
  const [ghostData, setGhostData] = useState<any>({})

  // Stan wpisywanych danych w formularzu (klucz: np. "idcwiczenia-seria1")
  const [formInputs, setFormInputs] = useState<any>({})

  // Lista serii, które zostały już dzisiaj odhaczone (zapisane)
  const [completedSets, setCompletedSets] = useState<string[]>([])

  useEffect(() => {
    fetchPlan()
  }, [])

  const fetchPlan = async () => {
    // Potężne zapytanie: pobieramy Plan -> Dni -> Ćwiczenia za jednym zamachem!
    const { data: plan } = await supabase
      .from('workout_plans')
      .select(`
        id, name,
        workouts (
          id, name, order_index,
          workout_exercises (
            id, name, target_sets, target_reps, rir, order_index, image_url
          )
        )
      `)
      .eq('client_id', session.user.id)
      .eq('status', 'active')
      .order('order_index', { referencedTable: 'workouts' })
      .limit(1)
      .single()

    if (plan) {
      // Sortujemy ćwiczenia w dniach po kolei
      plan.workouts.forEach((w: any) => {
        w.workout_exercises.sort((a: any, b: any) => a.order_index - b.order_index)
      })
      setActivePlan(plan)
    }
    setLoading(false)
  }

  // Funkcja uruchamiająca konkretny dzień treningowy
  const startWorkout = async (workout: any) => {
    setActiveWorkout(workout)
    setCompletedSets([]) // Nowy trening = brak odhaczonych serii na dziś

    // Pobieramy historię (Ghost Data) dla wybranego dnia
    const exerciseIds = workout.workout_exercises.map((ex: any) => ex.id)
    const { data: logs } = await supabase
      .from('exercise_logs')
      .select('workout_exercise_id, weight, reps, logged_at')
      .eq('client_id', session.user.id)
      .in('workout_exercise_id', exerciseIds)
      .order('logged_at', { ascending: false })

    // Wyciągamy tylko najnowszą serię dla każdego ćwiczenia, żeby wiedzieć, co było ostatnio
    const latestLogs: any = {}
    if (logs) {
      logs.forEach(log => {
        if (!latestLogs[log.workout_exercise_id]) {
          latestLogs[log.workout_exercise_id] = { weight: log.weight, reps: log.reps }
        }
      })
    }
    setGhostData(latestLogs)
  }

  const handleInputChange = (exerciseId: string, setIndex: number, field: string, value: string) => {
    const key = `${exerciseId}-${setIndex}`
    setFormInputs({
      ...formInputs,
      [key]: { ...formInputs[key], [field]: value }
    })
  }

  const saveSet = async (exercise: any, setIndex: number) => {
    const key = `${exercise.id}-${setIndex}`
    const input = formInputs[key] || {}
    const ghost = ghostData[exercise.id] || { weight: 0, reps: 0 }

    // GENIALNA LOGIKA: Jeśli user nic nie wpisał, system bierze "Ghost Data"!
    const finalWeight = input.weight ? parseFloat(input.weight) : ghost.weight
    const finalReps = input.reps ? parseInt(input.reps) : ghost.reps

    if (!finalWeight && !finalReps) {
      return alert("Wpisz ciężar i powtórzenia (lub wykonaj trening chociaż raz, żeby mieć auto-uzupełnianie).")
    }

    // Wysyłamy do bazy SQL
    const { error } = await supabase.from('exercise_logs').insert({
      workout_exercise_id: exercise.id,
      client_id: session.user.id,
      exercise_name: exercise.name,
      set_number: setIndex + 1,
      reps: finalReps,
      weight: finalWeight,
      is_completed: true
    })

    if (!error) {
      // Oznaczamy jako "Zrobione" na zielono
      setCompletedSets([...completedSets, key])

      // Aktualizujemy Ghost Data "w locie" - żeby kolejna seria od razu podpowiadała nowy ciężar!
      setGhostData({
        ...ghostData,
        [exercise.id]: { weight: finalWeight, reps: finalReps }
      })
    } else {
      alert("Błąd zapisu!")
    }
  }

  if (loading) return <p className="text-zinc-400 font-bold animate-pulse">Ładowanie planu...</p>

  if (!activePlan) {
    return (
      <div className={`${glassCard} max-w-2xl text-center py-16 flex flex-col gap-3 border-dashed`}>
        <span className="text-5xl">🗓️</span>
        <h2 className="text-2xl font-extrabold text-white">Brak aktywnego planu</h2>
        <p className="text-zinc-400">Twój trener musi najpierw przypisać Ci plan treningowy.</p>
      </div>
    )
  }

  // Postęp aktualnego treningu (gruby pasek w stylu Duolingo)
  const totalSets = activeWorkout
    ? activeWorkout.workout_exercises.reduce((sum: number, ex: any) => sum + Number(ex.target_sets), 0)
    : 0
  const progressPct = totalSets > 0 ? Math.round((completedSets.length / totalSets) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto w-full pb-20 flex flex-col gap-8">

      {/* JEŚLI NIE WYBRANO DNIA: Przegląd Planu */}
      {!activeWorkout ? (
        <div className="animate-fade-in flex flex-col gap-8">
          <div className={`${glassCard} p-8 flex flex-col gap-2 border-emerald-500/20`}>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Twój obecny plan treningowy</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{activePlan.name}</h1>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white">Wybierz trening na dziś</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePlan.workouts.map((workout: any) => (
                <button
                  key={workout.id}
                  onClick={() => startWorkout(workout)}
                  className="group text-left rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl flex flex-col gap-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-emerald-500/10 active:translate-y-1 active:scale-95"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl transition-colors duration-200 group-hover:bg-emerald-500/25">🔥</div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-white">{workout.name}</h3>
                    <p className="text-zinc-400 text-sm">{workout.workout_exercises.length} ćwiczeń</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* JEŚLI WYBRANO DZIEŃ: Właściwy Dziennik (Tryb Treningu) */
        <div className="animate-fade-in flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <button onClick={() => setActiveWorkout(null)} className="w-fit text-zinc-400 font-semibold transition-colors duration-200 hover:text-white">⬅ Wróć do przeglądu planu</button>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">🔥 {activeWorkout.name}</h1>

            {/* Gruby pasek postępu treningu */}
            <div className="flex flex-col gap-2">
              <div className="h-4 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="text-sm font-bold text-zinc-400">{completedSets.length} / {totalSets} serii · <span className="text-emerald-400">{progressPct}%</span></p>
            </div>
          </div>


          <div className="flex flex-col gap-8">
            {activeWorkout.workout_exercises.map((ex: any, idx: number) => {
              const ghost = ghostData[ex.id] || { weight: '', reps: '' }

              return (
                <div key={ex.id} className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
                  {/* OBRAZEK / GIF NAD ĆWICZENIEM */}
                  {ex.image_url && (
                    <div className="w-full bg-black/40 backdrop-blur-md flex items-center justify-center border-b border-white/10">
                      <img src={ex.image_url} alt={ex.name} className="w-full max-h-64 object-contain" />
                    </div>
                  )}

                  <div className="p-6 flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-2xl font-bold text-white">{idx + 1}. {ex.name}</h3>
                      <p className="text-sm text-zinc-400">Cel: <span className="text-emerald-400 font-semibold">{ex.target_sets} serie · {ex.target_reps} powt · RIR {ex.rir}</span></p>
                    </div>

                    <div className="flex flex-col gap-3">
                      {/* Generujemy pętle tyle razy, ile serii założył trener */}
                      {Array.from({ length: ex.target_sets }).map((_, setIdx) => {
                        const key = `${ex.id}-${setIdx}`
                        const isCompleted = completedSets.includes(key)

                        return (
                          <div key={setIdx} className={`flex gap-4 items-center p-4 rounded-2xl border transition-all duration-200 ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/30 border-white/5'}`}>
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400'}`}>{setIdx + 1}</div>

                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ciężar (kg)</label>
                              <input
                                type="number"
                                disabled={isCompleted}
                                placeholder={ghost.weight ? `${ghost.weight} kg` : '-'}
                                onChange={e => handleInputChange(ex.id, setIdx, 'weight', e.target.value)}
                                className="w-full bg-transparent text-white font-bold text-xl outline-none placeholder-zinc-500 disabled:opacity-50"
                              />
                            </div>

                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Powt.</label>
                              <input
                                type="number"
                                disabled={isCompleted}
                                placeholder={ghost.reps ? `${ghost.reps}` : '-'}
                                onChange={e => handleInputChange(ex.id, setIdx, 'reps', e.target.value)}
                                className="w-full bg-transparent text-white font-bold text-xl outline-none placeholder-zinc-500 disabled:opacity-50"
                              />
                            </div>

                            {/* Przycisk Zapisz / Zrobione */}
                            <button
                              disabled={isCompleted}
                              onClick={() => saveSet(ex, setIdx)}
                              className={isCompleted ? 'rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold py-3 px-5' : btnPrimarySm}
                            >
                              {isCompleted ? '✓' : 'Zapisz'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={() => { alert("Trening zakończony! Dobra robota!"); setActiveWorkout(null); }} className={`${btnPrimary} w-full text-xl`}>
            Zakończ Trening 🏁
          </button>
        </div>
      )}
    </div>
  )
}

