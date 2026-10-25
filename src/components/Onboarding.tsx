import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { glassCard, btnPrimary, btnDisabled, inputBase, ambientBlobs } from '../ui'
import Banner from './Banner'
import { ageFromBirth } from '../health'

export default function Onboarding({ session, profile, fetchProfile }: { session: any; profile: any; fetchProfile: () => Promise<void> }) {
  const [form, setForm] = useState({
    role: profile?.role || 'user',
    nickname: profile?.nickname || '',
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    gender: profile?.gender && profile.gender !== 'not_specified' ? profile.gender : '',
    birth_date: profile?.birth_date || '',
    height_cm: profile?.height_cm ? String(profile.height_cm) : '',
    weight_kg: profile?.weight_kg ? String(profile.weight_kg) : '',
    activity_level: profile?.activity_level || 'moderate',
    goal: profile?.goal || 'maintain',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string) => setForm({ ...form, [field]: value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const height = parseInt(form.height_cm)
    const weight = parseFloat(form.weight_kg)
    const age = form.birth_date ? ageFromBirth(form.birth_date) : 0
      ? Math.floor((Date.now() - new Date(form.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
      : 0

    if (form.nickname.trim().length < 3) return setError('Nickname musi mieć co najmniej 3 znaki.')
    if (!form.first_name.trim() || !form.last_name.trim()) return setError('Podaj imię i nazwisko.')
    if (!form.gender) return setError('Wybierz płeć (potrzebna do kalkulatora kalorii).')
    if (!form.birth_date || age < 13 || age > 100) return setError('Podaj poprawną datę urodzenia (min. 13 lat).')
    if (!height || height < 100 || height > 250) return setError('Wzrost musi mieścić się w zakresie 100–250 cm.')
    if (!weight || weight < 30 || weight > 300) return setError('Waga musi mieścić się w zakresie 30–300 kg.')

    setSaving(true)
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        role: form.role,
        nickname: form.nickname.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        gender: form.gender,
        birth_date: form.birth_date,
        height_cm: height,
        weight_kg: weight,
        activity_level: form.activity_level,
        goal: form.goal,
        onboarding_done: true,
      })
      .eq('id', session.user.id)

    if (dbError) {
      setError(dbError.code === '23505' ? 'Ten nickname jest już zajęty. Wybierz inny.' : 'Nie udało się zapisać profilu: ' + dbError.message)
      setSaving(false)
      return
    }

    await fetchProfile()
    setSaving(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 text-white p-4 md:p-6">
      {ambientBlobs.map((cls, i) => <div key={i} className={cls} />)}

      <form onSubmit={handleSubmit} className={`${glassCard} relative z-10 w-full max-w-2xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in`}>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Pierwsze kroki</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Uzupełnij swój profil</h1>
          <p className="text-zinc-400">Te dane posłużą do wyliczenia Twojego zapotrzebowania kalorycznego.</p>
        </div>

        <Banner type="error" message={error} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-white">Typ konta</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className={inputBase}>
              <option value="user">🏋️ Ćwiczący</option>
              <option value="trainer">🎓 Trener</option>
              <option value="gym">🏢 Siłownia (właściciel)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="font-bold text-white">Nickname</label>
            <input type="text" value={form.nickname} onChange={e => set('nickname', e.target.value)} className={inputBase} placeholder="np. silacz92" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Imię</label>
            <input type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)} className={inputBase} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Nazwisko</label>
            <input type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)} className={inputBase} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Płeć</label>
            <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputBase}>
              <option value="">-- Wybierz --</option>
              <option value="male">Mężczyzna</option>
              <option value="female">Kobieta</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Data urodzenia</label>
            <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} className={inputBase} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Wzrost (cm)</label>
            <input type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} className={inputBase} placeholder="180" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Waga (kg)</label>
            <input type="number" step="0.1" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} className={inputBase} placeholder="75" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Aktywność</label>
            <select value={form.activity_level} onChange={e => set('activity_level', e.target.value)} className={inputBase}>
              <option value="sedentary">Siedzący tryb życia</option>
              <option value="light">Lekka (1–2 treningi / tydz.)</option>
              <option value="moderate">Umiarkowana (3–4 treningi / tydz.)</option>
              <option value="active">Wysoka (5–6 treningów / tydz.)</option>
              <option value="very_active">Bardzo wysoka (codziennie / praca fizyczna)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Cel</label>
            <select value={form.goal} onChange={e => set('goal', e.target.value)} className={inputBase}>
              <option value="lose">Redukcja</option>
              <option value="maintain">Utrzymanie wagi</option>
              <option value="gain">Masa</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={saving} className={`${btnPrimary} ${btnDisabled}`}>
          {saving ? 'Zapisywanie...' : 'Zapisz i zaczynamy'}
        </button>

        <button type="button" onClick={() => supabase.auth.signOut()} className="text-sm text-zinc-400 transition-colors duration-200 hover:text-white">
          Wyloguj
        </button>
      </form>
    </div>
  )
}
