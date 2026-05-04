import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabaseReady = Boolean(url && key)
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key',
)

export type Database = {
  public: {
    Tables: {
      Session: {
        Row: {
          id: string
          method: string
          plannedDuration: number
          actualDuration: number
          completedAt: string
          createdAt: string
          userId: string | null
        }
        Insert: {
          id?: string
          method: string
          plannedDuration: number
          actualDuration: number
          completedAt: string
          userId?: string | null
        }
      }
    }
  }
}
