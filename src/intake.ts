// Typy ankiety trenera i karty ćwiczącego

export type QuestionType = 'text' | 'choice' | 'yesno'

export type Question = {
  id: string
  question: string
  q_type: QuestionType
  options: string[]
  is_required: boolean
  order_index: number
}

// Karta ćwiczącego: wypełniana raz, zapisana w client_intake
export type IntakeCard = {
  goal: string
  injuries: string
  sessions_per_week: number | null
}

export const emptyCard: IntakeCard = { goal: '', injuries: '', sessions_per_week: null }

// Migawka dołączana do zaproszenia (trainer_clients.intake_answers)
export type IntakeSnapshot = {
  card: IntakeCard
  answers: { question: string; answer: string }[]
}

export const QUESTION_TYPES: { key: QuestionType; label: string }[] = [
  { key: 'text', label: 'Odpowiedź tekstowa' },
  { key: 'choice', label: 'Wybór z listy' },
  { key: 'yesno', label: 'Tak / Nie' },
]
