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
import Onboarding from './components/Onboarding'
import HomeDashboard from './components/HomeDashboard'
import ClientSessions from './components/ClientSessions'
import MyComments from './components/MyComments'
import Friends from './components/Friends'
import MyGym from './components/MyGym'
import GymDashboard from './components/GymDashboard'
import GymTrainers from './components/GymTrainers'
import GymMembers from './components/GymMembers'
import GymAnnouncements from './components/GymAnnouncements'

function Dashboard({ session }: { session: any }) {
  const [profile, setProfile] = useState<any>(null)

  // Domyślna zakładka po zalogowaniu
  const [activeTab, setActiveTab] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  const selectTab = (tab: string) => { setActiveTab(tab); setMenuOpen(false) }

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

  // Wymuszony onboarding: dopóki profil nie jest uzupełniony, nie wpuszczamy do aplikacji
  if (!profile.onboarding_done) {
    return <Onboarding session={session} profile={profile} fetchProfile={fetchProfile} />
  }

  const isGym = profile.role === 'gym'

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar profile={profile} activeTab={activeTab} setActiveTab={selectTab} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Pasek górny tylko na telefonie */}
        <header className="flex items-center gap-3 border-b border-white/5 bg-zinc-900 px-4 py-3 md:hidden">
          <button onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl active:scale-95">☰</button>
          <span className="text-lg font-extrabold tracking-tight">MyGym Pro</span>
        </header>

        {/* Główna przestrzeń robocza: plamy światła pod szkłem dają głębię */}
        <main className="relative flex-1 overflow-y-auto">
          {ambientBlobs.map((cls, i) => <div key={i} className={cls} />)}

          <div className="relative z-10 p-4 md:p-10 flex flex-col gap-8">

            {activeTab === 'home' && (
              isGym
                ? <GymDashboard session={session} />
                : <HomeDashboard session={session} profile={profile} fetchProfile={fetchProfile} setActiveTab={selectTab} />
            )}

            {activeTab === 'journal' && <WorkoutJournal session={session} />}
            {activeTab === 'stats' && <ProgressStats session={session} />}
            {activeTab === 'search' && <TrainerMarketplace session={session} />}
            {activeTab === 'clients' && <ClientManagement session={session} />}
            {activeTab === 'client_sessions' && <ClientSessions session={session} />}
            {activeTab === 'comments' && <MyComments session={session} />}
            {activeTab === 'friends' && <Friends session={session} />}
            {activeTab === 'settings' && <ProfileSettings session={session} profile={profile} initialData={profile} fetchProfile={fetchProfile} />}
            {activeTab === 'plan_creator' && <WorkoutBuilder session={session} profile={profile} />}
            {activeTab === 'chat' && <Chat session={session} />}
            {activeTab === 'my_gym' && <MyGym session={session} profile={profile} fetchProfile={fetchProfile} />}

            {activeTab === 'gym_trainers' && <GymTrainers session={session} />}
            {activeTab === 'gym_members' && <GymMembers session={session} />}
            {activeTab === 'gym_announcements' && <GymAnnouncements session={session} />}

            {activeTab === 'my_trainer' && (
              <div className={`${glassCard} max-w-xl text-center`}>
                <p className="text-zinc-400 font-bold text-xl">Wkrótce: Mój Trener...</p>
              </div>
            )}

          </div>
        </main>
      </div>
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
