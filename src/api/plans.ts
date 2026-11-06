// Tworzenie planu treningowego z gotowej struktury (szablon). Ta sama logika co w kreatorze planów.
import { supabase } from '../supabaseClient'

export type TemplateExercise = { name: string; sets: number; reps: string; rir: string; image_url?: string }
export type TemplateDay = { name: string; exercises: TemplateExercise[] }
export type TemplateData = { days: TemplateDay[] }

export async function createPlanFromTemplate(opts: {
  name: string
  days: TemplateDay[]
  clientId: string
  trainerId: string | null // null: plan własny zwykłego użytkownika
  isSelf: boolean
}): Promise<boolean> {
  // Nowy plan zastępuje poprzedni aktywny plan tej osoby
  await supabase.from('workout_plans').update({ status: 'archived' }).eq('client_id', opts.clientId).eq('status', 'active')

  const { data: plan, error } = await supabase
    .from('workout_plans')
    .insert({ trainer_id: opts.trainerId, client_id: opts.clientId, name: opts.name, is_self_made: opts.isSelf })
    .select()
    .single()
  if (error || !plan) return false

  for (let i = 0; i < opts.days.length; i++) {
    const day = opts.days[i]
    const { data: dayRow } = await supabase
      .from('workouts')
      .insert({ plan_id: plan.id, name: day.name, order_index: i })
      .select()
      .single()
    if (dayRow && day.exercises.length > 0) {
      await supabase.from('workout_exercises').insert(
        day.exercises.map((ex, idx) => ({
          workout_id: dayRow.id,
          name: ex.name,
          target_sets: ex.sets,
          target_reps: ex.reps,
          rir: ex.rir,
          order_index: idx,
          image_url: ex.image_url || '',
        })),
      )
    }
  }
  return true
}
