import { useState, useEffect } from 'react'
import { glassCard, btnPrimarySm } from '../ui'
import { todayStr, calcTarget } from '../health'
import { listEntries } from '../api/food'
import { sumMacros, macroTargets, type Macros } from '../nutrition'
import DaySummary from './fridge/DaySummary'

// Kafelek na stronie głównej: dzisiejsze kalorie i makro + przejście do Lodówki
export default function FridgeCard({ session, profile, onOpen, refreshKey = 0 }: { session: any; profile: any; onOpen: () => void; refreshKey?: number }) {
  const [total, setTotal] = useState<Macros>({ kcal: 0, protein: 0, carbs: 0, fat: 0 })

  useEffect(() => {
    listEntries(session.user.id, todayStr()).then(rows => setTotal(sumMacros(rows)))
  }, [session, refreshKey])

  const target = macroTargets(calcTarget(profile), profile?.weight_kg ? Number(profile.weight_kg) : null)

  return (
    <div className={`${glassCard} flex flex-col gap-5`}>
      <h3 className="text-xl font-bold text-white">Lodówka</h3>
      <DaySummary total={total} target={target} />
      <button type="button" onClick={onOpen} className={btnPrimarySm}>Otwórz dziennik posiłków</button>
    </div>
  )
}
