// Przypomnienia działające, gdy aplikacja jest otwarta (powiadomienie przeglądarki lub toast)
import { useEffect } from 'react'
import { supabase } from './supabaseClient'
import { toast } from './notify'
import { todayStr } from './health'

export type Reminders = {
  workout: { on: boolean; time: string }
  water: { on: boolean; every: number }
  meals: { on: boolean; time: string }
}

export const defaultReminders: Reminders = {
  workout: { on: false, time: '18:00' },
  water: { on: false, every: 120 },
  meals: { on: false, time: '20:00' },
}

const read = (key: string) => { try { return localStorage.getItem(key) } catch { return null } }
const write = (key: string, value: string) => { try { localStorage.setItem(key, value) } catch { /* brak storage */ } }

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function notify(title: string, body: string) {
  if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body })
  } else {
    toast.info(`${title} ${body}`)
  }
}

export function useReminders(userId: string | undefined, enabled: boolean, reminders: Partial<Reminders> | undefined) {
  useEffect(() => {
    if (!userId || !enabled || !reminders) return
    const rem: Reminders = { ...defaultReminders, ...reminders }
    if (!rem.workout.on && !rem.water.on && !rem.meals.on) return

    // Przypomnienie o wodzie nie ma wystrzelić zaraz po załadowaniu strony
    if (rem.water.on && !read('rem_water_last')) write('rem_water_last', String(Date.now()))

    const tick = async () => {
      const now = new Date()
      const minutes = now.getHours() * 60 + now.getMinutes()
      const day = todayStr()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

      // Przypomnienia stałogodzinowe działają w oknie 90 minut od ustawionej godziny i tylko raz dziennie
      const due = (kind: 'workout' | 'meals', time: string) => {
        const start = toMinutes(time)
        return minutes >= start && minutes < start + 90 && read(`rem_${kind}_${day}`) !== '1'
      }

      if (rem.workout.on && due('workout', rem.workout.time)) {
        write(`rem_workout_${day}`, '1')
        const { count } = await supabase.from('exercise_logs').select('id', { count: 'exact', head: true }).eq('client_id', userId).eq('is_completed', true).gte('logged_at', startOfDay)
        if (!count) notify('Czas na trening', 'Dziś jeszcze nie ma zapisanej serii.')
      }

      if (rem.meals.on && due('meals', rem.meals.time)) {
        write(`rem_meals_${day}`, '1')
        const { count } = await supabase.from('food_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('entry_date', day)
        if ((count || 0) < 3) notify('Dziennik posiłków', 'Uzupełnij dzisiejsze posiłki w Lodówce.')
      }

      if (rem.water.on && now.getHours() >= 8 && now.getHours() < 21) {
        const last = Number(read('rem_water_last')) || 0
        if (Date.now() - last >= rem.water.every * 60000) {
          write('rem_water_last', String(Date.now()))
          notify('Czas na wodę', 'Wypij szklankę wody.')
        }
      }
    }

    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [userId, enabled, JSON.stringify(reminders)])
}
