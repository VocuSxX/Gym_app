import { supabase } from '../supabaseClient'
import { useState } from 'react'

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
    <div className="max-w-2xl pb-20">
      <h1 className="text-3xl font-bold mb-6">Ustawienia Profilu</h1>
      <form onSubmit={handleSaveProfile} className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col gap-4 shadow-lg mb-8">
        <div>
          <label className="block text-gray-400 mb-1">Unikalny Nickname</label>
          <input type="text" required value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full p-2 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-pink-500" />
        </div>
        <div>
          <label className="block text-gray-400 mb-1">Płeć</label>
          <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-2 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-pink-500">
            <option value="not_specified">Nie chcę podawać</option>
            <option value="male">Mężczyzna</option>
            <option value="female">Kobieta</option>
          </select>
        </div>

        {profile?.role === 'trainer' && (
          <>
            <div className="h-px bg-gray-700 my-2"></div>
            <h3 className="font-bold text-pink-400">Opcje Trenerskie</h3>
            <div>
              <label className="block text-gray-400 mb-1">Doświadczenie (lata)</label>
              <input type="number" min="0" value={formData.experience_years} onChange={e => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})} className="w-full p-2 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Bio</label>
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full p-2 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-pink-500 h-24" />
            </div>
            <label className="flex items-center gap-3 mt-2 cursor-pointer">
              <input type="checkbox" checked={formData.is_public} onChange={e => setFormData({...formData, is_public: e.target.checked})} className="w-5 h-5 accent-pink-500" />
              <span>Chcę być widoczny w publicznym rankingu</span>
            </label>
          </>
        )}
        <button type="submit" disabled={saving} className="bg-pink-600 p-3 rounded font-bold hover:bg-pink-500 mt-4">{saving ? 'Zapisywanie...' : 'Zapisz zmiany'}</button>
      </form>

      {/* NOWA SEKCJA ZMIANY ROLI (tylko dla użytkowników) */}
      {profile?.role === 'user' && (
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-2">Strefa Eksperta</h3>
          <p className="text-gray-400 mb-4 text-sm">Masz doświadczenie i chcesz układać plany treningowe innym? Zmień swoje konto na profil Trenera.</p>
          <button type="button" onClick={upgradeToTrainer} className="bg-gray-800 border border-gray-600 text-gray-300 px-6 py-2 rounded font-bold hover:bg-pink-600 hover:text-white transition-colors">
            🚀 Zostań Trenerem
          </button>
        </div>
      )}
    </div>
  )
}