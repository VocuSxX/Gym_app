import { useState } from 'react'
import Tabs from './Tabs'
import MyTrainer from './MyTrainer'
import MyComments from './MyComments'
import TrainerMarketplace from './TrainerMarketplace'

const TABS = [
  { key: 'my', label: 'Mój trener' },
  { key: 'comments', label: 'Komentarze' },
  { key: 'search', label: 'Znajdź trenera' },
]

// Trener: moi trenerzy i pakiety, komentarze do treningów oraz wyszukiwarka trenerów
export default function TrainerHub({ session, initial }: { session: any; initial?: string }) {
  const [tab, setTab] = useState(initial && TABS.some(t => t.key === initial) ? initial : 'my')
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Trener</h1>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>
      <div key={tab} className="animate-fade-in">
        {tab === 'my' && <MyTrainer session={session} onFind={() => setTab('search')} />}
        {tab === 'comments' && <MyComments session={session} />}
        {tab === 'search' && <TrainerMarketplace session={session} />}
      </div>
    </div>
  )
}
