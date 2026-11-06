import { useState } from 'react'
import Tabs from './Tabs'
import ProgressStats from './ProgressStats'
import BodyProgress from './BodyProgress'
import Achievements from './Achievements'
import WeeklyGoalCard from './WeeklyGoalCard'

const TABS = [
  { key: 'strength', label: 'Siła' },
  { key: 'body', label: 'Ciało' },
  { key: 'achievements', label: 'Osiągnięcia' },
]

// Postępy: wykresy siły, pomiary ciała i odznaki
export default function ProgressHub({ session, profile, fetchProfile, initial }: { session: any; profile: any; fetchProfile: () => Promise<void>; initial?: string }) {
  const [tab, setTab] = useState(initial && TABS.some(t => t.key === initial) ? initial : 'strength')
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Postępy</h1>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>
      <div key={tab} className="animate-fade-in">
        {tab === 'strength' && <ProgressStats session={session} />}
        {tab === 'body' && <BodyProgress session={session} fetchProfile={fetchProfile} />}
        {tab === 'achievements' && (
          <div className="flex flex-col gap-6">
            <WeeklyGoalCard session={session} profile={profile} fetchProfile={fetchProfile} />
            <Achievements session={session} />
          </div>
        )}
      </div>
    </div>
  )
}
