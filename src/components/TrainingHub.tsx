import { useState } from 'react'
import Tabs from './Tabs'
import WorkoutJournal from './WorkoutJournal'
import WorkoutBuilder from './WorkoutBuilder'
import PlanTemplates from './PlanTemplates'

const TABS = [
  { key: 'today', label: 'Dziennik' },
  { key: 'plans', label: 'Plany' },
  { key: 'templates', label: 'Szablony' },
]

// Trening: dziennik, kreator planów i szablony w jednym miejscu
export default function TrainingHub({ session, profile, initial }: { session: any; profile: any; initial?: string }) {
  const [tab, setTab] = useState(initial && TABS.some(t => t.key === initial) ? initial : 'today')
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Trening</h1>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>
      <div key={tab} className="animate-fade-in">
        {tab === 'today' && <WorkoutJournal session={session} />}
        {tab === 'plans' && <WorkoutBuilder session={session} profile={profile} />}
        {tab === 'templates' && <PlanTemplates session={session} profile={profile} />}
      </div>
    </div>
  )
}
