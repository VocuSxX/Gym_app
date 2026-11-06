import { useState, useEffect, useRef } from 'react'
import { glassCard } from '../ui'
import { toast } from '../notify'
import { toKey, todayStr, calcTarget, waterGoalMl } from '../health'
import { listEntries, deleteEntry, type FoodEntry } from '../api/food'
import { MEALS, sumMacros, macroTargets, type MealKey } from '../nutrition'
import DaySummary from './fridge/DaySummary'
import MacroSuggestions from './fridge/MacroSuggestions'
import MealSection from './fridge/MealSection'
import AddFoodModal from './fridge/AddFoodModal'
import WaterTracker from './WaterTracker'
import Icon from './Icon'

const shiftDay = (key: string, days: number) => {
  const [y, m, d] = key.split('-').map(Number)
  return toKey(new Date(y, m - 1, d + days))
}

const dayLabel = (key: string) => {
  const today = todayStr()
  if (key === today) return 'Dziś'
  if (key === shiftDay(today, -1)) return 'Wczoraj'
  if (key === shiftDay(today, 1)) return 'Jutro'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Lodówka: dziennik posiłków, makroskładniki, woda
export default function Fridge({ session, profile }: { session: any; profile: any }) {
  const [date, setDate] = useState(todayStr())
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [adding, setAdding] = useState<MealKey | null>(null)
  const userId = session.user.id
  const dateInput = useRef<HTMLInputElement>(null)

  const load = async () => setEntries(await listEntries(userId, date))
  useEffect(() => { load() }, [date, session])

  const remove = async (id: string) => {
    if (!(await deleteEntry(id))) return toast.error('Nie udało się usunąć wpisu.')
    load()
  }

  const total = sumMacros(entries)
  const target = macroTargets(calcTarget(profile), profile?.weight_kg ? Number(profile.weight_kg) : null)
  const isToday = date === todayStr()

  return (
    <div className="max-w-3xl w-full flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Lodówka</h1>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setDate(shiftDay(date, -1))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition-[background-color,color,transform] duration-150 hover:bg-zinc-800 hover:text-white active:scale-[.97]" aria-label="Poprzedni dzień"><Icon name="chevron-left" size={20} /></button>
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => { try { dateInput.current?.showPicker() } catch { dateInput.current?.focus() } }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-lg font-extrabold capitalize text-white transition-[background-color,transform] duration-150 hover:bg-zinc-900 active:scale-[.97]"
            aria-label="Wybierz dzień z kalendarza"
          >
            <Icon name="calendar" size={18} className="text-zinc-500" />
            {dayLabel(date)}
          </button>
          <input
            ref={dateInput}
            type="date"
            value={date}
            onChange={e => e.target.value && setDate(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0"
          />
          {!isToday && <button type="button" onClick={() => setDate(todayStr())} className="text-xs font-semibold text-accent-400 hover:underline">Wróć do dziś</button>}
        </div>
        <button type="button" onClick={() => setDate(shiftDay(date, 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition-[background-color,color,transform] duration-150 hover:bg-zinc-800 hover:text-white active:scale-[.97]" aria-label="Następny dzień"><Icon name="chevron-right" size={20} /></button>
      </div>

      <div className={glassCard}>
        <DaySummary total={total} target={target} />
      </div>

      {isToday && target && (
        <MacroSuggestions
          userId={userId}
          remaining={{ kcal: target.kcal - total.kcal, protein: target.protein - total.protein, carbs: target.carbs - total.carbs, fat: target.fat - total.fat }}
          onAdded={load}
        />
      )}

      {MEALS.map(meal => (
        <MealSection key={meal.key} meal={meal} entries={entries.filter(e => e.meal_type === meal.key)} onAdd={() => setAdding(meal.key)} onDelete={remove} />
      ))}

      {isToday && <WaterTracker session={session} goalMl={waterGoalMl(profile)} />}

      {adding && <AddFoodModal userId={userId} meal={adding} date={date} onClose={() => setAdding(null)} onAdded={load} />}
    </div>
  )
}
