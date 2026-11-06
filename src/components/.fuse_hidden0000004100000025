import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { glassCard, inputBase } from '../ui'

export default function ProgressStats({ session }: { session: any }) {
  const [logs, setLogs] = useState<any[]>([])
  const [exercises, setExercises] = useState<string[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      // Pobieramy wszystkie ukończone serie zalogowanego ucznia
      const { data } = await supabase
        .from('exercise_logs')
        .select('exercise_name, weight, logged_at')
        .eq('client_id', session.user.id)
        .eq('is_completed', true)
        .order('logged_at', { ascending: true })

      if (data) {
        setLogs(data)
        // Wyciągamy unikalne nazwy ćwiczeń, żeby zrobić z nich listę rozwijaną (Słownik)
        const uniqueExercises = Array.from(new Set(data.map(log => log.exercise_name))) as string[]
        setExercises(uniqueExercises)
        if (uniqueExercises.length > 0) setSelectedExercise(uniqueExercises[0])
      }
      setLoading(false)
    }
    
    fetchLogs()
  }, [session])

  useEffect(() => {
    if (!selectedExercise) return
    
    // 1. Filtrujemy tylko wybrane ćwiczenie
    const filtered = logs.filter(log => log.exercise_name === selectedExercise)
    
    // 2. Grupujemy po dacie i szukamy MAKSYMALNEGO ciężaru z danego dnia
    const grouped = filtered.reduce((acc: any, curr: any) => {
      const date = new Date(curr.logged_at).toISOString().split('T')[0] // Format YYYY-MM-DD
      
      if (!acc[date] || acc[date].weight < curr.weight) {
        acc[date] = { date, weight: curr.weight }
      }
      return acc
    }, {})

    // 3. Konwertujemy obiekt z powrotem na tablicę pod wykres Recharts
    setChartData(Object.values(grouped))
  }, [selectedExercise, logs])

  if (loading) return <p className="text-zinc-400 font-bold animate-pulse">Pobieranie danych...</p>

  return (
    <div className="max-w-4xl w-full flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Twoje Postępy</h1>
        <p className="text-zinc-400">Śledź, jak rośnie Twoja siła.</p>
      </div>

      {exercises.length === 0 ? (
        <div className={`${glassCard} text-center py-16 flex flex-col gap-3 border-dashed`}>
          <span className="text-5xl">📈</span>
          <p className="text-xl font-bold text-white">Brak danych</p>
          <p className="text-zinc-400">Wykonaj najpierw kilka treningów w Dzienniku!</p>
        </div>
      ) : (
        <div className={`${glassCard} p-8 flex flex-col gap-8`}>
          <div className="flex flex-col gap-3">
            <label className="font-bold text-white">Wybierz ćwiczenie do analizy</label>
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className={inputBase}
            >
              {exercises.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          <div className="w-full rounded-2xl bg-black/20 border border-white/5 p-4" style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} />
                <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(9,9,11,0.85)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                  itemStyle={{ color: '#34d399' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#34d399" strokeWidth={4} dot={{ r: 5, fill: '#34d399' }} activeDot={{ r: 8 }} name="Max Ciężar (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 pt-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Historia wyników (max ciężar na dany dzień)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {chartData.map(d => (
                <div key={d.date} className="rounded-2xl bg-black/30 border border-white/5 p-4 flex flex-col gap-1 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/30">
                  <span className="text-zinc-400 text-sm">{d.date}</span>
                  <span className="text-emerald-400 font-extrabold text-2xl">{d.weight} kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

