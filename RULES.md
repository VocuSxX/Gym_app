# Gym_appl - Zasady Projektu

## Stos technologiczny
- Frontend: React, TypeScript, Vite
- Style: Tailwind CSS v4 (używamy `@import "tailwindcss";` w index.css)
- Backend/Baza: Supabase (PostgreSQL, Realtime, RLS)

## Design System (Kierunek: Apple + Discord + Duolingo)
- **Tła (Discord):** Ciemny motyw bazujący na matowych szarościach (`bg-zinc-900` tło, `bg-zinc-800` panele).
- **Kształty (Apple):** Duże zaokrąglenia (`rounded-2xl`, `rounded-3xl`), efekt zmatowionego szkła dla nakładek (`backdrop-blur-md`, `bg-black/40`), delikatne cienie, czysta bezszeryfowa typografia.
- **Akcenty (Duolingo):** Brak różowego. Używamy przyjaznych, wyrazistych kolorów (zieleń, błękit, fiolet) dla głównych akcji. Przyciski grube, "klikalne", z efektami hover/active. Paski postępu grube i czytelne.

## Zasady Pracy Agenta (Roo Code)
1. Przed każdą zmianą przeanalizuj powiązane pliki.
2. Modyfikuj kod na dysku, sprawdzaj błędy za pomocą `npm run dev`.
3. Jeśli tworzysz nową tabelę w Supabase, wygeneruj najpierw kod SQL z politykami RLS.
4. Po udanej implementacji wykonaj komendy: `git add .` oraz `git commit -m "opis zmiany"`.