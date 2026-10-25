# Znane błędy

## 1. `ageFromBirth` zwraca wiek o 1 rok za mały w dniu urodzin
- **Plik:** `src/health.ts` (funkcja `ageFromBirth`, linia 22–23)
- **Opis:** wiek liczony jest przez dzielenie różnicy dat w ms przez `365.25` dni. Przy przestępnych latach w przedziale wynik bywa niedokładny, a w dniu urodzin może wyjść o 1 rok za mało.
- **Oczekiwane:** dla `birth_date = '1996-10-25'` i daty `2026-10-25` wiek = `30`.
- **Faktyczne:** `29`.
- **Wpływ:** `calcBmr`, `calcTdee`, `calcTarget` oraz walidacja wieku w `Onboarding.tsx` używają tej funkcji.
- **Test:** `src/health.test.ts`, test oznaczony `it.fails` (do usunięcia po poprawce).
- **Sugestia:** liczyć wiek kalendarzowo (porównanie roku, miesiąca i dnia), a nie przez dzielenie przez 365.25.
