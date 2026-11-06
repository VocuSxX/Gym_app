import type { IntakeSnapshot } from '../../intake'

// Karta ćwiczącego i odpowiedzi z zaproszenia (widok trenera). Stare zaproszenia mogą być puste.
export default function IntakeView({ intake }: { intake: Partial<IntakeSnapshot> | null | undefined }) {
  const card = intake?.card
  const answers = intake?.answers || []
  const rows: [string, string][] = []
  if (card?.goal) rows.push(['Cel', card.goal])
  if (card?.injuries) rows.push(['Kontuzje i ograniczenia', card.injuries])
  if (card?.sessions_per_week) rows.push(['Treningów w tygodniu', String(card.sessions_per_week)])
  answers.forEach(a => rows.push([a.question, a.answer || '—']))

  if (rows.length === 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs font-bold text-zinc-400">Karta ćwiczącego i ankieta</p>
      {rows.map(([q, a], i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <p className="text-xs font-bold text-zinc-400">{q}</p>
          <p className="text-white">{a}</p>
        </div>
      ))}
    </div>
  )
}
