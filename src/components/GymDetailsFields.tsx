import { inputBase } from '../ui'
import { AMENITIES, EQUIPMENT, type GymForm } from '../gymConfig'
import Icon from './Icon'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-bold text-white">{label}</label>
      {children}
    </div>
  )
}

// Pola profilu siłowni. Używane w ankiecie (basic -> details) i w panelu siłowni (all).
export default function GymDetailsFields({ form, setForm, part }: {
  form: GymForm
  setForm: (f: GymForm) => void
  part: 'basic' | 'details' | 'all'
}) {
  const set = (key: keyof GymForm, value: any) => setForm({ ...form, [key]: value })
  const toggleAmenity = (a: string) =>
    set('amenities', form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a])

  const toggleEquipment = (a: string) =>
    set('equipment', form.equipment.includes(a) ? form.equipment.filter(x => x !== a) : [...form.equipment, a])

  const chip = (label: string, on: boolean, onClick: () => void) => (
    <button
      type="button"
      key={label}
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-[background-color,border-color,color,transform] duration-150 active:scale-[.97] ${on ? 'border-accent-500/40 bg-accent-500/15 text-accent-400' : 'border-zinc-800 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
    >
      {on && <Icon name="check" size={14} />}{label}
    </button>
  )

  return (
    <div className="flex flex-col gap-6">
      {part !== 'details' && (
        <>
          <Field label="Nazwa siłowni">
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputBase} placeholder="np. Iron Gym" />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Miasto">
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputBase} placeholder="Warszawa" />
            </Field>
            <Field label="Adres">
              <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={inputBase} placeholder="ul. Przykładowa 1" />
            </Field>
          </div>
        </>
      )}

      {part !== 'basic' && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Telefon (opcjonalnie)">
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputBase} placeholder="+48 123 456 789" />
            </Field>
            <Field label="E-mail kontaktowy (opcjonalnie)">
              <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} className={inputBase} placeholder="kontakt@siłownia.pl" />
            </Field>
          </div>
          <Field label="Strona WWW (opcjonalnie)">
            <input type="url" value={form.website} onChange={e => set('website', e.target.value)} className={inputBase} placeholder="https://" />
          </Field>
          <Field label="Godziny otwarcia">
            <input type="text" value={form.opening_hours} onChange={e => set('opening_hours', e.target.value)} className={inputBase} placeholder="Pn–Pt 6:00–23:00, Sb–Nd 8:00–20:00" />
          </Field>
          <Field label="Opis (opcjonalnie)">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} className={`${inputBase} h-24 resize-none`} />
          </Field>

          <Field label="Udogodnienia">
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(a => chip(a, form.amenities.includes(a), () => toggleAmenity(a)))}
            </div>
          </Field>

          <Field label="Sprzęt i maszyny">
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map(a => chip(a, form.equipment.includes(a), () => toggleEquipment(a)))}
            </div>
          </Field>

          <label className="flex cursor-pointer items-center gap-4">
            <input type="checkbox" checked={form.is_public} onChange={e => set('is_public', e.target.checked)} className="h-6 w-6 accent-accent-500" />
            <span className="text-zinc-400">Widoczna publicznie (ćwiczący mogą się do niej zapisać)</span>
          </label>
        </>
      )}
    </div>
  )
}
