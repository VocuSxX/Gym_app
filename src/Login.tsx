import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { glassCard, btnPrimary, btnDisabled, inputBase } from './ui'
import { translateError } from './authErrors'
import Banner from './components/Banner'
import AuthShell from './components/AuthShell'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    // Po udanym logowaniu App przełącza widok na /dashboard
    if (error) setError(translateError(error.message))
    setLoading(false)
  }

  return (
    <AuthShell title="Stacja Logowania" subtitle="Zaloguj się i wróć do treningu.">
      <form onSubmit={handleLogin} className={`${glassCard} p-8 flex flex-col gap-6`}>
        <Banner type="error" message={error} />

        <div className="flex flex-col gap-4">
          <input type="email" placeholder="Twój e-mail" value={email} onChange={e => setEmail(e.target.value)} className={inputBase} required />
          <input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} className={inputBase} required />
        </div>

        <button type="submit" disabled={loading} className={`${btnPrimary} ${btnDisabled}`}>
          {loading ? 'Ładowanie...' : 'Zaloguj się'}
        </button>

        <Link to="/register" className="text-center text-sm text-zinc-400 transition-colors duration-200 hover:text-white">
          Nie masz konta? <span className="font-bold text-accent-400">Dołącz do wspólnoty</span>
        </Link>
      </form>
    </AuthShell>
  )
}
