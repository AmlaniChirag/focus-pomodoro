import { useState, useCallback } from 'react'
import { Stats } from '../lib/types'
import { supabase } from '../lib/supabase'

const EMPTY_STATS: Stats = {
  todaySessions: 0,
  todayMinutes: 0,
  sevenDayChart: [],
  streak: 0,
}

export function useStats(userId?: string | null) {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      let query = supabase.from('Session').select('*').gte('completedAt', sevenDaysAgo.toISOString())
      if (userId) query = query.eq('userId', userId)

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      const sessions = data ?? []

      const todaySessions = sessions.filter(s => s.completedAt >= todayStart)
      const todayMinutes = todaySessions.reduce((sum: number, s: { actualDuration: number }) => sum + s.actualDuration, 0)

      // Build 7-day chart
      const chartMap = new Map<string, number>()
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo)
        d.setDate(d.getDate() + i)
        chartMap.set(d.toISOString().split('T')[0], 0)
      }
      for (const s of sessions) {
        const key = new Date(s.completedAt).toISOString().split('T')[0]
        if (chartMap.has(key)) chartMap.set(key, (chartMap.get(key) || 0) + s.actualDuration)
      }
      const sevenDayChart = Array.from(chartMap.entries()).map(([date, minutes]) => ({ date, minutes }))

      // Streak: consecutive days ending today
      const daySet = new Set(sessions.map((s: { completedAt: string }) => new Date(s.completedAt).toISOString().split('T')[0]))
      let streak = 0
      const check = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      while (daySet.has(check.toISOString().split('T')[0])) {
        streak++
        check.setDate(check.getDate() - 1)
      }

      setStats({ todaySessions: todaySessions.length, todayMinutes, sevenDayChart, streak })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const saveSession = useCallback(async (
    method: string,
    plannedDuration: number,
    actualDuration: number,
  ): Promise<string | null> => {
    try {
      const { error: insertError } = await supabase.from('Session').insert({
        method,
        plannedDuration,
        actualDuration,
        completedAt: new Date().toISOString(),
        userId: userId ?? null,
      })
      if (insertError) throw insertError
      await fetchStats()
      return null
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save'
      setError(msg)
      return msg
    }
  }, [userId, fetchStats])

  return { stats, loading, error, fetchStats, saveSession }
}
