import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Auth from './Auth'


// Importy komponentów
import Sidebar from './components/Sidebar'
import ProfileSettings from './components/ProfileSettings'
import TrainerMarketplace from './components/TrainerMarketplace'
import ClientManagement from './components/ClientManagement'
import WorkoutBuilder from './components/WorkoutBuilder'
import WorkoutJournal from './components/WorkoutJournal'
import ProgressStats from './components/ProgressStats'
import Chat from './components/Chat'

function Dashboard({ session }: { session: any }) {
  const [profile, setProfile] = useState<any>(null)
  
  // Domyślna zakładka po zalogowaniu
  const [activeTab, setActiveTab] = useState('home')

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) setProfile(data)
  }

  useEffect(() => { fetchProfile() }, [session])

  if (!profile) return <div className="flex h-screen bg-zinc-900 text-white items-center justify-center font-bold">Ładowanie profilu...</div>

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      <Sidebar profile={profile} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-10 overflow-y-auto">
        
        {activeTab === 'home' && (
          <div className="max-w-2xl animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">Witaj, {profile.nickname || 'Wojowniku'}! ⚡</h1>
            
            <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-8 rounded-3xl border border-zinc-700/50 shadow-xl mt-8">
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">Gotowy na kolejny trening?</h2>
              <p className="text-zinc-300 mb-6 text-lg">
                Wybierz <strong className="text-white">"Mój Dziennik"</strong> z menu po lewej stronie, aby sprawdzić dzisiejszy plan, lub zajrzyj do zakładki <strong className="text-white">"Moje Postępy"</strong>, żeby sprawdzić, jak rośnie Twoja siła.
              </p>
              
              {profile.role === 'trainer' && (
                <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-2xl">
                  <p className="text-yellow-500 font-bold">Jesteś zalogowany jako Trener. Panel zarządzania podopiecznymi znajdziesz w menu po lewej stronie.</p>
                </div>
              )}
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
        
        {activeTab === 'my_trainer' && <div className="text-zinc-400 font-bold text-xl">Wkrótce: Mój Trener...</div>}
        
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

  if (loading) return <div className="flex h-screen bg-zinc-900 text-white items-center justify-center">Ładowanie aplikacji...</div>
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