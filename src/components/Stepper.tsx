// Gruby pasek postępu w stylu Duolingo (ten sam co w kreatorze planów)
export default function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        {labels.map((_, i) => (
          <div key={i} className="h-4 flex-1 rounded-full bg-zinc-800 overflow-hidden">
            <div className={`h-full rounded-full bg-accent-500 transition-all duration-500 ${step >= i + 1 ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>
      <p className="text-sm font-bold text-zinc-400">
        Krok {step} z {labels.length} · <span className="text-accent-400">{labels[step - 1]}</span>
      </p>
    </div>
  )
}
