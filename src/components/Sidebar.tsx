import { supabase } from '../supabaseClient'

export default function Sidebar({ profile, activeTab, setActiveTab }: any) {
  return (
    <aside className="w-64 bg-gray-950 p-6 border-r border-gray-800 flex flex-col">
      <h2 className="text-2xl font-bold mb-8 text-pink-500">MyGym Pro</h2>
      <nav className="flex flex-col gap-4">
        {/* Zwykły Użytkownik widzi swój Dziennik na pierwszym miejscu */}
        {profile?.role === 'user' && (
          <button onClick={() => setActiveTab('journal')} className={`text-left transition-colors ${activeTab === 'journal' ? 'text-pink-400' : 'text-gray-300 hover:text-white'}`}>🏋️ Mój Dziennik</button>
        )}
        
        <button onClick={() => setActiveTab('home')} className={`text-left transition-colors ${activeTab === 'home' ? 'text-pink-400' : 'text-gray-300 hover:text-white'}`}>📊 Mój Profil</button>
        <button onClick={() => setActiveTab('my_trainer')} className={`text-left transition-colors ${activeTab === 'my_trainer' ? 'text-pink-400' : 'text-gray-300 hover:text-white'}`}>👥 Mój Trener</button>
        <button onClick={() => setActiveTab('search')} className={`text-left transition-colors ${activeTab === 'search' ? 'text-pink-400' : 'text-gray-300 hover:text-white'}`}>🔍 Znajdź Trenera</button>
        <button onClick={() => setActiveTab('settings')} className={`text-left transition-colors ${activeTab === 'settings' ? 'text-pink-400' : 'text-gray-300 hover:text-white'}`}>⚙️ Ustawienia</button>
        <button onClick={() => setActiveTab('stats')} className={`text-left transition-colors ${activeTab === 'stats' ? 'text-pink-400' : 'text-gray-300 hover:text-white'}`}>📈 Moje Postępy</button>
        <button onClick={() => setActiveTab('chat')} className={`text-left transition-colors ${activeTab === 'chat' ? 'text-pink-400' : 'text-gray-300 hover:text-white'}`}>💬 Wiadomości</button>
        
        {profile?.role === 'trainer' && (
          <>
            <div className="h-px bg-gray-800 my-2"></div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Panel Trenera</p>
            <button onClick={() => setActiveTab('clients')} className={`text-left transition-colors ${activeTab === 'clients' ? 'text-pink-400' : 'text-gray-300 hover:text-pink-400'}`}>👥 Moi Podopieczni</button>
            <button onClick={() => setActiveTab('plan_creator')} className={`text-left transition-colors ${activeTab === 'plan_creator' ? 'text-pink-400' : 'text-gray-300 hover:text-pink-400'}`}>📝 Kreator Planów</button>
            <button onClick={() => setActiveTab('chat')} className={`text-left transition-colors ${activeTab === 'chat' ? 'text-pink-400' : 'text-gray-300 hover:text-white'}`}>💬 Wiadomości</button>
          </>
        )}
      </nav>
      <button onClick={() => supabase.auth.signOut()} className="mt-auto text-left text-gray-500 hover:text-red-400">🚪 Wyloguj</button>
    </aside>
  )
}