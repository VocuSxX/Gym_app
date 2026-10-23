import { supabase } from '../supabaseClient'
import { useState } from 'react'
import { glassCard, btnPrimary, btnGhost, btnDisabled, inputBase } from '../ui'

export default function ProfileSettings({ session, profile, initialData, fetchProfile }: any) {
  const [formData, setFormData] = useState(initialData)
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('profiles').update(formData).eq('id', session.user.id)
    alert("Profil zaktualizowany!")
    await fetchProfile()
    setSaving(false)
  }

  // PRZENIESIONA FUNKCJA Z APP.TSX:
  const upgradeToTrainer = async () => {
    if (window.confirm("Czy na pewno chcesz zmienić konto na profil Trenera? Ta akcja odblokuje nowe narzędzia.")) {
      await supabase.from('profiles').update({ role: 'trainer' }).eq('id', session.user.id)
      fetchProfile()
    }
  }

  return (
    <div className="max-w-2xl w-full pb-20 flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Ustawienia Profilu</h1>
        <p className="text-zinc-400">Zadbaj o swój profil i widoczność w społeczności.</p>
      </div>

      <form onSubmit={handleSaveProfile} className={`${glassCard} p-8 flex flex-col gap-6`}>
        <div className="flex flex-col gap-2">
          <label className="font-bold text-white">Unikalny Nickname</label>
          <input type="text" required value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className={inputBase} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold text-white">Płeć</label>
          <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className={inputBase}>
            <option value="not_specified">Nie chcę podawać</option>
            <option value="male">Mężczyzna</option>
            <option value="female">Kobieta</option>
          </select>
        </div>

        {profile?.role === 'trainer' && (
          <div className="flex flex-col gap-6 rounded-2xl bg-black/20 border border-white/5 p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Opcje Trenerskie</h3>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-white">Doświadczenie (lata)</label>
              <input type="number" min="0" value={formData.experience_years} onChange={e => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})} className={inputBase} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-white">Bio</label>
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className={`${inputBase} h-28 resize-none`} />
            </div>
            <label className="flex items-center gap-4 cursor-pointer">
              <input type="checkbox" checked={formData.is_public} onChange={e => setFormData({...formData, is_public: e.target.checked})} className="h-6 w-6 accent-emerald-500" />
              <span className="text-zinc-400">Chcę być widoczny w publicznym rankingu</span>
            </label>
          </div>
        )}

        <button type="submit" disabled={saving} className={`${btnPrimary} ${btnDisabled}`}>
          {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </button>
      </form>

      {/* SEKCJA ZMIANY ROLI (tylko dla użytkowników) */}
      {profile?.role === 'user' && (
        <div className={`${glassCard} p-8 flex flex-col gap-4 border-violet-500/20`}>
          <h3 className="text-2xl font-bold text-white">Strefa Eksperta</h3>
          <p className="text-zinc-400">Masz doświadczenie i chcesz układać plany treningowe innym? Zmień swoje konto na profil Trenera.</p>
          <button type="button" onClick={upgradeToTrainer} className={`${btnGhost} w-fit`}>
            🚀 Zostań Trenerem
          </button>
        </div>
      )}
    </div>
  )
}

