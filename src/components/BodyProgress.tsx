import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { confirmDialog, toast } from '../notify'
import { glassCard, btnPrimarySm, btnGhost, btnDanger, inputBase } from '../ui'
import { todayStr } from '../health'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Icon from './Icon'

type Measurement = {
  measured_on: string
  weight_kg: number | null
  waist_cm: number | null
  chest_cm: number | null
  hips_cm: number | null
  arm_cm: number | null
  thigh_cm: number | null
}
type Photo = { id: string; taken_on: string; path: string; url?: string }

const FIELDS: { key: keyof Omit<Measurement, 'measured_on'>; label: string; unit: string }[] = [
  { key: 'weight_kg', label: 'Waga', unit: 'kg' },
  { key: 'waist_cm', label: 'Talia', unit: 'cm' },
  { key: 'chest_cm', label: 'Klatka', unit: 'cm' },
  { key: 'hips_cm', label: 'Biodra', unit: 'cm' },
  { key: 'arm_cm', label: 'Ramię', unit: 'cm' },
  { key: 'thigh_cm', label: 'Udo', unit: 'cm' },
]

const MAX_PHOTO_BYTES = 8 * 1024 * 1024

// Pomiary ciała (wykres, zmiana od początku) i zdjęcia sylwetki w prywatnym magazynie
export default function BodyProgress({ session, fetchProfile }: { session: any; fetchProfile?: () => Promise<void> }) {
  const me = session.user.id
  const [rows, setRows] = useState<Measurement[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [date, setDate] = useState(todayStr())
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const loadRows = async () => {
    const { data } = await supabase.from('body_measurements').select('measured_on, weight_kg, waist_cm, chest_cm, hips_cm, arm_cm, thigh_cm').eq('user_id', me).order('measured_on', { ascending: true })
    setRows(((data || []) as any[]).map(r => ({
      ...r,
      weight_kg: r.weight_kg == null ? null : Number(r.weight_kg),
      waist_cm: r.waist_cm == null ? null : Number(r.waist_cm),
      chest_cm: r.chest_cm == null ? null : Number(r.chest_cm),
      hips_cm: r.hips_cm == null ? null : Number(r.hips_cm),
      arm_cm: r.arm_cm == null ? null : Number(r.arm_cm),
      thigh_cm: r.thigh_cm == null ? null : Number(r.thigh_cm),
    })))
  }

  const loadPhotos = async () => {
    const { data } = await supabase.from('progress_photos').select('id, taken_on, path').eq('user_id', me).order('taken_on', { ascending: true })
    const list = (data || []) as Photo[]
    if (list.length > 0) {
      const { data: signed } = await supabase.storage.from('progress-photos').createSignedUrls(list.map(p => p.path), 3600)
      const urls: Record<string, string> = {}
      ;(signed || []).forEach((s: any) => { if (s.path && s.signedUrl) urls[s.path] = s.signedUrl })
      list.forEach(p => { p.url = urls[p.path] })
    }
    setPhotos(list)
  }

  useEffect(() => { loadRows(); loadPhotos() }, [session])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, any> = { user_id: me, measured_on: date }
    let any = false
    FIELDS.forEach(f => {
      const v = Number(values[f.key])
      if (values[f.key] && Number.isFinite(v) && v > 0) { payload[f.key] = v; any = true }
    })
    if (!any) return toast.error('Wpisz przynajmniej jeden pomiar.')
    setSaving(true)
    // Nie nadpisujemy pól, których nie wpisano (dopisujemy do istniejącego pomiaru z tego dnia)
    const existing = rows.find(r => r.measured_on === date)
    const merged = { ...(existing || {}), ...payload }
    const { error } = await supabase.from('body_measurements').upsert(merged, { onConflict: 'user_id,measured_on' })
    setSaving(false)
    if (error) return toast.error('Nie udało się zapisać pomiaru.')
    // Dzisiejsza waga aktualizuje też profil (cele kalorii i wody liczą się z wagi)
    if (payload.weight_kg && date === todayStr()) {
      await supabase.from('profiles').update({ weight_kg: payload.weight_kg }).eq('id', me)
      await fetchProfile?.()
    }
    toast.success('Pomiar zapisany.')
    setValues({})
    loadRows()
  }

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Wybierz plik graficzny.')
    if (file.size > MAX_PHOTO_BYTES) return toast.error('Zdjęcie jest za duże (maks. 8 MB).')
    setUploading(true)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${me}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || 'jpg'}`
    const { error } = await supabase.storage.from('progress-photos').upload(path, file, { contentType: file.type })
    if (error) {
      setUploading(false)
      return toast.error('Nie udało się wysłać zdjęcia.')
    }
    const { error: rowError } = await supabase.from('progress_photos').insert({ user_id: me, taken_on: todayStr(), path })
    setUploading(false)
    if (rowError) {
      await supabase.storage.from('progress-photos').remove([path])
      return toast.error('Nie udało się zapisać zdjęcia.')
    }
    toast.success('Zdjęcie dodane.')
    loadPhotos()
  }

  const removePhoto = async (p: Photo) => {
    if (!(await confirmDialog('Usunąć to zdjęcie bezpowrotnie?', { confirmLabel: 'Usuń' }))) return
    await supabase.storage.from('progress-photos').remove([p.path])
    await supabase.from('progress_photos').delete().eq('id', p.id)
    loadPhotos()
  }

  const weightPoints = rows.filter(r => r.weight_kg != null).map(r => ({ date: r.measured_on, weight: r.weight_kg }))
  const first = rows[0]
  const last = rows[rows.length - 1]
  const delta = (key: keyof Omit<Measurement, 'measured_on'>) => {
    const a = rows.find(r => r[key] != null)?.[key]
    const b = [...rows].reverse().find(r => r[key] != null)?.[key]
    if (a == null || b == null || rows.length < 2) return null
    return Math.round((Number(b) - Number(a)) * 10) / 10
  }

  return (
    <div className="max-w-3xl w-full flex flex-col gap-8 animate-fade-in">

      <form onSubmit={save} className={`${glassCard} flex flex-col gap-5`}>
        <h2 className="text-xl font-bold text-white">Nowy pomiar</h2>
        <input type="date" value={date} max={todayStr()} onChange={e => setDate(e.target.value)} className={`${inputBase} sm:!w-56`} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FIELDS.map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-400">{f.label} ({f.unit})</label>
              <input type="number" step="any" min={0} value={values[f.key] || ''} onChange={e => setValues({ ...values, [f.key]: e.target.value })} className={inputBase} />
            </div>
          ))}
        </div>
        <button type="submit" disabled={saving} className={`${btnPrimarySm} disabled:opacity-50 disabled:pointer-events-none`}>{saving ? 'Zapisywanie...' : 'Zapisz pomiar'}</button>
      </form>

      {rows.length >= 2 && first && last && (
        <div className={`${glassCard} flex flex-col gap-5`}>
          <h2 className="text-xl font-bold text-white">Zmiana od {first.measured_on}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FIELDS.map(f => {
              const d = delta(f.key)
              if (d === null) return null
              return (
                <div key={f.key} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs font-bold text-zinc-400">{f.label}</p>
                  <p className={`text-2xl font-extrabold ${d === 0 ? 'text-zinc-300' : 'text-accent-400'}`}>{d > 0 ? '+' : ''}{d} {f.unit}</p>
                </div>
              )
            })}
          </div>
          {weightPoints.length >= 2 && (
            <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4" style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightPoints} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(9,9,11,0.85)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} itemStyle={{ color: '#6f93ff' }} />
                  <Line type="monotone" dataKey="weight" stroke="#6f93ff" strokeWidth={3} dot={{ r: 4, fill: '#6f93ff' }} name="Waga (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className={`${glassCard} flex flex-col gap-5`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Zdjęcia sylwetki</h2>
          <label className={`${btnGhost} cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? 'Wysyłanie...' : <><Icon name="plus" size={16} />Dodaj zdjęcie</>}
            <input type="file" accept="image/*" onChange={upload} className="hidden" />
          </label>
        </div>

        {photos.length >= 2 && photos[0].url && photos[photos.length - 1].url && (
          <div className="grid grid-cols-2 gap-3">
            {[photos[0], photos[photos.length - 1]].map((p, i) => (
              <div key={p.id} className="flex flex-col gap-2">
                <img src={p.url} alt={i === 0 ? 'Pierwsze zdjęcie' : 'Najnowsze zdjęcie'} className="aspect-[3/4] w-full rounded-2xl border border-zinc-800 object-cover" />
                <p className="text-center text-xs font-bold text-zinc-400">{i === 0 ? 'Początek' : 'Teraz'} · {p.taken_on}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map(p => (
            <div key={p.id} className="group relative">
              {p.url ? <img src={p.url} alt={`Zdjęcie z ${p.taken_on}`} className="aspect-[3/4] w-full rounded-2xl border border-zinc-800 object-cover" /> : <div className="aspect-[3/4] w-full rounded-2xl bg-zinc-800" />}
              <p className="mt-1 text-center text-xs text-zinc-400">{p.taken_on}</p>
              <button type="button" onClick={() => removePhoto(p)} className={`${btnDanger} absolute right-2 top-2 !px-3 !py-1`} aria-label="Usuń zdjęcie"><Icon name="trash" size={16} /></button>
            </div>
          ))}
        </div>
        {photos.length === 0 && <p className="text-center text-sm text-zinc-400">Brak zdjęć. Dodaj pierwsze, a po kilku tygodniach zobaczysz porównanie.</p>}
      </div>
    </div>
  )
}
