import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { confirmDialog, toast } from '../notify'
import { glassCard, btnPrimarySm, btnGhost, btnDanger, inputBase } from '../ui'
import { toKey, todayStr } from '../health'

type Challenge = {
  id: string
  creator_id: string
  gym_id: string | null
  title: string
  metric: 'training_days' | 'sets' | 'checkins'
  scope: 'friends' | 'gym'
  start_date: string
  end_date: string
}
type Score = { user_id: string; nickname: string; score: number }

const METRICS: Record<string, string> = {
  training_days: 'dni treningowe',
  sets: 'wykonane serie',
  checkins: 'wejścia na siłownię',
}
const DURATIONS = [7, 14, 30]

const addDays = (key: string, n: number) => {
  const [y, m, d] = key.split('-').map(Number)
  return toKey(new Date(y, m - 1, d + n))
}

// Wyzwania: ze znajomymi albo w obrębie siłowni. Ranking liczy baza (funkcja challenge_leaderboard).
export default function Challenges({ session, profile }: { session: any; profile: any }) {
  const me = session.user.id
  const [list, setList] = useState<Challenge[]>([])
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)
  const [board, setBoard] = useState<Record<string, Score[]>>({})
  const [gymId, setGymId] = useState<string | null>(profile?.gym_id || null)

  const [title, setTitle] = useState('')
  const [metric, setMetric] = useState<Challenge['metric']>('training_days')
  const [scope, setScope] = useState<'friends' | 'gym'>('friends')
  const [duration, setDuration] = useState(7)
  const [creating, setCreating] = useState(false)

  const load = async () => {
    const [{ data: ch }, { data: mine }] = await Promise.all([
      supabase.from('challenges').select('*').order('end_date', { ascending: false }),
      supabase.from('challenge_members').select('challenge_id').eq('user_id', me),
    ])
    setList((ch || []) as Challenge[])
    setJoined(new Set(((mine || []) as any[]).map(m => m.challenge_id)))
  }

  useEffect(() => {
    load()
    if (profile?.role === 'gym') {
      supabase.from('gyms').select('id').eq('owner_id', me).maybeSingle().then(({ data }) => setGymId(data?.id || null))
    }
  }, [session])

  const loadBoard = async (id: string) => {
    const { data } = await supabase.rpc('challenge_leaderboard', { c: id })
    setBoard(b => ({ ...b, [id]: (data || []) as Score[] }))
  }

  const toggleOpen = (id: string) => {
    const next = open === id ? null : id
    setOpen(next)
    if (next) loadBoard(next)
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    const start = todayStr()
    const { data, error } = await supabase
      .from('challenges')
      .insert({
        creator_id: me,
        gym_id: scope === 'gym' ? gymId : null,
        title: title.trim(),
        metric,
        scope,
        start_date: start,
        end_date: addDays(start, duration - 1),
      })
      .select()
      .single()
    if (error || !data) {
      setCreating(false)
      return toast.error('Nie udało się utworzyć wyzwania.')
    }
    await supabase.from('challenge_members').insert({ challenge_id: data.id, user_id: me })
    setCreating(false)
    setTitle('')
    toast.success('Wyzwanie utworzone. Znajomi (lub członkowie siłowni) zobaczą je na liście.')
    load()
  }

  const join = async (id: string) => {
    const { error } = await supabase.from('challenge_members').insert({ challenge_id: id, user_id: me })
    if (error) return toast.error('Nie udało się dołączyć.')
    toast.success('Dołączyłeś do wyzwania!')
    await load()
    if (open === id) loadBoard(id)
  }

  const leave = async (id: string) => {
    await supabase.from('challenge_members').delete().eq('challenge_id', id).eq('user_id', me)
    await load()
    if (open === id) loadBoard(id)
  }

  const remove = async (c: Challenge) => {
    if (!(await confirmDialog(`Usunąć wyzwanie „${c.title}”?`, { confirmLabel: 'Usuń' }))) return
    const { error } = await supabase.from('challenges').delete().eq('id', c.id)
    if (error) return toast.error('Nie udało się usunąć wyzwania.')
    toast.success('Wyzwanie usunięte.')
    load()
  }

  const today = todayStr()
  const status = (c: Challenge) => (today < c.start_date ? 'Wkrótce' : today > c.end_date ? 'Zakończone' : 'Trwa')
  const canGymScope = !!gymId

  return (
    <div className="max-w-3xl w-full flex flex-col gap-8 animate-fade-in">

      <form onSubmit={create} className={`${glassCard} flex flex-col gap-4`}>
        <h2 className="text-xl font-bold text-white">Nowe wyzwanie</h2>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="np. Tydzień bez wymówek" className={inputBase} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select value={metric} onChange={e => setMetric(e.target.value as Challenge['metric'])} className={inputBase}>
            {Object.entries(METRICS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={scope} onChange={e => setScope(e.target.value as 'friends' | 'gym')} className={inputBase}>
            <option value="friends">Dla znajomych</option>
            {canGymScope && <option value="gym">Dla siłowni</option>}
          </select>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={inputBase}>
            {DURATIONS.map(d => <option key={d} value={d}>{d} dni</option>)}
          </select>
        </div>
        <button type="submit" disabled={!title.trim() || creating} className={`${btnPrimarySm} disabled:opacity-50 disabled:pointer-events-none`}>
          {creating ? 'Tworzenie...' : 'Utwórz i dołącz'}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {list.map(c => {
          const isIn = joined.has(c.id)
          const rows = board[c.id] || []
          return (
            <div key={c.id} className={`${glassCard} flex flex-col gap-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-white">{c.title}</h3>
                  <p className="text-sm text-zinc-400">
                    {METRICS[c.metric]} · {c.start_date} → {c.end_date} · {c.scope === 'gym' ? 'siłownia' : 'znajomi'}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${status(c) === 'Trwa' ? 'border-accent-500/30 bg-accent-500/10 text-accent-300' : 'border-zinc-800 bg-zinc-800 text-zinc-400'}`}>{status(c)}</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => toggleOpen(c.id)} className={btnGhost}>{open === c.id ? 'Ukryj ranking' : 'Ranking'}</button>
                {!isIn && status(c) !== 'Zakończone' && <button type="button" onClick={() => join(c.id)} className={btnPrimarySm}>Dołącz</button>}
                {isIn && c.creator_id !== me && <button type="button" onClick={() => leave(c.id)} className={btnGhost}>Opuść</button>}
                {c.creator_id === me && <button type="button" onClick={() => remove(c)} className={btnDanger}>Usuń</button>}
              </div>

              {open === c.id && (
                <div className="flex flex-col gap-2">
                  {rows.map((r, i) => (
                    <div key={r.user_id} className={`flex items-center justify-between rounded-2xl border px-4 py-2 ${r.user_id === me ? 'border-accent-500/30 bg-accent-500/10' : 'border-zinc-800 bg-zinc-950'}`}>
                      <span className="font-bold text-white">{i + 1}. @{r.nickname}{r.user_id === me ? ' (Ty)' : ''}</span>
                      <span className="font-extrabold text-accent-400">{r.score}</span>
                    </div>
                  ))}
                  {rows.length === 0 && <p className="text-center text-sm text-zinc-400">Nikt jeszcze nie dołączył.</p>}
                </div>
              )}
            </div>
          )
        })}
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">Brak wyzwań. Utwórz pierwsze albo poczekaj na zaproszenie znajomych.</div>
        )}
      </div>
    </div>
  )
}
