import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

  if (loading) return <p className="text-gray-400">Pobieranie danych...</p>

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Twoje Postępy</h1>
      
      {exercises.length === 0 ? (
        <p className="text-gray-500 italic">Brak danych. Wykonaj najpierw kilka treningów w Dzienniku!</p>
      ) : (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <label className="block text-gray-400 mb-2 font-bold">Wybierz ćwiczenie do analizy:</label>
          <select 
            value={selectedExercise} 
            onChange={e => setSelectedExercise(e.target.value)} 
            className="w-full p-3 rounded bg-gray-900 border border-gray-600 text-white outline-none focus:border-pink-500 mb-8"
          >
            {exercises.map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>

          <div className="w-full" style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} />
                <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                  itemStyle={{ color: '#F472B6' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#F472B6" strokeWidth={3} dot={{ r: 5, fill: '#F472B6' }} activeDot={{ r: 8 }} name="Max Ciężar (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-6">
            <h3 className="text-xl font-bold text-gray-300 mb-4">Historia wyników (Max ciężar na dany dzień)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {chartData.map(d => (
                <div key={d.date} className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex flex-col">
                  <span className="text-gray-500 text-sm mb-1">{d.date}</span>
                  <span className="text-pink-400 font-bold text-2xl">{d.weight} kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

  )
}