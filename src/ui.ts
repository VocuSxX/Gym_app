// Wspólne klasy interfejsu. Kafelki są nieprzezroczyste i jaśniejsze od tła, ruch jest krótki i bez odbić.
// Nazwa glassCard została dla zgodności z istniejącym kodem (już bez efektu szkła).

// Kafelek: wyraźnie jaśniejszy od tła, cienka ramka
export const glassCard =
  'bg-zinc-900 border border-zinc-800 rounded-2xl p-6'

// Główny przycisk akcji
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 bg-accent-500 text-white font-semibold rounded-xl py-3.5 px-6 transition-[background-color,transform] duration-150 hover:bg-accent-400 active:bg-accent-600 active:scale-[.97]'

// Mniejszy wariant (np. "Zapisz" w wierszu serii)
export const btnPrimarySm =
  'inline-flex items-center justify-center gap-2 bg-accent-500 text-white font-semibold rounded-xl py-2.5 px-5 transition-[background-color,transform] duration-150 hover:bg-accent-400 active:bg-accent-600 active:scale-[.97]'

// Przycisk drugorzędny
export const btnGhost =
  'inline-flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold rounded-xl py-2.5 px-5 transition-[background-color,color,transform] duration-150 hover:bg-zinc-700 hover:text-white active:scale-[.97]'

// Przycisk destrukcyjny (blokuj / usuń / zakończ)
export const btnDanger =
  'inline-flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 font-semibold rounded-xl py-2.5 px-5 transition-[background-color,color,transform] duration-150 hover:bg-red-500/20 hover:text-red-200 active:scale-[.97]'

// Stan disabled dla przycisków akcji
export const btnDisabled =
  'disabled:opacity-40 disabled:pointer-events-none'

// Pola formularzy: ciemniejsze od kafelka, wyraźny fokus
export const inputBase =
  'w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-4 text-white placeholder-zinc-500 outline-none transition-[border-color,box-shadow] duration-150 hover:border-zinc-600 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/25'

// Banery komunikatów (zamiast alert())
export const bannerError =
  'rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300'

export const bannerSuccess =
  'rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300'

// Tło aplikacji: dodaj do głównego kontenera obok bg-zinc-950 (faktura zdefiniowana w index.css)
export const pageBg = 'bg-zinc-950 bg-knurl'
