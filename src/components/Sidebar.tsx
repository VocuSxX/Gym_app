import { supabase } from '../supabaseClient'

export default function Sidebar({ profile, activeTab, setActiveTab }: any) {
  const navBtn = (tab: string, icon: string, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`text-left px-4 py-2.5 rounded-2xl font-medium transition-all ${
        activeTab === tab
          ? 'bg-emerald-600/20 text-emerald-400'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  )

  return (
    <aside className="w-64 bg-zinc-950 p-6 border-r border-zinc-800/60 flex flex-col">
      <h2 className="text-2xl font-bold mb-8 text-emerald-400">MyGym Pro</h2>
      <nav className="flex flex-col gap-1.5">
        {profile?.role === 'user' && navBtn('journal', '🏋️', 'Mój Dziennik')}

        {navBtn('home', '📊', 'Mój Profil')}
        {navBtn('my_trainer', '👥', 'Mój Trener')}
        {navBtn('search', '🔍', 'Znajdź Trenera')}
        {navBtn('settings', '⚙️', 'Ustawienia')}
        {navBtn('stats', '📈', 'Moje Postępy')}
        {navBtn('chat', '💬', 'Wiadomości')}

        {profile?.role === 'trainer' && (
          <>
            <div className="h-px bg-zinc-800 my-3"></div>
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider px-4 mb-1">Panel Trenera</p>
            {navBtn('clients', '👥', 'Moi Podopieczni')}
            {navBtn('plan_creator', '📝', 'Kreator Planów')}
          </>
        )}
      </nav>
      <button onClick={() => supabase.auth.signOut()} className="mt-auto text-left text-zinc-500 hover:text-red-400 px-4 py-2.5 rounded-2xl transition-colors">🚪 Wyloguj</button>
    </aside>
  )
}