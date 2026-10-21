import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

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
            id, name, target_sets, target_reps, rir, order_index
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

  if (loading) return <p className="text-gray-400 animate-pulse">Ładowanie planu...</p>

  if (!activePlan) {
    return (
      <div className="max-w-2xl text-center py-20 bg-gray-800 rounded-xl border border-dashed border-gray-600">
        <h2 className="text-2xl font-bold text-gray-400 mb-2">Brak aktywnego planu</h2>
        <p className="text-gray-500">Twój trener musi najpierw przypisać Ci plan treningowy.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* JEŚLI NIE WYBRANO DNIA: Wyświetlamy Przegląd Planu */}
      {!activeWorkout ? (
        <div className="animate-fade-in">
          <div className="bg-gradient-to-r from-pink-900/40 to-gray-900 p-8 rounded-2xl border border-pink-500/30 mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{activePlan.name}</h1>
            <p className="text-pink-400 font-bold">Twój obecny plan treningowy</p>
          </div>

          <h2 className="text-xl font-bold mb-4">Wybierz trening na dziś:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePlan.workouts.map((workout: any) => (
              <button key={workout.id} onClick={() => startWorkout(workout)} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-pink-500 text-left transition-all hover:scale-[1.02]">
                <h3 className="text-xl font-bold text-white mb-1">{workout.name}</h3>
                <p className="text-gray-400 text-sm">{workout.workout_exercises.length} ćwiczeń</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* JEŚLI WYBRANO DZIEŃ: Właściwy Dziennik (Tryb Treningu) */
        <div className="animate-fade-in">
          <button onClick={() => setActiveWorkout(null)} className="text-gray-400 hover:text-white mb-6">⬅ Wróć do przeglądu planu</button>
          <h1 className="text-3xl font-bold mb-8 text-pink-400">🔥 {activeWorkout.name}</h1>

          <div className="space-y-8">
            {activeWorkout.workout_exercises.map((ex: any, idx: number) => {
              const ghost = ghostData[ex.id] || { weight: '', reps: '' }
              
              return (
                <div key={ex.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
                  <div className="bg-gray-700/50 p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">{idx + 1}. {ex.name}</h3>
                    <p className="text-sm text-pink-300 mt-1">Cel: {ex.target_sets} serie • {ex.target_reps} powt • RIR: {ex.rir}</p>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {/* Generujemy pętle tyle razy, ile serii założył trener */}
                    {Array.from({ length: ex.target_sets }).map((_, setIdx) => {
                      const key = `${ex.id}-${setIdx}`
                      const isCompleted = completedSets.includes(key)
                      
                      return (
                        <div key={setIdx} className={`flex gap-4 items-center p-3 rounded-lg border ${isCompleted ? 'bg-green-900/20 border-green-700/50' : 'bg-gray-900 border-gray-700'}`}>
                          <div className="w-8 text-center font-bold text-gray-500">{setIdx + 1}</div>
                          
                          <div className="flex-1">
                            <label className="block text-[10px] text-gray-500 uppercase tracking-wide">Ciężar (kg)</label>
                            <input 
                              type="number" 
                              disabled={isCompleted}
                              placeholder={ghost.weight ? `${ghost.weight} kg` : '-'} 
                              onChange={e => handleInputChange(ex.id, setIdx, 'weight', e.target.value)}
                              className="w-full bg-transparent text-white font-bold text-lg outline-none placeholder-gray-600 disabled:opacity-50"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <label className="block text-[10px] text-gray-500 uppercase tracking-wide">Powt.</label>
                            <input 
                              type="number" 
                              disabled={isCompleted}
                              placeholder={ghost.reps ? `${ghost.reps}` : '-'} 
                              onChange={e => handleInputChange(ex.id, setIdx, 'reps', e.target.value)}
                              className="w-full bg-transparent text-white font-bold text-lg outline-none placeholder-gray-600 disabled:opacity-50"
                            />
                          </div>
                          
                          {/* Przycisk Zapisz / Zrobione */}
                          <button 
                            disabled={isCompleted}
                            onClick={() => saveSet(ex, setIdx)} 
                            className={`px-4 py-3 rounded-lg font-bold transition-colors ${isCompleted ? 'bg-green-600/20 text-green-500' : 'bg-gray-700 text-white hover:bg-pink-600'}`}
                          >
                            {isCompleted ? '✓' : 'Zapisz'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          
          <button onClick={() => { alert("Trening zakończony! Dobra robota!"); setActiveWorkout(null); }} className="w-full mt-10 bg-pink-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-pink-500 shadow-lg shadow-pink-600/30">
            Zakończ Trening 🏁
          </button>
        </div>
      )}
    </div>
  )
}