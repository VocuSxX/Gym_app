import type { Macros } from '../../nutrition'

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number | null; color: string }) {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0
  const over = goal ? value > goal * 1.1 : false
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs font-bold">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white">{Math.round(value)}{goal ? <span className="text-zinc-400"> / {goal} g</span> : ' g'}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// Podsumowanie dnia: kalorie + makroskładniki względem celu
export default function DaySummary({ total, target }: { total: Macros; target: Macros | null }) {
  const pct = target ? Math.min(100, Math.round((total.kcal / target.kcal) * 100)) : 0
  const over = target ? total.kcal > target.kcal : false
  const left = target ? target.kcal - total.kcal : null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-bold text-zinc-400">
            <span className="text-3xl font-extrabold text-white">{total.kcal}</span>{target ? ` / ${target.kcal} kcal` : ' kcal'}
          </p>
          {left !== null && (
            <span className={`text-sm font-bold ${over ? 'text-red-400' : 'text-accent-400'}`}>
              {over ? `Ponad o ${-left} kcal` : `Zostało ${left} kcal`}
            </span>
          )}
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : 'bg-accent-500'}`} style={{ width: `${pct}%` }} />
        </div>
        {!target && <p className="text-xs text-zinc-400">Uzupełnij wagę, wzrost i datę urodzenia w profilu, aby zobaczyć cel.</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MacroBar label="Białko" value={total.protein} goal={target?.protein ?? null} color="bg-accent-500" />
        <MacroBar label="Węgle" value={total.carbs} goal={target?.carbs ?? null} color="bg-amber-400" />
        <MacroBar label="Tłuszcze" value={total.fat} goal={target?.fat ?? null} color="bg-rose-400" />
      </div>
    </div>
  )
}
