import { supabase } from '../supabaseClient'

export default function Sidebar({ profile, activeTab, setActiveTab }: any) {
  const navBtn = (tab: string, icon: string, label: string) => {
    const isActive = activeTab === tab
    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`group flex items-center gap-3 text-left px-4 py-3 rounded-2xl font-semibold transition-all duration-200 active:scale-95 ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
            : 'text-zinc-400 border border-transparent hover:bg-white/5 hover:text-white hover:translate-x-1'
        }`}
      >
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-colors duration-200 ${isActive ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
          {icon}
        </span>
        {label}
      </button>
    )
  }

  return (
    <aside className="w-72 bg-zinc-900 border-r border-white/5 p-6 flex flex-col gap-8 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-xl shadow-lg shadow-emerald-500/25">
          🏋️
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">MyGym Pro</h2>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {profile?.role === 'user' && navBtn('journal', '🏋️', 'Mój Dziennik')}

        {navBtn('home', '📊', 'Mój Profil')}
        {navBtn('my_trainer', '👥', 'Mój Trener')}
        {navBtn('search', '🔍', 'Znajdź Trenera')}
        {navBtn('stats', '📈', 'Moje Postępy')}
        {navBtn('chat', '💬', 'Wiadomości')}
        {navBtn('settings', '⚙️', 'Ustawienia')}

        {profile?.role === 'trainer' && (
          <div className="mt-4 flex flex-col gap-2 rounded-3xl bg-black/20 border border-white/5 p-3">
            <p className="px-3 pt-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Panel Trenera</p>
            {navBtn('clients', '👥', 'Moi Podopieczni')}
            {navBtn('plan_creator', '📝', 'Kreator Planów')}
          </div>
        )}
      </nav>

      <button
        onClick={() => supabase.auth.signOut()}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-zinc-400 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 active:scale-95"
      >
        🚪 Wyloguj
      </button>
    </aside>
  )
}
