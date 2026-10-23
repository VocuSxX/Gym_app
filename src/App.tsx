import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import { glassCard, ambientBlobs } from './ui'

// Importy komponentów
import Sidebar from './components/Sidebar'
import ProfileSettings from './components/ProfileSettings'
import TrainerMarketplace from './components/TrainerMarketplace'
import ClientManagement from './components/ClientManagement'
import WorkoutBuilder from './components/WorkoutBuilder'
import WorkoutJournal from './components/WorkoutJournal'
import ProgressStats from './components/ProgressStats'
import Chat from './components/Chat'

const HOME_TILES = [
  { icon: '🏋️', label: 'Trenuj', hint: 'Dziennik serii' },
  { icon: '📈', label: 'Rośnij', hint: 'Wykresy siły' },
  { icon: '💬', label: 'Rozmawiaj', hint: 'Czat z trenerem' },
]

function Dashboard({ session }: { session: any }) {
  const [profile, setProfile] = useState<any>(null)

  // Domyślna zakładka po zalogowaniu
  const [activeTab, setActiveTab] = useState('home')

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) setProfile(data)
  }

  useEffect(() => { fetchProfile() }, [session])

  if (!profile) {
    return (
      <div className="flex h-screen bg-zinc-950 text-zinc-400 items-center justify-center font-bold animate-pulse">
        Ładowanie profilu...
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar profile={profile} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Główna przestrzeń robocza: plamy światła pod szkłem dają głębię */}
      <main className="relative flex-1 overflow-y-auto">
        {ambientBlobs.map((cls, i) => <div key={i} className={cls} />)}

        <div className="relative z-10 p-10 flex flex-col gap-8">

          {activeTab === 'home' && (
            <div className="max-w-3xl flex flex-col gap-8 animate-fade-in">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
                  {profile.role === 'trainer' ? 'Panel Trenera' : 'Strefa Ucznia'}
                </p>
                <h1 className="text-5xl font-extrabold tracking-tight text-white">
                  Witaj, {profile.nickname || 'Wojowniku'}! ⚡
                </h1>
              </div>

              <div className={`${glassCard} p-8 flex flex-col gap-6`}>
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold text-white">Gotowy na kolejny trening?</h2>
                  <p className="text-zinc-400 text-lg leading-relaxed">
                    Wybierz <strong className="text-white">"Mój Dziennik"</strong> z menu po lewej stronie, aby sprawdzić dzisiejszy plan, lub zajrzyj do zakładki <strong className="text-white">"Moje Postępy"</strong>, żeby zobaczyć, jak rośnie Twoja siła.
                  </p>
                </div>

                {profile.role === 'trainer' && (
                  <div className="flex items-start gap-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5">
                    <span className="text-2xl">🎓</span>
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-white">Jesteś zalogowany jako Trener</p>
                      <p className="text-zinc-400">Panel zarządzania podopiecznymi i Kreator Planów znajdziesz w menu po lewej stronie.</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {HOME_TILES.map(tile => (
                    <div key={tile.label} className="rounded-2xl bg-black/30 border border-white/5 p-5 flex flex-col gap-1 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/30">
                      <span className="text-3xl">{tile.icon}</span>
                      <span className="font-bold text-white mt-2">{tile.label}</span>
                      <span className="text-sm text-zinc-400">{tile.hint}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'journal' && <WorkoutJournal session={session} />}
          {activeTab === 'stats' && <ProgressStats session={session} />}
          {activeTab === 'search' && <TrainerMarketplace session={session} />}
          {activeTab === 'clients' && <ClientManagement session={session} />}
          {activeTab === 'settings' && <ProfileSettings session={session} profile={profile} initialData={profile} fetchProfile={fetchProfile} />}
          {activeTab === 'plan_creator' && <WorkoutBuilder session={session} />}
          {activeTab === 'chat' && <Chat session={session} />}

          {activeTab === 'my_trainer' && (
            <div className={`${glassCard} max-w-xl text-center`}>
              <p className="text-zinc-400 font-bold text-xl">Wkrótce: Mój Trener...</p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950 text-zinc-400 items-center justify-center font-bold animate-pulse">
        Ładowanie aplikacji...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App