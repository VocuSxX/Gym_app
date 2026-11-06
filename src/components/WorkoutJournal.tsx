import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { toast } from '../notify'
import { glassCard, btnPrimary, btnPrimarySm } from '../ui'
import { fetchRecords, awardBadge, evaluateBadges, announceBadges } from '../achievements'
import RestTimer from './RestTimer'
import Icon from './Icon'

const REST_KEY = 'restSeconds'

const loadRest = () => {
  try {
    const v = Number(localStorage.getItem(REST_KEY))
    return v >= 15 && v <= 600 ? v : 90
  } catch {
    return 90
  }
}

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

  // Rekordy (najlepszy ciężar na ćwiczenie, klucz: nazwa) i rekordy pobite w tym treningu
  const [bestWeights, setBestWeights] = useState<Record<string, number>>({})
  const [sessionPrs, setSessionPrs] = useState<string[]>([])

  // Timer przerwy
  const [restSeconds, setRestSeconds] = useState(loadRest)
  const [rest, setRest] = useState<{ id: number; seconds: number } | null>(null)
  const closeRest = useCallback(() => setRest(null), [])

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
    setFormInputs({})
    setSessionPrs([])
    setRest(null)

    // Pobieramy historię (Ghost Data) dla wybranego dnia
    const exerciseIds = workout.workout_exercises.map((ex: any) => ex.id)
    const [{ data: logs }, records] = await Promise.all([
      supabase
        .from('exercise_logs')
        .select('workout_exercise_id, weight, reps, logged_at')
        .eq('client_id', session.user.id)
        .in('workout_exercise_id', exerciseIds)
        .order('logged_at', { ascending: false }),
      fetchRecords(),
    ])

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

    const best: Record<string, number> = {}
    records.forEach(r => { best[r.exercise_name] = r.best_weight })
    setBestWeights(best)
  }

  const handleInputChange = (exerciseId: string, setIndex: number, field: string, value: string) => {
    const key = `${exerciseId}-${setIndex}`
    setFormInputs({
      ...formInputs,
      [key]: { ...formInputs[key], [field]: value }
    })
  }

  // Kopiuje wartości poprzedniej serii (wpisane lub zapisane), a gdy ich nie ma - ostatni wynik z historii
  const copyPrevious = (exercise: any, setIndex: number) => {
    const prev = formInputs[`${exercise.id}-${setIndex - 1}`]
    const ghost = ghostData[exercise.id]
    const weight = prev?.weight || (ghost?.weight ? String(ghost.weight) : '')
    const reps = prev?.reps || (ghost?.reps ? String(ghost.reps) : '')
    if (!weight && !reps) return
    setFormInputs({ ...formInputs, [`${exercise.id}-${setIndex}`]: { weight, reps } })
  }

  const saveSet = async (exercise: any, setIndex: number) => {
    const key = `${exercise.id}-${setIndex}`
    const input = formInputs[key] || {}
    const ghost = ghostData[exercise.id] || { weight: 0, reps: 0 }

    // GENIALNA LOGIKA: Jeśli user nic nie wpisał, system bierze "Ghost Data"!
    const finalWeight = input.weight ? parseFloat(input.weight) : ghost.weight
    const finalReps = input.reps ? parseInt(input.reps) : ghost.reps

    if (!finalWeight && !finalReps) {
      return toast.error('Wpisz ciężar i powtórzenia.')
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

    if (error) return toast.error('Nie udało się zapisać serii.')

    // Oznaczamy jako "Zrobione" na zielono i zapamiętujemy wartości (do kopiowania)
    const newCompleted = [...completedSets, key]
    setCompletedSets(newCompleted)
    setFormInputs({ ...formInputs, [key]: { weight: String(finalWeight ?? ''), reps: String(finalReps ?? '') } })

    // Aktualizujemy Ghost Data "w locie" - żeby kolejna seria od razu podpowiadała nowy ciężar!
    setGhostData({
      ...ghostData,
      [exercise.id]: { weight: finalWeight, reps: finalReps }
    })

    // Rekord: tylko gdy było już jakieś wcześniejsze podejście do tego ćwiczenia
    const previousBest = bestWeights[exercise.name]
    if (finalWeight > 0 && (previousBest === undefined || finalWeight > previousBest)) {
      setBestWeights({ ...bestWeights, [exercise.name]: finalWeight })
      if (previousBest !== undefined) {
        toast.success(`Nowy rekord: ${exercise.name}, ${finalWeight} kg`)
        setSessionPrs(prev => (prev.includes(exercise.name) ? prev : [...prev, exercise.name]))
        awardBadge(session.user.id, 'first_pr').then(b => announceBadges([b]))
      }
    }

    // Przerwa po serii (po ostatniej serii treningu nie ma sensu)
    if (newCompleted.length < totalSets) setRest({ id: Date.now(), seconds: restSeconds })
  }

  const changeRest = (s: number) => {
    setRestSeconds(s)
    try { localStorage.setItem(REST_KEY, String(s)) } catch { /* brak storage */ }
    setRest({ id: Date.now(), seconds: s })
  }

  const finishWorkout = () => {
    toast.success(sessionPrs.length > 0 ? `Trening zakończony. Nowe rekordy: ${sessionPrs.length}` : 'Trening zakończony.')
    evaluateBadges(session.user.id).then(announceBadges)
    setActiveWorkout(null)
    setRest(null)
    setSessionPrs([])
  }

  if (loading) return <p className="font-semibold text-zinc-400 animate-pulse">Ładowanie...</p>

  if (!activePlan) {
    return (
      <div className={`${glassCard} flex max-w-xl flex-col items-start gap-3 animate-fade-in`}>
        <Icon name="calendar" size={28} className="text-zinc-500" />
        <h2 className="text-xl font-bold text-white">Brak aktywnego planu</h2>
        <p className="text-zinc-400">Stwórz plan w „Moje Plany” albo poproś trenera o przypisanie.</p>
      </div>
    )
  }

  // Postęp aktualnego treningu
  const totalSets = activeWorkout
    ? activeWorkout.workout_exercises.reduce((sum: number, ex: any) => sum + Number(ex.target_sets), 0)
    : 0
  const progressPct = totalSets > 0 ? Math.round((completedSets.length / totalSets) * 100) : 0

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-20">

      {!activeWorkout ? (
        <div className="flex flex-col gap-8 animate-fade-in">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{activePlan.name}</h1>
            <p className="text-zinc-400">Wybierz dzień treningowy.</p>
          </div>

          <div className="stagger grid grid-cols-1 gap-3 md:grid-cols-2">
            {activePlan.workouts.map((workout: any) => (
              <button
                key={workout.id}
                onClick={() => startWorkout(workout)}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left transition-[background-color,border-color,transform] duration-150 hover:border-accent-400/60 hover:bg-zinc-800 active:scale-[.97]"
              >
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-lg font-bold text-white">{workout.name}</h3>
                  <p className="text-sm text-zinc-400">{workout.workout_exercises.length} ćwiczeń</p>
                </div>
                <Icon name="arrow-right" size={20} className="text-zinc-600 transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-accent-400" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8 animate-fade-in">
          <div className="flex flex-col gap-5">
            <button onClick={() => { setActiveWorkout(null); setRest(null) }} className="flex w-fit items-center gap-2 font-semibold text-zinc-400 transition-colors hover:text-white">
              <Icon name="arrow-left" size={18} />
              Plan
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{activeWorkout.name}</h1>

            <div className="flex flex-col gap-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-accent-500 transition-[width] duration-300" style={{ width: `${progressPct}%`, transitionTimingFunction: 'var(--ease-out)' }} />
              </div>
              <p className="text-sm font-semibold text-zinc-400">{completedSets.length} z {totalSets} serii</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {activeWorkout.workout_exercises.map((ex: any, idx: number) => {
              const ghost = ghostData[ex.id] || { weight: '', reps: '' }

              return (
                <div key={ex.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                  {ex.image_url && (
                    <div className="flex w-full items-center justify-center bg-zinc-950">
                      <img src={ex.image_url} alt={ex.name} className="max-h-64 w-full object-contain" />
                    </div>
                  )}

                  <div className="flex flex-col gap-5 p-5">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xl font-bold text-white">{idx + 1}. {ex.name}</h3>
                      <p className="text-sm text-zinc-400">{ex.target_sets} × {ex.target_reps} · RIR {ex.rir}</p>
                      {bestWeights[ex.name] ? (
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-400">
                          <Icon name="trophy" size={14} />
                          Rekord {bestWeights[ex.name]} kg
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                      {Array.from({ length: ex.target_sets }).map((_, setIdx) => {
                        const key = `${ex.id}-${setIdx}`
                        const isCompleted = completedSets.includes(key)
                        const values = formInputs[key] || {}

                        return (
                          <div key={setIdx} className={`flex items-center gap-3 rounded-xl p-3 transition-colors duration-200 ${isCompleted ? 'bg-accent-500/10 anim-confirm' : 'bg-zinc-950'}`}>
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold transition-colors duration-200 ${isCompleted ? 'bg-accent-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                              {isCompleted ? <Icon name="check" size={18} /> : setIdx + 1}
                            </div>

                            <label className="flex flex-1 flex-col gap-0.5">
                              <span className="text-xs text-zinc-500">kg</span>
                              <input
                                type="number"
                                disabled={isCompleted}
                                value={values.weight ?? ''}
                                placeholder={ghost.weight ? `${ghost.weight}` : '0'}
                                onChange={e => handleInputChange(ex.id, setIdx, 'weight', e.target.value)}
                                className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder-zinc-600 disabled:opacity-60"
                              />
                            </label>

                            <label className="flex flex-1 flex-col gap-0.5">
                              <span className="text-xs text-zinc-500">powt.</span>
                              <input
                                type="number"
                                disabled={isCompleted}
                                value={values.reps ?? ''}
                                placeholder={ghost.reps ? `${ghost.reps}` : '0'}
                                onChange={e => handleInputChange(ex.id, setIdx, 'reps', e.target.value)}
                                className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder-zinc-600 disabled:opacity-60"
                              />
                            </label>

                            {!isCompleted && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => copyPrevious(ex, setIdx)}
                                  title="Kopiuj poprzednią serię"
                                  aria-label="Kopiuj poprzednią serię"
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-[background-color,color,transform] duration-150 hover:bg-zinc-800 hover:text-white active:scale-[.97]"
                                >
                                  <Icon name="copy" size={18} />
                                </button>
                                <button onClick={() => saveSet(ex, setIdx)} className={btnPrimarySm}>Zapisz</button>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={finishWorkout} className={`${btnPrimary} w-full`}>
            Zakończ trening
          </button>
        </div>
      )}

      {rest && <RestTimer runId={rest.id} seconds={rest.seconds} onChangeSeconds={changeRest} onClose={closeRest} />}
    </div>
  )
}
