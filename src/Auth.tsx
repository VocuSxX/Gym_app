import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

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
    <div className="flex h-screen flex-col items-center justify-center bg-zinc-900 text-white gap-6">
      <h1 className="text-4xl font-bold">Stacja Logowania</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-80 bg-zinc-800 p-8 rounded-3xl shadow-lg border border-zinc-700/50">
        <input
          type="email"
          placeholder="Twój e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 rounded-2xl bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 rounded-2xl bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
        <button type="submit" disabled={loading} className="bg-emerald-600 p-3 rounded-2xl font-bold hover:bg-emerald-500 active:scale-95 transition-all">
          {loading ? 'Ładowanie...' : 'Zaloguj się'}
        </button>
        <button type="button" onClick={handleSignUp} disabled={loading} className="text-zinc-400 text-sm mt-2 hover:text-white transition-colors">
          Nie masz konta? Zarejestruj się
        </button>
      </form>
    </div>
  )
}