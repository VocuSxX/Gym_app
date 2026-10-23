-- ============================================================
-- MIGRACJA: Dodanie kolumn multimedialnych do tabeli exercises
-- oraz kolumny image_url do workout_exercises
-- ============================================================

-- 1. Rozszerzamy tabelę exercises o opis i URL do obrazka/GIF-a
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url   TEXT DEFAULT '';

-- 2. Dodajemy kolumnę image_url do workout_exercises,
--    żeby trener mógł przypisać konkretny obrazek do ćwiczenia w planie
ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

-- ============================================================
-- POLITYKI RLS DLA TABELI exercises
-- ============================================================

-- Włączamy RLS (bezpieczne nawet jeśli już włączone)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Odczyt: Każdy zalogowany użytkownik może przeglądać słownik ćwiczeń
CREATE POLICY "Exercises: każdy zalogowany może czytać"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Wstawianie: Tylko trenerzy mogą dodawać nowe ćwiczenia
CREATE POLICY "Exercises: trener może dodawać"
  ON exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'trainer'
    )
  );

-- Aktualizacja: Tylko trenerzy mogą edytować ćwiczenia
CREATE POLICY "Exercises: trener może edytować"
  ON exercises
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'trainer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'trainer'
    )
  );

-- Usuwanie: Tylko trenerzy mogą usuwać ćwiczenia
CREATE POLICY "Exercises: trener może usuwać"
  ON exercises
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'trainer'
    )
  );
