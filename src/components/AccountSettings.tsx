import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { confirmDialog, toast } from '../notify'
import { glassCard, btnPrimary, btnGhost, btnDanger, btnDisabled, inputBase } from '../ui'

const EXPORT_TABLES: { table: string; column: string }[] = [
  { table: 'profiles', column: 'id' },
  { table: 'exercise_logs', column: 'client_id' },
  { table: 'food_entries', column: 'user_id' },
  { table: 'water_entries', column: 'user_id' },
  { table: 'gym_checkins', column: 'user_id' },
]

// Konto: e-mail, hasło, eksport danych, zmiana roli i usunięcie konta
export default function AccountSettings({ session, profile, fetchProfile }: { session: any; profile: any; fetchProfile: () => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('Hasło musi mieć co najmniej 6 znaków.')
    if (password !== repeat) return toast.error('Hasła nie są takie same.')
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) return toast.error('Nie udało się zmienić hasła.')
    setPassword('')
    setRepeat('')
    toast.success('Hasło zmienione.')
  }

  const exportData = async () => {
    setExporting(true)
    const out: Record<string, unknown> = {}
    for (const { table, column } of EXPORT_TABLES) {
      const { data } = await supabase.from(table).select('*').eq(column, session.user.id)
      out[table] = data || []
    }
    setExporting(false)
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mygym-dane.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Dane pobrane.')
  }

  const upgradeToTrainer = async () => {
    if (!(await confirmDialog('Zmienić konto na profil trenera? Odblokuje to narzędzia trenerskie.', { confirmLabel: 'Zostań trenerem', danger: false }))) return
    const { error } = await supabase.from('profiles').update({ role: 'trainer' }).eq('id', session.user.id)
    if (error) return toast.error('Nie udało się zmienić roli.')
    fetchProfile()
  }

  const deleteAccount = async () => {
    if (!(await confirmDialog('Usunąć konto razem ze wszystkimi danymi? Tej operacji nie można cofnąć.', { confirmLabel: 'Usuń konto', danger: true }))) return
    const { error } = await supabase.rpc('delete_my_account')
    if (error) return toast.error('Nie udało się usunąć konta.')
    await supabase.auth.signOut()
  }

  return (
    <div className="stagger flex flex-col gap-6">
      <div className={`${glassCard} flex flex-col gap-1`}>
        <p className="text-sm text-zinc-400">E-mail</p>
        <p className="font-semibold text-white">{session.user.email}</p>
      </div>

      <form onSubmit={changePassword} className={`${glassCard} flex flex-col gap-4`}>
        <h3 className="text-lg font-bold text-white">Zmiana hasła</h3>
        <input type="password" autoComplete="new-password" placeholder="Nowe hasło" value={password} onChange={e => setPassword(e.target.value)} className={inputBase} />
        <input type="password" autoComplete="new-password" placeholder="Powtórz hasło" value={repeat} onChange={e => setRepeat(e.target.value)} className={inputBase} />
        <button type="submit" disabled={saving || !password} className={`${btnPrimary} ${btnDisabled} w-fit`}>{saving ? 'Zapisywanie...' : 'Zmień hasło'}</button>
      </form>

      <div className={`${glassCard} flex flex-wrap items-center justify-between gap-4`}>
        <h3 className="text-lg font-bold text-white">Eksport danych</h3>
        <button type="button" onClick={exportData} disabled={exporting} className={`${btnGhost} ${btnDisabled}`}>{exporting ? 'Pobieranie...' : 'Pobierz JSON'}</button>
      </div>

      {profile?.role === 'user' && (
        <div className={`${glassCard} flex flex-wrap items-center justify-between gap-4`}>
          <h3 className="text-lg font-bold text-white">Konto trenera</h3>
          <button type="button" onClick={upgradeToTrainer} className={btnGhost}>Zostań trenerem</button>
        </div>
      )}

      <div className={`${glassCard} flex flex-wrap items-center justify-between gap-4 border-red-500/30`}>
        <h3 className="text-lg font-bold text-white">Usuń konto</h3>
        <button type="button" onClick={deleteAccount} className={btnDanger}>Usuń konto</button>
      </div>
    </div>
  )
}
