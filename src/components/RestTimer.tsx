import { useState, useEffect } from 'react'
import { btnGhost } from '../ui'

const PRESETS = [60, 90, 120, 180]

function beep() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.1
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch { /* brak audio */ }
  try { navigator.vibrate?.(200) } catch { /* brak wibracji */ }
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// Pływający timer przerwy między seriami. runId zmienia się przy każdym nowym starcie.
export default function RestTimer({ runId, seconds, onChangeSeconds, onClose }: {
  runId: number
  seconds: number
  onChangeSeconds: (s: number) => void
  onClose: () => void
}) {
  const [remaining, setRemaining] = useState(seconds)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const end = Date.now() + seconds * 1000
    setRemaining(seconds)
    setDone(false)
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) {
        clearInterval(t)
        setDone(true)
        beep()
      }
    }, 250)
    return () => clearInterval(t)
  }, [runId, seconds])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [done, onClose])

  const pct = Math.round(((seconds - remaining) / seconds) * 100)

  return (
    <div
      className="anim-pop fixed inset-x-4 bottom-24 z-50 flex flex-col gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 md:inset-x-auto md:bottom-6 md:right-6 md:w-80"
      style={{ ['--origin' as any]: 'bottom center' }}
      role="timer"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-400">Przerwa</p>
          <p className={`text-4xl font-extrabold tabular-nums ${done ? 'text-accent-400' : 'text-white'}`}>{done ? 'Start' : fmt(remaining)}</p>
        </div>
        <button type="button" onClick={onClose} className={btnGhost}>Pomiń</button>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-accent-500 transition-[width] duration-300" style={{ width: `${done ? 100 : pct}%` }} />
      </div>
      <div className="flex gap-2">
        {PRESETS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onChangeSeconds(p)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-[.97] ${p === seconds ? 'bg-accent-500/15 text-accent-400' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            {p} s
          </button>
        ))}
      </div>
    </div>
  )
}
