import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import { glassCard, btnPrimary, btnDisabled, inputBase, ambientBlobs } from './ui'
import Banner from './components/Banner'

const translateError = (msg: string) => {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Nieprawidłowy e-mail lub hasło.'
  if (m.includes('already registered')) return 'Konto z takim e-mailem już istnieje.'
  if (m.includes('password should be at least')) return 'Hasło musi mieć co najmniej 6 znaków.'
  if (m.includes('email not confirmed')) return 'Potwierdź e-mail, klikając link w wiadomości.'
  if (m.includes('invalid email') || m.includes('unable to validate email')) return 'Podaj poprawny adres e-mail.'
  if (m.includes('rate limit')) return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.'
  return msg
}

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(translateError(error.message))
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    setError('')
    setInfo('')
    if (!email || !password) {
      setError('Wpisz e-mail i hasło, aby założyć konto.')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(translateError(error.message))
    } else if (data.session) {
      navigate('/dashboard')
    } else {
      setInfo('Konto utworzone! Sprawdź skrzynkę e-mail i potwierdź adres, potem zaloguj się.')
    }
    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 text-white p-6">
      {ambientBlobs.map((cls, i) => <div key={i} className={cls} />)}

      <div className="relative z-10 flex w-full max-w-md flex-col gap-8 animate-fade-in">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-3xl shadow-lg shadow-emerald-500/25">
            🏋️
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Stacja Logowania</h1>
          <p className="text-zinc-400">Zaloguj się i wróć do treningu.</p>
        </div>

        <form onSubmit={handleLogin} className={`${glassCard} p-8 flex flex-col gap-6`}>
          <Banner type="error" message={error} />
          <Banner type="success" message={info} />

          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Twój e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputBase}
              required
            />
            <input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputBase}
              required
            />
          </div>

          <button type="submit" disabled={loading} className={`${btnPrimary} ${btnDisabled}`}>
            {loading ? 'Ładowanie...' : 'Zaloguj się'}
          </button>

          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="text-zinc-400 text-sm transition-colors duration-200 hover:text-white"
          >
            Nie masz konta? <span className="font-bold text-emerald-400">Zarejestruj się</span>
          </button>
        </form>
      </div>
    </div>
  )
}
