import { useState, useCallback } from 'react'
import { Stats } from '../lib/types'
import { supabase, supabaseReady } from '../lib/supabase'

export interface SessionRow {
  id: string
  method: string
  plannedDuration: number
  actualDuration: number
  completedAt: string
}

const EMPTY_STATS: Stats = {
  todaySessions: 0,
  todayMinutes: 0,
  sevenDayChart: [],
  streak: 0,
}

export function useStats(userId?: string | null) {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!supabaseReady || !userId) {
      setLoading(false)
      return
    }
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      // Fetch recent sessions for chart/stats (7 days)
      const { data: recentData, error: fetchError } = await supabase
        .from('Session')
        .select('*')
        .eq('userId', userId)
        .gte('completedAt', sevenDaysAgo.toISOString())
        .order('completedAt', { ascending: false })

      if (fetchError) throw fetchError

      // Fetch all sessions for history list (last 50)
      const { data: allData } = await supabase
        .from('Session')
        .select('*')
        .eq('userId', userId)
        .order('completedAt', { ascending: false })
        .limit(50)

      setSessions((allData ?? []) as SessionRow[])

      const recent = recentData ?? []
      const todaySessions = recent.filter(s => s.completedAt >= todayStart)
      const todayMinutes = todaySessions.reduce((sum: number, s: { actualDuration: number }) => sum + s.actualDuration, 0)

      const chartMap = new Map<string, number>()
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo)
        d.setDate(d.getDate() + i)
        chartMap.set(d.toISOString().split('T')[0], 0)
      }
      for (const s of recent) {
        const key = new Date(s.completedAt).toISOString().split('T')[0]
        if (chartMap.has(key)) chartMap.set(key, (chartMap.get(key) || 0) + s.actualDuration)
      }
      const sevenDayChart = Array.from(chartMap.entries()).map(([date, minutes]) => ({ date, minutes }))

      const daySet = new Set(recent.map((s: { completedAt: string }) => new Date(s.completedAt).toISOString().split('T')[0]))
      let streak = 0
      const check = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      while (daySet.has(check.toISOString().split('T')[0])) {
        streak++
        check.setDate(check.getDate() - 1)
      }

      setStats({ todaySessions: todaySessions.length, todayMinutes, sevenDayChart, streak })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : (e as {message?:string})?.message ?? 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const saveSession = useCallback(async (
    method: string,
    plannedDuration: number,
    actualDuration: number,
  ): Promise<string | null> => {
    if (!supabaseReady || !userId) return null
    try {
      const { error: insertError } = await supabase.from('Session').insert({
        id: crypto.randomUUID(),
        method,
        plannedDuration,
        actualDuration,
        completedAt: new Date().toISOString(),
        userId,
      })
      if (insertError) throw insertError
      await fetchStats()
      return null
    } catch (e) {
      const msg = e instanceof Error ? e.message : (e as {message?:string})?.message ?? 'Failed to save'
      setError(msg)
      return msg
    }
  }, [userId, fetchStats])

  const clearSessions = useCallback(async (): Promise<string | null> => {
    if (!supabaseReady || !userId) return null
    try {
      const { error: delError } = await supabase
        .from('Session')
        .delete()
        .eq('userId', userId)
      if (delError) throw delError
      setStats(EMPTY_STATS)
      setSessions([])
      return null
    } catch (e) {
      const msg = e instanceof Error ? e.message : (e as {message?:string})?.message ?? 'Failed to clear'
      return msg
    }
  }, [userId])

  return { stats, sessions, loading, error, fetchStats, saveSession, clearSessions }
}
