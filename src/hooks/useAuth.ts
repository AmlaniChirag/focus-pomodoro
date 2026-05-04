import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, supabaseReady } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const sendMagicLink = async (email: string) => {
    if (!supabaseReady) return 'Supabase not configured'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return error?.message ?? null
  }

  const signOut = () => supabase.auth.signOut()

  return { user, loading, sendMagicLink, signOut }
}
