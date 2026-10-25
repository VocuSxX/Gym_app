import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// Hook: siłownia należąca do zalogowanego właściciela (rola 'gym')
export function useMyGym(session: any) {
  const [gym, setGym] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    const { data } = await supabase.from('gyms').select('*').eq('owner_id', session.user.id).maybeSingle()
    setGym(data)
    setLoading(false)
  }

  useEffect(() => { refetch() }, [session])

  return { gym, loading, refetch }
}
