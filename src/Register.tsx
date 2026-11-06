import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { glassCard, btnPrimary, btnDisabled, inputBase } from './ui'
import { translateError } from './authErrors'
import Banner from './components/Banner'
import AuthShell from './components/AuthShell'

// Krok 1 z 3 rejestracji. Kroki 2 i 3 (ankieta) obsługuje Onboarding zaraz po założeniu konta.
export const REGISTER_LABELS_USER = ['Dane logowania', 'O Tobie', 'Twój cel']

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkMail, setCheckMail] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Hasło musi mieć co najmniej 6 znaków.')
    if (password !== password2) return setError('Hasła nie są takie same.')

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(translateError(error.message))
    } else if (!data.session) {
      // Włączone potwierdzanie e-maila: ankieta zacznie się po pierwszym zalogowaniu
      setCheckMail(true)
    }
    // Gdy jest sesja, App sam przenosi na /dashboard, gdzie startuje ankieta (krok 2)
    setLoading(false)
  }

  if (checkMail) {
    return (
      <AuthShell title="Sprawdź skrzynkę" subtitle="Wysłaliśmy link potwierdzający na Twój adres e-mail." step={1} labels={REGISTER_LABELS_USER}>
        <div className={`${glassCard} p-8 flex flex-col gap-6 text-center`}>
          <p className="text-zinc-400">Kliknij link w wiadomości, a potem zaloguj się. Po pierwszym logowaniu poprowadzimy Cię przez ankietę.</p>
          <Link to="/login" className={`${btnPrimary} text-center`}>Przejdź do logowania</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Dołącz do wspólnoty" subtitle="Załóż konto. To zajmie minutę." step={1} labels={REGISTER_LABELS_USER}>
      <form onSubmit={handleRegister} className={`${glassCard} p-8 flex flex-col gap-6`}>
        <Banner type="error" message={error} />

        <div className="flex flex-col gap-4">
          <input type="email" placeholder="Twój e-mail" value={email} onChange={e => setEmail(e.target.value)} className={inputBase} required />
          <input type="password" placeholder="Hasło (min. 6 znaków)" value={password} onChange={e => setPassword(e.target.value)} className={inputBase} required />
          <input type="password" placeholder="Powtórz hasło" value={password2} onChange={e => setPassword2(e.target.value)} className={inputBase} required />
        </div>

        <button type="submit" disabled={loading} className={`${btnPrimary} ${btnDisabled}`}>
          {loading ? 'Tworzenie konta...' : 'Dalej'}
        </button>

        <Link to="/login" className="text-center text-sm text-zinc-400 transition-colors duration-200 hover:text-white">
          Masz już konto? <span className="font-bold text-accent-400">Zaloguj się</span>
        </Link>
      </form>
    </AuthShell>
  )
}
