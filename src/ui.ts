// Wspólne klasy Design Systemu (Apple + Discord + Duolingo) - patrz RULES.md

// Apple Glass: karty i panele
export const glassCard =
  'bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl'

// Duolingo: główny przycisk akcji (gruby, sprężysty)
export const btnPrimary =
  'bg-emerald-500 text-white font-bold rounded-2xl py-4 px-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-1 active:scale-95'

// Mniejszy wariant tego samego przycisku (np. "Zapisz" w wierszu serii)
export const btnPrimarySm =
  'bg-emerald-500 text-white font-bold rounded-2xl py-3 px-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/25 active:translate-y-1 active:scale-95'

// Przycisk drugorzędny (szklany)
export const btnGhost =
  'bg-white/5 border border-white/10 text-zinc-300 font-bold rounded-2xl py-3 px-5 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95'

// Przycisk destrukcyjny (blokuj / usuń / zakończ)
export const btnDanger =
  'bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-2xl py-3 px-5 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300 active:scale-95'

// Stan disabled dla przycisków akcji
export const btnDisabled =
  'disabled:opacity-50 disabled:pointer-events-none'

// Pola formularzy
export const inputBase =
  'w-full bg-black/30 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/15'

// Banery komunikatów (zamiast alert())
export const bannerError =
  'rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300'

export const bannerSuccess =
  'rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300'

// Tło z rozmytymi plamami światła (daje szkłu co rozmywać)
export const ambientBlobs = [
  'pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-3xl',
  'pointer-events-none absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-violet-500/10 blur-3xl',
  'pointer-events-none absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-sky-500/10 blur-3xl',
]
