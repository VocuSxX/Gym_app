import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function WorkoutBuilder({ session }: { session: any }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Dane z bazy
  const [activeClients, setActiveClients] = useState<any[]>([])
  const [exercisesDb, setExercisesDb] = useState<any[]>([])

  // Stan Kreatora
  const [planName, setPlanName] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [days, setDays] = useState<{ id: string, name: string, exercises: any[] }[]>([])
  
  // Pomocnicze do Kroku 2
  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  
  const WEEKDAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

  useEffect(() => {
    // Pobieramy aktywnych podopiecznych (do Kroku 3)
    const fetchClients = async () => {
      const { data } = await supabase.from('trainer_clients').select(`client:profiles!client_id(id, nickname)`).eq('trainer_id', session.user.id).eq('status', 'active')
      if (data) setActiveClients(data)
    }
    // Pobieramy Słownik Ćwiczeń (do Kroku 2)
    const fetchExercises = async () => {
      const { data } = await supabase.from('exercises').select('*').order('name')
      if (data) setExercisesDb(data)
    }
    fetchClients()
    fetchExercises()
  }, [session])

  // --- LOGIKA KROKU 1: Wybór Dni ---
  const toggleDay = (dayName: string) => {
    const exists = days.find(d => d.name === dayName)
    if (exists) {
      setDays(days.filter(d => d.name !== dayName))
    } else {
      setDays([...days, { id: Math.random().toString(), name: dayName, exercises: [] }])
    }
  }

  // --- LOGIKA KROKU 2: Ćwiczenia ---
  const addExerciseToDay = (dayId: string, exerciseDb: any) => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          exercises: [...d.exercises, { 
            id: Math.random().toString(), 
            db_id: exerciseDb.id, 
            name: exerciseDb.name, 
            image_url: exerciseDb.image_url || '',
            sets: 3, 
            reps: '10', 
            rir: '2' 
          }]
        }
      }
      return d
    }))
  }

  const updateExercise = (dayId: string, exId: string, field: string, value: any) => {
    setDays(days.map(d => d.id === dayId ? {
      ...d, exercises: d.exercises.map(ex => ex.id === exId ? { ...ex, [field]: value } : ex)
    } : d))
  }

  const moveExercise = (dayId: string, index: number, direction: 'up' | 'down') => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        const newExercises = [...d.exercises]
        if (direction === 'up' && index > 0) {
          [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]]
        } else if (direction === 'down' && index < newExercises.length - 1) {
          [newExercises[index + 1], newExercises[index]] = [newExercises[index], newExercises[index + 1]]
        }
        return { ...d, exercises: newExercises }
      }
      return d
    }))
  }

  const removeExercise = (dayId: string, exId: string) => {
    setDays(days.map(d => d.id === dayId ? {
      ...d, exercises: d.exercises.filter(ex => ex.id !== exId)
    } : d))
  }

  // --- ZAPIS DO BAZY ---
  const handleSavePlan = async () => {
    if (!selectedClientId) return alert("Wybierz podopiecznego z listy!")
    setSaving(true)

    const { data: planData, error: planError } = await supabase
      .from('workout_plans')
      .insert({ trainer_id: session.user.id, client_id: selectedClientId, name: planName })
      .select().single()

    if (planError) return alert("Błąd zapisu planu!")

    for (let i = 0; i < days.length; i++) {
      const day = days[i]
      const { data: dayData } = await supabase
        .from('workouts')
        .insert({ plan_id: planData.id, name: day.name, order_index: i })
        .select().single()

      if (dayData && day.exercises.length > 0) {
        const exercisesToInsert = day.exercises.map((ex, exIdx) => ({
          workout_id: dayData.id,
          name: ex.name,
          target_sets: ex.sets,
          target_reps: ex.reps,
          rir: ex.rir,
          order_index: exIdx,
          image_url: ex.image_url || ''
        }))
        await supabase.from('workout_exercises').insert(exercisesToInsert)
      }
    }

    alert("🔥 Plan przypisany pomyślnie!")
    setStep(1)
    setPlanName('')
    setDays([])
    setSelectedClientId('')
    setSaving(false)
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* WSKAŹNIK POSTĘPU (STEPPER) */}
      <div className="flex justify-center mb-10">
        <div className="flex gap-4 items-center">
          <div className={`w-12 h-4 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
          <div className={`w-12 h-4 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
          <div className={`w-12 h-4 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
        </div>
      </div>

      <div className="bg-zinc-800 p-8 rounded-3xl border border-zinc-700/50 shadow-xl">
        
        {/* ================================== KROK 1 ================================== */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-6">Krok 1: Podstawy planu</h1>
            <div className="mb-8">
              <label className="block text-zinc-400 mb-2 font-bold">Nazwa Planu Treningowego</label>
              <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-600 text-white outline-none focus:border-emerald-500 text-lg" placeholder="np. Hipertrofia - Blok A" />
            </div>

            <label className="block text-zinc-400 mb-4 font-bold">Wybierz dni treningowe (etykiety)</label>
            <div className="flex flex-wrap gap-3 mb-8">
              {WEEKDAYS.map(day => {
                const isSelected = days.find(d => d.name === day)
                return (
                  <button key={day} onClick={() => toggleDay(day)} className={`px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}>
                    {day} {isSelected && '✓'}
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end">
              <button onClick={() => {
                if(!planName) return alert("Podaj nazwę planu!")
                if(days.length === 0) return alert("Wybierz chociaż jeden dzień!")
                setActiveDayId(days[0].id)
                setStep(2)
              }} className="bg-white text-zinc-900 px-8 py-3 rounded-2xl font-bold hover:bg-zinc-200 active:scale-95 transition-all">
                Dalej ➔
              </button>
            </div>
          </div>
        )}

        {/* ================================== KROK 2 ================================== */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-6">Krok 2: Programowanie ćwiczeń</h1>
            
            {/* Zakładki dni */}
            <div className="flex gap-2 overflow-x-auto mb-6 border-b border-zinc-700 pb-2">
              {days.map(day => (
                <button key={day.id} onClick={() => setActiveDayId(day.id)} className={`px-4 py-2 rounded-t-2xl font-bold whitespace-nowrap transition-colors ${activeDayId === day.id ? 'bg-zinc-700 text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-400 hover:bg-zinc-700/50'}`}>
                  {day.name}
                </button>
              ))}
            </div>

            {/* Aktywny dzień */}
            {days.map(day => day.id === activeDayId && (
              <div key={day.id} className="space-y-4">
                
                {day.exercises.map((ex, index) => (
                  <div key={ex.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-700">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex flex-col gap-1 mr-2">
                        <button onClick={() => moveExercise(day.id, index, 'up')} disabled={index === 0} className="text-zinc-500 hover:text-white disabled:opacity-30">⬆️</button>
                        <button onClick={() => moveExercise(day.id, index, 'down')} disabled={index === day.exercises.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30">⬇️</button>
                      </div>
                      
                      {ex.image_url && (
                        <img src={ex.image_url} alt={ex.name} className="w-14 h-14 rounded-xl object-cover border border-zinc-600" />
                      )}
                      
                      <div className="flex-1 w-full">
                        <p className="font-bold text-lg text-white">{ex.name}</p>
                      </div>
                      
                      <div className="flex gap-4 w-full md:w-auto">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1 text-center">Serie</label>
                          <input type="number" min="1" value={ex.sets} onChange={e => updateExercise(day.id, ex.id, 'sets', e.target.value)} className="w-16 p-2 rounded-xl bg-zinc-800 text-center outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1 text-center">Powt.</label>
                          <input type="text" value={ex.reps} onChange={e => updateExercise(day.id, ex.id, 'reps', e.target.value)} className="w-20 p-2 rounded-xl bg-zinc-800 text-center outline-none focus:ring-1 focus:ring-emerald-500" placeholder="np. 8-12" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1 text-center">RIR</label>
                          <input type="text" value={ex.rir} onChange={e => updateExercise(day.id, ex.id, 'rir', e.target.value)} className="w-16 p-2 rounded-xl bg-zinc-800 text-center outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <button onClick={() => removeExercise(day.id, ex.id)} className="text-red-400 hover:text-red-300 ml-2 mt-5">❌</button>
                      </div>
                    </div>
                    
                    {/* POLE NA LINK DO GIF-A / OBRAZKA */}
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <label className="block text-xs text-zinc-500 mb-1">🖼️ Link do GIF-a / obrazka (technika)</label>
                      <input
                        type="url"
                        value={ex.image_url || ''}
                        onChange={e => updateExercise(day.id, ex.id, 'image_url', e.target.value)}
                        placeholder="https://media.giphy.com/... lub link do obrazka"
                        className="w-full p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white outline-none focus:border-emerald-500 placeholder-zinc-600"
                      />
                      {ex.image_url && (
                        <div className="mt-2">
                          <img src={ex.image_url} alt="Podgląd" className="h-24 rounded-xl object-cover border border-zinc-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Słownik - Dodawanie ćwiczenia */}
                <div className="mt-6 bg-zinc-900/50 p-4 rounded-2xl border border-dashed border-zinc-600">
                  <label className="block text-zinc-400 mb-2 font-bold">Dodaj ćwiczenie z bazy:</label>
                  <select onChange={e => {
                    const selectedEx = exercisesDb.find(dbEx => dbEx.id === e.target.value)
                    if (selectedEx) addExerciseToDay(day.id, selectedEx)
                    e.target.value = "" // reset selecta
                  }} className="w-full p-3 rounded-2xl bg-zinc-800 border border-zinc-600 text-white outline-none focus:border-emerald-500">
                    <option value="">+ Wybierz ćwiczenie...</option>
                    {exercisesDb.map(dbEx => (
                      <option key={dbEx.id} value={dbEx.id}>{dbEx.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            <div className="flex justify-between mt-10">
              <button onClick={() => setStep(1)} className="text-zinc-400 hover:text-white px-6 py-2">⬅ Wstecz</button>
              <button onClick={() => setStep(3)} className="bg-white text-zinc-900 px-8 py-3 rounded-2xl font-bold hover:bg-zinc-200 active:scale-95 transition-all">Podsumowanie ➔</button>
            </div>
          </div>
        )}

        {/* ================================== KROK 3 ================================== */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Krok 3: Przypisanie Planu</h1>
            <p className="text-zinc-400 mb-8">Sprawdź strukturę i wybierz podopiecznego.</p>
            
            <div className="bg-zinc-900 p-6 rounded-2xl border border-emerald-500/30 mb-8">
              <h2 className="text-2xl font-bold text-emerald-400 mb-4">{planName}</h2>
              <div className="space-y-6">
                {days.map(day => (
                  <div key={day.id}>
                    <h3 className="font-bold text-lg text-white border-b border-zinc-700 pb-1 mb-2">{day.name}</h3>
                    {day.exercises.length === 0 ? <p className="text-zinc-500 text-sm italic">Brak ćwiczeń</p> : (
                      <ul className="space-y-2">
                        {day.exercises.map((ex, idx) => (
                          <li key={idx} className="text-zinc-300 flex items-center gap-3">
                            {ex.image_url && <img src={ex.image_url} alt={ex.name} className="w-10 h-10 rounded-lg object-cover border border-zinc-600" />}
                            <span className="flex-1">{idx+1}. {ex.name}</span>
                            <span className="text-zinc-500">{ex.sets} serie | {ex.reps} powt | RIR: {ex.rir}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-xl font-bold text-white mb-4">Wybierz ucznia docelowego:</label>
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-600 text-white outline-none focus:border-emerald-500 text-lg">
                <option value="">-- Wybierz podopiecznego --</option>
                {activeClients.map(c => (
                  <option key={c.client.id} value={c.client.id}>@{c.client.nickname}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between mt-10">
              <button onClick={() => setStep(2)} className="text-zinc-400 hover:text-white px-6 py-2">⬅ Wróć do edycji</button>
              <button onClick={handleSavePlan} disabled={saving} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 text-lg disabled:opacity-50 active:scale-95 transition-all">
                {saving ? 'Wysyłanie na serwer...' : '🚀 Zatwierdź i Wyślij Plan!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}