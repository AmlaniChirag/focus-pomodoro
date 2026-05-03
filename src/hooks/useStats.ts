import { useState, useCallback } from 'react'
import { Stats } from '../lib/types'

const EMPTY_STATS: Stats = {
  todaySessions: 0,
  todayMinutes: 0,
  sevenDayChart: [],
  streak: 0,
}

export function useStats() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSession = useCallback(async (
    method: string,
    plannedDuration: number,
    actualDuration: number
  ) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, plannedDuration, actualDuration }),
      })
      if (!res.ok) throw new Error('Failed to save session')
      await fetchStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
      return e instanceof Error ? e.message : 'Failed to save'
    }
    return null
  }, [fetchStats])

  return { stats, loading, error, fetchStats, saveSession }
}
