import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { toast } from '../notify'
import { glassCard, btnPrimarySm, btnDanger, inputBase } from '../ui'
import { QUESTION_TYPES, type Question, type QuestionType } from '../intake'
import Icon from './Icon'

const MAX_QUESTIONS = 15

// Trener układa własną ankietę, którą wypełnia ćwiczący wysyłając zaproszenie
export default function TrainerQuestions({ session }: { session: any }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [text, setText] = useState('')
  const [type, setType] = useState<QuestionType>('text')
  const [optionsText, setOptionsText] = useState('')
  const [required, setRequired] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('trainer_questions').select('*').eq('trainer_id', session.user.id).order('order_index', { ascending: true })
    if (data) setQuestions(data as Question[])
  }

  useEffect(() => { load() }, [session])

  const options = optionsText.split('\n').map(o => o.trim()).filter(Boolean)
  const valid = text.trim().length > 0 && (type !== 'choice' || options.length >= 2)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    if (questions.length >= MAX_QUESTIONS) return toast.error(`Maksymalnie ${MAX_QUESTIONS} pytań.`)
    setSaving(true)
    const nextIndex = questions.length ? Math.max(...questions.map(q => q.order_index)) + 1 : 0
    const { error } = await supabase.from('trainer_questions').insert({
      trainer_id: session.user.id,
      question: text.trim(),
      q_type: type,
      options: type === 'choice' ? options : [],
      is_required: required,
      order_index: nextIndex,
    })
    setSaving(false)
    if (error) return toast.error('Nie udało się dodać pytania.')
    setText('')
    setOptionsText('')
    setType('text')
    setRequired(true)
    toast.success('Pytanie dodane.')
    load()
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('trainer_questions').delete().eq('id', id)
    if (error) return toast.error('Nie udało się usunąć pytania.')
    load()
  }

  const typeLabel = (t: QuestionType) => QUESTION_TYPES.find(x => x.key === t)?.label

  return (
    <div className="max-w-3xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Ankieta dla podopiecznych</h1>
        <p className="text-zinc-400">Te pytania zobaczy każdy, kto wyśle Ci zaproszenie. Odpowiedzi dostaniesz razem z jego kartą ćwiczącego.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-accent-400">Twoje pytania ({questions.length})</h2>
        {questions.map((q, i) => (
          <div key={q.id} className={`${glassCard} flex items-center justify-between gap-4 !p-4`}>
            <div className="min-w-0">
              <p className="font-bold text-white">{i + 1}. {q.question}</p>
              <p className="text-xs text-zinc-400">
                {typeLabel(q.q_type)}{q.is_required ? ' · wymagane' : ' · opcjonalne'}{q.q_type === 'choice' ? ` · ${q.options.join(', ')}` : ''}
              </p>
            </div>
            <button type="button" onClick={() => remove(q.id)} className={`${btnDanger} !px-3 !py-2`} aria-label="Usuń pytanie"><Icon name="trash" size={16} /></button>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">Nie masz jeszcze pytań. Zaproszenia przyjdą tylko z kartą ćwiczącego i wiadomością.</div>
        )}
      </section>

      <form onSubmit={add} className={`${glassCard} flex flex-col gap-5`}>
        <h2 className="text-xl font-bold text-white">Nowe pytanie</h2>
        <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="np. Czy trenowałeś już z trenerem?" className={inputBase} />

        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-[.97] ${type === t.key ? 'border-accent-500/40 bg-accent-500/15 text-accent-400' : 'border-zinc-800 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {type === 'choice' && (
          <textarea value={optionsText} onChange={e => setOptionsText(e.target.value)} placeholder={'Każda odpowiedź w nowej linii (min. 2)\nnp.\nRedukcja\nMasa\nSiła'} className={`${inputBase} h-28 resize-none`} />
        )}

        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} className="h-5 w-5 accent-accent-500" />
          <span className="text-zinc-400">Odpowiedź wymagana</span>
        </label>

        <button type="submit" disabled={!valid || saving} className={`${btnPrimarySm} disabled:opacity-50 disabled:pointer-events-none`}>
          {saving ? 'Dodawanie...' : 'Dodaj pytanie'}
        </button>
      </form>
    </div>
  )
}
