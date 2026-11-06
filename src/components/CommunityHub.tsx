import { useState } from 'react'
import Tabs from './Tabs'
import Chat from './Chat'
import Friends from './Friends'
import Challenges from './Challenges'

const TABS = [
  { key: 'messages', label: 'Wiadomości' },
  { key: 'friends', label: 'Znajomi' },
  { key: 'challenges', label: 'Wyzwania' },
]

// Społeczność: wiadomości (z dodawaniem znajomych), lista znajomych i wyzwania
export default function CommunityHub({ session, profile, initial }: { session: any; profile: any; initial?: string }) {
  const [tab, setTab] = useState(initial && TABS.some(t => t.key === initial) ? initial : 'messages')
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Społeczność</h1>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>
      <div key={tab} className="animate-fade-in">
        {tab === 'messages' && <Chat session={session} />}
        {tab === 'friends' && <Friends session={session} showAdd={false} />}
        {tab === 'challenges' && <Challenges session={session} profile={profile} />}
      </div>
    </div>
  )
}
