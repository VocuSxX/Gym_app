import { bottomFor } from '../navConfig'
import Icon from './Icon'

// Dolny pasek nawigacji (tylko telefon): najczęstsze zakładki + otwarcie pełnego menu
export default function BottomBar({ role, activeTab, setActiveTab, onMenu }: {
  role?: string
  activeTab: string
  setActiveTab: (tab: string) => void
  onMenu: () => void
}) {
  const items = bottomFor(role)
  const btn = 'flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-bold transition-all duration-200 active:scale-[.97]'

  return (
    <nav
      aria-label="Nawigacja dolna"
      className="fixed inset-x-0 bottom-0 z-20 flex gap-1 border-t border-zinc-800 bg-zinc-900 px-2 pt-2 md:hidden"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      {items.map(it => {
        const on = activeTab === it.tab
        return (
          <button key={it.tab} onClick={() => setActiveTab(it.tab)} className={`${btn} ${on ? 'bg-accent-500/15 text-accent-400' : 'text-zinc-400'}`}>
            <Icon name={it.icon} size={22} />
            {it.label}
          </button>
        )
      })}
      <button onClick={onMenu} className={`${btn} text-zinc-400`}>
        <Icon name="menu" size={22} />
        Menu
      </button>
    </nav>
  )
}
