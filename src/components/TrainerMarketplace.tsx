import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { toast } from '../notify'
import { glassCard, inputBase } from '../ui'
import type { IntakeSnapshot } from '../intake'
import InviteModal from './invite/InviteModal'
import Icon from './Icon'

// Wygląd przycisku zaproszenia zależny od statusu relacji z danym trenerem
const inviteBase = 'rounded-2xl py-3 px-5 font-bold transition-all duration-300'
const inviteStyle: Record<string, string> = {
  none: 'bg-accent-500 text-white active:scale-[.97]',
  pending: 'bg-accent-500/15 border border-accent-500/30 text-accent-400 cursor-default',
  active: 'bg-accent-500/15 border border-accent-500/30 text-accent-300 cursor-default',
  blocked: 'bg-zinc-800 border border-zinc-800 text-zinc-500 cursor-default',
}
const inviteLabel: Record<string, string> = {
  none: 'Wyślij zaproszenie',
  pending: 'Zaproszenie wysłane',
  active: 'Twój trener',
  blocked: 'Niedostępne',
}

type ReviewRow = { trainer_id: string; rating: number; comment: string; client: { nickname: string } | null }

const average = (rows: ReviewRow[] = []) => (rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0)

export default function TrainerMarketplace({ session }: { session: any }) {
  const [trainers, setTrainers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  // Trener, do którego właśnie wypełniamy zaproszenie (otwarte okno)
  const [inviting, setInviting] = useState<any | null>(null)
  // Status relacji z każdym trenerem (klucz: id trenera). Brak wpisu lub 'rejected' = można zaprosić.
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  // Opinie o trenerach (klucz: id trenera) i trener z rozwiniętą listą opinii
  const [reviews, setReviews] = useState<Record<string, ReviewRow[]>>({})
  const [openReviews, setOpenReviews] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: t }, { data: rel }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'trainer').eq('is_public', true).neq('id', session.user.id),
        supabase.from('trainer_clients').select('trainer_id, status').eq('client_id', session.user.id),
      ])
      if (t) {
        setTrainers(t)
        if (t.length > 0) {
          const { data: rv } = await supabase
            .from('trainer_reviews')
            .select('trainer_id, rating, comment, client:profiles!client_id(nickname)')
            .in('trainer_id', t.map((x: any) => x.id))
            .order('created_at', { ascending: false })
            .limit(500)
          const map: Record<string, ReviewRow[]> = {}
          ;((rv || []) as any[]).forEach(r => { (map[r.trainer_id] = map[r.trainer_id] || []).push(r) })
          setReviews(map)
        }
      }
      const map: Record<string, string> = {}
      rel?.forEach((r: any) => { map[r.trainer_id] = r.status })
      setStatuses(map)
    }
    load()
  }, [])

  const setStatus = (trainerId: string, status: string) =>
    setStatuses(prev => ({ ...prev, [trainerId]: status }))

  const stateOf = (trainerId: string) => {
    const s = statuses[trainerId]
    return s === 'pending' || s === 'active' || s === 'blocked' ? s : 'none'
  }

  // Wysyła zaproszenie z wiadomością i migawką karty/ankiety. Zwraca true, gdy się udało.
  const sendInvite = async (trainerId: string, message: string, intake: IntakeSnapshot): Promise<boolean> => {
    if (stateOf(trainerId) !== 'none') return false

    // Sprawdzamy świeży stan w bazie (trener mógł w międzyczasie coś zmienić)
    const { data: existing } = await supabase.from('trainer_clients').select('*').eq('trainer_id', trainerId).eq('client_id', session.user.id).maybeSingle()

    if (existing && existing.status !== 'rejected') {
      setStatus(trainerId, existing.status)
      return true
    }

    const payload = { status: 'pending', welcome_message: message, intake_answers: intake }
    const { error } = existing
      ? await supabase.from('trainer_clients').update(payload).eq('id', existing.id)
      : await supabase.from('trainer_clients').insert({ trainer_id: trainerId, client_id: session.user.id, welcome_message: message, intake_answers: intake })

    if (error) {
      toast.error('Nie udało się wysłać zaproszenia. Spróbuj ponownie.')
      return false
    }
    setStatus(trainerId, 'pending')
    return true
  }

  const q = searchQuery.toLowerCase()
  const filteredTrainers = trainers.filter(t =>
    t.nickname?.toLowerCase().includes(q) ||
    t.city?.toLowerCase().includes(q) ||
    (t.specializations || []).some((x: string) => x.toLowerCase().includes(q)),
  )
  return (
    <div className="max-w-4xl w-full flex flex-col gap-8 animate-fade-in">

      <input type="text" placeholder="Szukaj po nicku, mieście lub specjalizacji..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputBase} text-lg`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTrainers.map(trainer => {
          const state = stateOf(trainer.id)
          return (
            <div key={trainer.id} className={`${glassCard} flex flex-col gap-5 transition-all duration-200 hover:border-accent-500/30`}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-400"><Icon name="graduation" size={26} /></div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-white">@{trainer.nickname || 'Nieznajomy'}</h3>
                  <span className="text-sm text-zinc-400">Trener{trainer.experience_years ? ` · ${trainer.experience_years} lat doświadczenia` : ''}</span>
                </div>
              </div>

              {trainer.bio && <p className="text-sm text-zinc-400">{trainer.bio}</p>}

              {(trainer.specializations || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {trainer.specializations.map((sp: string) => (
                    <span key={sp} className="rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-bold text-accent-300">{sp}</span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                {trainer.city && <span className="inline-flex items-center gap-1"><Icon name="pin" size={14} />{trainer.city}</span>}
                {trainer.price_info && <span>{trainer.price_info}</span>}
                {(reviews[trainer.id] || []).length > 0 ? (
                  <button type="button" onClick={() => setOpenReviews(openReviews === trainer.id ? null : trainer.id)} className="font-bold text-amber-400 hover:underline">
                    ★ {average(reviews[trainer.id]).toFixed(1)} ({reviews[trainer.id].length}) · opinie
                  </button>
                ) : (
                  <span>Brak opinii</span>
                )}
              </div>

              {openReviews === trainer.id && (
                <div className="flex flex-col gap-2">
                  {(reviews[trainer.id] || []).slice(0, 5).map((r, i) => (
                    <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-sm">
                      <p className="font-bold text-accent-400">{'★'.repeat(r.rating)}<span className="text-zinc-600">{'★'.repeat(5 - r.rating)}</span> <span className="text-zinc-400">@{r.client?.nickname || 'użytkownik'}</span></p>
                      {r.comment && <p className="mt-1 text-white">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setInviting(trainer)}
                disabled={state !== 'none'}
                className={`${inviteBase} ${inviteStyle[state]}`}
              >
                {inviteLabel[state]}
              </button>
            </div>
          )
        })}
        {filteredTrainers.length === 0 && (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">Nie znaleziono żadnych trenerów.</div>
        )}
      </div>

      {inviting && (
        <InviteModal
          userId={session.user.id}
          trainer={{ id: inviting.id, nickname: inviting.nickname || 'Nieznajomy' }}
          onClose={() => setInviting(null)}
          onSubmit={(message, intake) => sendInvite(inviting.id, message, intake)}
        />
      )}
    </div>
  )
}
