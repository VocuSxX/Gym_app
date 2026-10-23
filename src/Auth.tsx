import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import { glassCard, btnPrimary, btnDisabled, inputBase, ambientBlobs } from './ui'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(error.message)
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Konto utworzone! Możesz się zalogować.')
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
