// Check-in przez QR: kod prowadzi na /dashboard?checkin=<id siłowni>.
// Id zapamiętujemy zaraz po załadowaniu (przed ewentualnym przekierowaniem na logowanie),
// a zameldowanie wykonujemy, gdy użytkownik jest już zalogowany.
import { supabase } from './supabaseClient'

const KEY = 'pendingGymCheckin'

export function capturePendingCheckin() {
  try {
    const id = new URLSearchParams(window.location.search).get('checkin')
    if (id) {
      localStorage.setItem(KEY, id)
      window.history.replaceState({}, '', window.location.pathname)
    }
  } catch { /* brak dostępu do storage */ }
}

export function takePendingCheckin(): string | null {
  try {
    const id = localStorage.getItem(KEY)
    if (id) localStorage.removeItem(KEY)
    return id
  } catch {
    return null
  }
}

export const checkinUrl = (gymId: string) => `${window.location.origin}/dashboard?checkin=${gymId}`

export const CHECKIN_MESSAGES: Record<string, { type: 'success' | 'error' | 'info'; text: string }> = {
  ok: { type: 'success', text: 'Zameldowano na siłowni. Miłego treningu.' },
  already: { type: 'info', text: 'Dziś już jesteś zameldowany.' },
  not_member: { type: 'error', text: 'Najpierw dołącz do tej siłowni w zakładce „Moja Siłownia".' },
  no_gym: { type: 'error', text: 'Nie znaleziono takiej siłowni. Zeskanuj kod jeszcze raz.' },
  no_auth: { type: 'error', text: 'Zaloguj się, aby się zameldować.' },
}

export async function runGymCheckin(gymId: string): Promise<string> {
  const { data, error } = await supabase.rpc('gym_checkin', { g: gymId })
  if (error || typeof data !== 'string') return 'error'
  return data
}
