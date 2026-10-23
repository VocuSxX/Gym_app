import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimary, btnGhost, btnDisabled, inputBase } from '../ui'

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
  const STEP_LABELS = ['Podstawy', 'Ćwiczenia', 'Przypisanie']

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
    <div className="max-w-5xl mx-auto w-full pb-20 flex flex-col gap-8">

      {/* STEPPER: gruby pasek postępu w stylu Duolingo */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-4 flex-1 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 transition-all duration-500 ${step >= n ? 'w-full' : 'w-0'}`} />
            </div>
          ))}
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          Krok {step} z 3 · <span className="text-emerald-400">{STEP_LABELS[step - 1]}</span>
        </p>
      </div>

      <div className={`${glassCard} p-8 flex flex-col gap-8`}>

        {/* ================================== KROK 1 ================================== */}
        {step === 1 && (
          <div className="animate-fade-in flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">Podstawy planu</h1>
              <p className="text-zinc-400">Nazwij plan i wybierz dni treningowe.</p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="font-bold text-white">Nazwa Planu Treningowego</label>
              <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} className={`${inputBase} text-lg`} placeholder="np. Hipertrofia - Blok A" />
            </div>

            <div className="flex flex-col gap-4">
              <label className="font-bold text-white">Dni treningowe</label>
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map(day => {
                  const isSelected = days.find(d => d.name === day)
                  return (
                    <button key={day} onClick={() => toggleDay(day)} className={`px-6 py-3 rounded-2xl font-bold border transition-all duration-200 hover:-translate-y-1 active:translate-y-1 active:scale-95 ${isSelected ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/25' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
                      {day} {isSelected && '✓'}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => {
                if(!planName) return alert("Podaj nazwę planu!")
                if(days.length === 0) return alert("Wybierz chociaż jeden dzień!")
                setActiveDayId(days[0].id)
                setStep(2)
              }} className={btnPrimary}>
                Dalej ➔
              </button>
            </div>
          </div>
        )}



        {/* ================================== KROK 2 ================================== */}
        {step === 2 && (
          <div className="animate-fade-in flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">Programowanie ćwiczeń</h1>
              <p className="text-zinc-400">Dodaj ćwiczenia, ustaw serie i wklej link do GIF-a z techniką.</p>
            </div>

            {/* Zakładki dni (pigułki) */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {days.map(day => (
                <button key={day.id} onClick={() => setActiveDayId(day.id)} className={`px-5 py-3 rounded-2xl font-bold whitespace-nowrap border transition-all duration-200 active:scale-95 ${activeDayId === day.id ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
                  {day.name}
                  <span className="ml-2 rounded-full bg-black/30 px-2 py-0.5 text-xs">{day.exercises.length}</span>
                </button>
              ))}
            </div>

            {/* Aktywny dzień */}
            {days.map(day => day.id === activeDayId && (
              <div key={day.id} className="flex flex-col gap-6">

                {day.exercises.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-center text-zinc-400">
                    Ten dzień jest pusty. Dodaj pierwsze ćwiczenie poniżej.
                  </div>
                )}

                {day.exercises.map((ex, index) => (
                  <div key={ex.id} className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-6 md:items-center">
                      <div className="flex md:flex-col gap-2">
                        <button onClick={() => moveExercise(day.id, index, 'up')} disabled={index === 0} className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-zinc-400 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none">⬆️</button>
                        <button onClick={() => moveExercise(day.id, index, 'down')} disabled={index === day.exercises.length - 1} className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-zinc-400 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none">⬇️</button>
                      </div>

                      {ex.image_url && (
                        <img src={ex.image_url} alt={ex.name} className="h-16 w-16 rounded-2xl object-cover border border-white/10 shadow-lg" />
                      )}

                      <div className="flex-1">
                        <p className="text-xl font-bold text-white">{ex.name}</p>
                        <p className="text-sm text-zinc-400">Ćwiczenie {index + 1} z {day.exercises.length}</p>
                      </div>

                      <div className="flex gap-4 items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 text-center">Serie</label>
                          <input type="number" min="1" value={ex.sets} onChange={e => updateExercise(day.id, ex.id, 'sets', e.target.value)} className={`${inputBase} !w-20 text-center !px-2`} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 text-center">Powt.</label>
                          <input type="text" value={ex.reps} onChange={e => updateExercise(day.id, ex.id, 'reps', e.target.value)} className={`${inputBase} !w-24 text-center !px-2`} placeholder="8-12" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 text-center">RIR</label>
                          <input type="text" value={ex.rir} onChange={e => updateExercise(day.id, ex.id, 'rir', e.target.value)} className={`${inputBase} !w-20 text-center !px-2`} />
                        </div>
                        <button onClick={() => removeExercise(day.id, ex.id)} className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 transition-all duration-200 hover:bg-red-500/20 active:scale-95">✕</button>
                      </div>
                    </div>


                    {/* LINK DO GIF-A / OBRAZKA */}
                    <div className="flex flex-col gap-3 rounded-2xl bg-black/20 border border-white/5 p-4">
                      <label className="text-sm font-bold text-white">🖼️ Link do GIF-a / obrazka (technika)</label>
                      <input
                        type="url"
                        value={ex.image_url || ''}
                        onChange={e => updateExercise(day.id, ex.id, 'image_url', e.target.value)}
                        placeholder="https://media.giphy.com/... lub link do obrazka"
                        className={inputBase}
                      />
                      {ex.image_url && (
                        <img src={ex.image_url} alt="Podgląd" className="h-28 w-fit rounded-2xl object-cover border border-white/10" />
                      )}
                    </div>
                  </div>
                ))}

                {/* Słownik - Dodawanie ćwiczenia */}
                <div className="rounded-3xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-6 flex flex-col gap-3">
                  <label className="font-bold text-white">Dodaj ćwiczenie z bazy</label>
                  <select onChange={e => {
                    const selectedEx = exercisesDb.find(dbEx => dbEx.id === e.target.value)
                    if (selectedEx) addExerciseToDay(day.id, selectedEx)
                    e.target.value = "" // reset selecta
                  }} className={inputBase}>
                    <option value="">+ Wybierz ćwiczenie...</option>
                    {exercisesDb.map(dbEx => (
                      <option key={dbEx.id} value={dbEx.id}>{dbEx.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center">
              <button onClick={() => setStep(1)} className={btnGhost}>⬅ Wstecz</button>
              <button onClick={() => setStep(3)} className={btnPrimary}>Podsumowanie ➔</button>
            </div>
          </div>
        )}

        {/* ================================== KROK 3 ================================== */}
        {step === 3 && (
          <div className="animate-fade-in flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">Przypisanie planu</h1>
              <p className="text-zinc-400">Sprawdź strukturę i wybierz podopiecznego.</p>
            </div>

            <div className="rounded-3xl bg-black/30 border border-emerald-500/20 p-6 flex flex-col gap-6">
              <h2 className="text-2xl font-extrabold text-white">{planName}</h2>
              <div className="flex flex-col gap-6">
                {days.map(day => (
                  <div key={day.id} className="flex flex-col gap-3">
                    <h3 className="font-bold text-emerald-400 uppercase tracking-widest text-sm">{day.name}</h3>
                    {day.exercises.length === 0 ? <p className="text-zinc-400 text-sm italic">Brak ćwiczeń</p> : (
                      <ul className="flex flex-col gap-3">
                        {day.exercises.map((ex, idx) => (
                          <li key={idx} className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 p-3">
                            {ex.image_url && <img src={ex.image_url} alt={ex.name} className="h-12 w-12 rounded-xl object-cover border border-white/10" />}
                            <span className="flex-1 font-semibold text-white">{idx + 1}. {ex.name}</span>
                            <span className="text-sm text-zinc-400">{ex.sets} serie · {ex.reps} powt · RIR {ex.rir}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xl font-bold text-white">Wybierz ucznia docelowego</label>
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className={`${inputBase} text-lg`}>
                <option value="">-- Wybierz podopiecznego --</option>
                {activeClients.map(c => (
                  <option key={c.client.id} value={c.client.id}>@{c.client.nickname}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep(2)} className={btnGhost}>⬅ Wróć do edycji</button>
              <button onClick={handleSavePlan} disabled={saving} className={`${btnPrimary} ${btnDisabled}`}>
                {saving ? 'Wysyłanie na serwer...' : '🚀 Zatwierdź i Wyślij Plan!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


