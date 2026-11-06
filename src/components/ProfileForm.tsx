import { supabase } from '../supabaseClient'
import { useState } from 'react'
import { toast } from '../notify'
import { glassCard, btnPrimary, btnDisabled, inputBase } from '../ui'

export default function ProfileForm({ session, profile, initialData, fetchProfile }: any) {
  const [formData, setFormData] = useState(initialData)
  // Specjalizacje wpisujemy jako tekst rozdzielony przecinkami, tablicę budujemy dopiero przy zapisie
  const [specText, setSpecText] = useState<string>((initialData.specializations || []).join(', '))
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    // Przypomnienia zapisuje ich własny formularz, żeby ten zapis ich nie nadpisał starą wartością
    const { reminders: _reminders, ...rest } = formData
    const payload: any = { ...rest }
    if (profile?.role === 'trainer') {
      payload.specializations = specText.split(',').map(s => s.trim()).filter(Boolean).slice(0, 8)
    }
    const { error } = await supabase.from('profiles').update(payload).eq('id', session.user.id)
    if (error) {
      setSaving(false)
      return toast.error('Nie udało się zapisać profilu.')
    }
    toast.success('Profil zaktualizowany.')
    await fetchProfile()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSaveProfile} className={`${glassCard} flex flex-col gap-6`}>
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
        <div className="flex flex-col gap-6 rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
          <h3 className="text-sm font-bold text-accent-400">Opcje Trenerskie</h3>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Doświadczenie (lata)</label>
            <input type="number" min="0" value={formData.experience_years} onChange={e => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})} className={inputBase} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Bio</label>
            <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className={`${inputBase} h-28 resize-none`} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-white">Specjalizacje</label>
            <input type="text" value={specText} onChange={e => setSpecText(e.target.value)} placeholder="np. redukcja, siła, rehabilitacja (rozdziel przecinkami)" className={inputBase} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-white">Miasto</label>
              <input type="text" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className={inputBase} placeholder="Warszawa" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-white">Cennik (krótko)</label>
              <input type="text" value={formData.price_info || ''} onChange={e => setFormData({...formData, price_info: e.target.value})} className={inputBase} placeholder="np. 150 zł / sesja" />
            </div>
          </div>
          <label className="flex items-center gap-4 cursor-pointer">
            <input type="checkbox" checked={formData.is_public} onChange={e => setFormData({...formData, is_public: e.target.checked})} className="h-6 w-6 accent-accent-500" />
            <span className="text-zinc-400">Chcę być widoczny w publicznym rankingu</span>
          </label>
        </div>
      )}

      <button type="submit" disabled={saving} className={`${btnPrimary} ${btnDisabled}`}>
        {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
      </button>
    </form>
  )
}
