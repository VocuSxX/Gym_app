// Pierścień postępu: wartość względem celu, bez tekstu pomocniczego
export default function Ring({ value, goal, size = 72, stroke = 7 }: { value: number; goal: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-zinc-800" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
        className={ratio >= 1 ? 'stroke-green-400' : 'stroke-accent-400'}
        strokeDasharray={c} strokeDashoffset={c * (1 - ratio)}
        style={{ transition: 'stroke-dashoffset 250ms cubic-bezier(0.23,1,0.32,1)' }}
      />
    </svg>
  )
}
