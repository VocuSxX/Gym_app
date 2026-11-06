// Przełącznik podzakładek wewnątrz jednej sekcji
export default function Tabs({ tabs, value, onChange }: {
  tabs: { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div role="tablist" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-1">
      {tabs.map(t => {
        const on = t.key === value
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-[.97] ${on ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
