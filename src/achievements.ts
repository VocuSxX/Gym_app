// Seria treningowa, rekordy i odznaki
import { supabase } from './supabaseClient'
import { toast } from './notify'
import { todayStr } from './health'

export type BadgeDef = { key: string; icon: string; title: string; desc: string }

export const BADGES: BadgeDef[] = [
  { key: 'first_set', icon: 'check', title: 'Pierwszy krok', desc: 'Zapisz pierwszą serię w dzienniku.' },
  { key: 'sets_100', icon: 'dumbbell', title: '100 serii', desc: 'Wykonaj łącznie 100 serii.' },
  { key: 'sets_500', icon: 'layers', title: '500 serii', desc: 'Wykonaj łącznie 500 serii.' },
  { key: 'days_10', icon: 'calendar', title: '10 dni treningowych', desc: 'Trenuj w 10 różnych dni.' },
  { key: 'days_50', icon: 'calendar', title: '50 dni treningowych', desc: 'Trenuj w 50 różnych dni.' },
  { key: 'week_2', icon: 'flame', title: '2 tygodnie z celem', desc: 'Wykonaj cel tygodniowy 2 tygodnie z rzędu.' },
  { key: 'week_4', icon: 'bolt', title: 'Miesiąc regularności', desc: 'Wykonaj cel tygodniowy 4 tygodnie z rzędu.' },
  { key: 'week_12', icon: 'crown', title: 'Kwartał regularności', desc: 'Wykonaj cel tygodniowy 12 tygodni z rzędu.' },
  { key: 'first_pr', icon: 'trophy', title: 'Pierwszy rekord', desc: 'Pobij swój rekord ciężaru w ćwiczeniu.' },
  { key: 'records_5', icon: 'award', title: 'Kolekcjoner rekordów', desc: 'Miej rekordy w 5 różnych ćwiczeniach.' },
  { key: 'food_7', icon: 'utensils', title: 'Dziennik posiłków', desc: 'Zapisuj posiłki przez 7 różnych dni.' },
  { key: 'checkin_10', icon: 'building', title: 'Stały bywalec', desc: 'Zamelduj się na siłowni 10 razy.' },
  { key: 'friend_1', icon: 'user-plus', title: 'Towarzyski', desc: 'Dodaj pierwszego znajomego.' },
]

const dayNum = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86400000)
}

// Indeks tygodnia (poniedziałek-niedziela) dla numeru dnia. 1970-01-01 to czwartek.
const weekOf = (dayN: number) => Math.floor((dayN + 3) / 7)

// days: daty treningów (YYYY-MM-DD). Cel to liczba dni treningowych w tygodniu.
// current: kolejne tygodnie z wykonanym celem (bieżący tydzień liczy się, gdy cel już zrobiony;
// jeśli jeszcze nie, to liczymy od poprzedniego, żeby trwający tydzień nie przerywał passy).
export function weeklyProgress(days: string[], goal: number, today: string = todayStr()) {
  const perWeek = new Map<number, Set<number>>()
  days.forEach(d => {
    const n = dayNum(d)
    const w = weekOf(n)
    if (!perWeek.has(w)) perWeek.set(w, new Set())
    perWeek.get(w)!.add(n)
  })
  const done = (w: number) => (perWeek.get(w)?.size || 0) >= goal
  const thisWeek = weekOf(dayNum(today))

  let current = 0
  let w = done(thisWeek) ? thisWeek : thisWeek - 1
  while (done(w)) { current++; w-- }

  let best = 0
  let run = 0
  let prev = -Infinity
  for (const wk of [...perWeek.keys()].filter(done).sort((a, b) => a - b)) {
    run = wk === prev + 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = wk
  }
  return { thisWeek: perWeek.get(thisWeek)?.size || 0, current, best }
}

export async function fetchTrainingDays(daysBack = 400): Promise<string[]> {
  const since = new Date()
  since.setDate(since.getDate() - daysBack)
  const key = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, '0')}-${String(since.getDate()).padStart(2, '0')}`
  const { data } = await supabase.rpc('my_training_days', { p_since: key })
  return (data || []) as string[]
}

export type RecordRow = { exercise_name: string; best_weight: number; best_at: string }

export async function fetchRecords(): Promise<RecordRow[]> {
  const { data } = await supabase.rpc('my_records')
  return ((data || []) as any[]).map(r => ({ exercise_name: r.exercise_name, best_weight: Number(r.best_weight), best_at: r.best_at }))
}

export async function fetchOwnedBadges(userId: string): Promise<Record<string, string>> {
  const { data } = await supabase.from('user_badges').select('badge_key, earned_at').eq('user_id', userId)
  const map: Record<string, string> = {}
  ;(data || []).forEach((b: any) => { map[b.badge_key] = b.earned_at })
  return map
}

// Przyznaje odznaki, które wynikają z danych i jeszcze ich nie ma. Zwraca nowo zdobyte.
export async function evaluateBadges(userId: string): Promise<BadgeDef[]> {
  const [owned, days, sets, food, checkins, friends, records, prof] = await Promise.all([
    fetchOwnedBadges(userId),
    fetchTrainingDays(),
    supabase.from('exercise_logs').select('id', { count: 'exact', head: true }).eq('client_id', userId).eq('is_completed', true),
    supabase.from('food_entries').select('entry_date').eq('user_id', userId).order('entry_date', { ascending: false }).limit(500),
    supabase.from('gym_checkins').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('status', 'accepted').or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    fetchRecords(),
    supabase.from('profiles').select('weekly_goal').eq('id', userId).maybeSingle(),
  ])

  const totalSets = sets.count || 0
  const goal = Number(prof.data?.weekly_goal) || 3
  const { best } = weeklyProgress(days, goal)
  const foodDays = new Set((food.data || []).map((e: any) => e.entry_date)).size

  const earned: Record<string, boolean> = {
    first_set: totalSets >= 1,
    sets_100: totalSets >= 100,
    sets_500: totalSets >= 500,
    days_10: days.length >= 10,
    days_50: days.length >= 50,
    week_2: best >= 2,
    week_4: best >= 4,
    week_12: best >= 12,
    records_5: records.length >= 5,
    food_7: foodDays >= 7,
    checkin_10: (checkins.count || 0) >= 10,
    friend_1: (friends.count || 0) >= 1,
  }

  const fresh = BADGES.filter(b => earned[b.key] && !owned[b.key])
  if (fresh.length > 0) {
    await supabase.from('user_badges').insert(fresh.map(b => ({ user_id: userId, badge_key: b.key })))
  }
  return fresh
}

// Odznaka za zdarzenie (np. pierwszy rekord). Zwraca ją tylko, gdy była nowa.
export async function awardBadge(userId: string, key: string): Promise<BadgeDef | null> {
  const { error } = await supabase.from('user_badges').insert({ user_id: userId, badge_key: key })
  if (error) return null
  return BADGES.find(b => b.key === key) || null
}

export function announceBadges(badges: (BadgeDef | null)[]) {
  badges.forEach(b => { if (b) toast.success(`Nowa odznaka: ${b.title}`) })
}
