import { supabase } from '../supabaseClient'
import { navFor, ROLE_LABELS } from '../navConfig'
import Icon from './Icon'

export default function Sidebar({ profile, activeTab, setActiveTab, open, onClose }: any) {
  const role: string | undefined = profile?.role
  const groups = navFor(role)

  const navBtn = (tab: string, icon: string, label: string) => {
    const isActive = activeTab === tab
    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`group flex items-center gap-3 text-left px-3 py-2.5 rounded-2xl font-semibold transition-all duration-200 active:scale-[.97] ${
          isActive
            ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
            : 'text-zinc-400 border border-transparent hover:bg-zinc-800 hover:text-white'
        }`}
      >
        <Icon name={icon} size={20} className={isActive ? 'text-accent-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
        {label}
      </button>
    )
  }

  return (
    <>
      {/* Tło za wysuwanym menu (tylko telefon) */}
      {open && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-6 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white">
            <Icon name="dumbbell" size={22} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">MyGym Pro</h2>
        </div>

        {profile?.nickname && (
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
              <Icon name={role === 'gym' ? 'building' : role === 'trainer' ? 'graduation' : 'user'} size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-white">@{profile.nickname}</p>
              <p className="text-xs font-bold text-zinc-400">{ROLE_LABELS[role || 'user'] || 'Ćwiczący'}</p>
            </div>
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
          {groups.map(group => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-3 pb-1 text-xs font-bold text-zinc-400">{group.label}</p>
              {group.items.map(item => navBtn(item.tab, item.icon, item.label))}
            </div>
          ))}
        </nav>

        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-800 px-4 py-3 text-left font-semibold text-zinc-400 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 active:scale-[.97]"
        >
          <Icon name="logout" size={20} />
          Wyloguj
        </button>
      </aside>
    </>
  )
}
