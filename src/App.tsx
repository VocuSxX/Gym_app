import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './Login'
import Register from './Register'
import { pageBg } from './ui'
import Toaster from './components/Toaster'
import { toast } from './notify'
import { capturePendingCheckin, takePendingCheckin, runGymCheckin, CHECKIN_MESSAGES } from './checkin'
import { useReminders } from './useReminders'

// Importy komponentów
import Sidebar from './components/Sidebar'
import ProfileSettings from './components/ProfileSettings'
import ClientManagement from './components/ClientManagement'
import Onboarding from './components/Onboarding'
import HomeDashboard from './components/HomeDashboard'
import ClientSessions from './components/ClientSessions'
import MyGym from './components/MyGym'
import GymDashboard from './components/GymDashboard'
import GymTrainers from './components/GymTrainers'
import GymMembers from './components/GymMembers'
import GymAnnouncements from './components/GymAnnouncements'
import Fridge from './components/Fridge'
import TrainerQuestions from './components/TrainerQuestions'
import BottomBar from './components/BottomBar'
import Pantry from './components/Pantry'
import MyComments from './components/MyComments'
import TrainingHub from './components/TrainingHub'
import TrainerHub from './components/TrainerHub'
import ProgressHub from './components/ProgressHub'
import CommunityHub from './components/CommunityHub'
import ClientsOverview from './components/ClientsOverview'
import GymCheckin from './components/GymCheckin'
import Icon from './components/Icon'

// Kod QR otwiera aplikację z ?checkin=...: zapamiętujemy go, zanim router przekieruje na logowanie
capturePendingCheckin()

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

  // Zameldowanie z kodu QR (po zalogowaniu i uzupełnieniu profilu)
  useEffect(() => {
    if (!profile?.onboarding_done) return
    const gymId = takePendingCheckin()
    if (!gymId) return
    runGymCheckin(gymId).then(code => {
      const m = CHECKIN_MESSAGES[code] || CHECKIN_MESSAGES.not_member
      toast[m.type](m.text)
    })
  }, [profile?.onboarding_done])

  // Przypomnienia (działają, gdy aplikacja jest otwarta)
  useReminders(session.user.id, !!profile?.onboarding_done && profile?.role !== 'gym', profile?.reminders)

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
  const [tab, sub] = activeTab.split(':')

  return (
    <div className={`flex h-screen text-white ${pageBg}`}>
      <Sidebar profile={profile} activeTab={tab} setActiveTab={selectTab} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Pasek górny tylko na telefonie */}
        <header className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-3 md:hidden">
          <button onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-xl active:scale-[.97]"><Icon name="menu" size={20} /></button>
          <span className="text-lg font-extrabold tracking-tight">MyGym Pro</span>
        </header>

        {/* Główna przestrzeń robocza: plamy światła pod szkłem dają głębię */}
        <main className="relative flex-1 overflow-y-auto">

          <div className="relative z-10 p-4 pb-28 md:p-10 flex flex-col gap-8">

            {activeTab === 'home' && (
              isGym
                ? <GymDashboard session={session} />
                : <HomeDashboard session={session} profile={profile} fetchProfile={fetchProfile} setActiveTab={selectTab} />
            )}
            {tab === 'training' && <TrainingHub key={activeTab} session={session} profile={profile} initial={sub} />}
            {tab === 'trainer' && <TrainerHub key={activeTab} session={session} initial={sub} />}
            {tab === 'progress' && <ProgressHub key={activeTab} session={session} profile={profile} fetchProfile={fetchProfile} initial={sub} />}
            {tab === 'community' && <CommunityHub key={activeTab} session={session} profile={profile} initial={sub} />}
            {activeTab === 'comments' && <MyComments session={session} />}
            {activeTab === 'fridge' && <Fridge session={session} profile={profile} />}
            {activeTab === 'clients' && <ClientManagement session={session} />}
            {activeTab === 'intake_questions' && <TrainerQuestions session={session} />}
            {activeTab === 'client_sessions' && <ClientSessions session={session} />}
            {activeTab === 'settings' && <ProfileSettings session={session} profile={profile} initialData={profile} fetchProfile={fetchProfile} />}
            {activeTab === 'my_gym' && <MyGym session={session} profile={profile} fetchProfile={fetchProfile} />}

            {activeTab === 'gym_trainers' && <GymTrainers session={session} />}
            {activeTab === 'gym_members' && <GymMembers session={session} />}
            {activeTab === 'gym_announcements' && <GymAnnouncements session={session} />}
            {activeTab === 'pantry' && <Pantry session={session} />}
            {activeTab === 'clients_overview' && <ClientsOverview session={session} />}
            {activeTab === 'gym_checkin' && <GymCheckin session={session} />}

          </div>
        </main>

        <BottomBar role={profile.role} activeTab={tab} setActiveTab={selectTab} onMenu={() => setMenuOpen(true)} />
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
      <Toaster />
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
