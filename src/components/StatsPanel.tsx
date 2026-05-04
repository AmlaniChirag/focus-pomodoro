import { useState } from 'react'
import { Stats } from '../lib/types'
import type { SessionRow } from '../hooks/useStats'

const METHOD_LABELS: Record<string, string> = {
  pomodoro: 'Pomodoro',
  deepwork: 'Deep Work',
  '5217': '52/17',
  flowtime: 'Flowtime',
}

interface StatsPanelProps {
  stats: Stats
  sessions: SessionRow[]
  loading: boolean
  onClear: () => Promise<string | null>
  onDeleteSession: (id: string) => Promise<string | null>
}

export default function StatsPanel({ stats, sessions, loading, onClear, onDeleteSession }: StatsPanelProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleClear = async () => {
    if (!confirming) { setConfirming(true); return }
    setClearing(true)
    await onClear()
    setClearing(false)
    setConfirming(false)
    setShowHistory(false)
  }

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-20 bg-gray-100 dark:bg-surface-700/50 rounded-lg" />
      </div>
    )
  }

  const hasData = sessions.length > 0 || stats.todaySessions > 0 || stats.sevenDayChart.some(d => d.minutes > 0)
  const maxMinutes = Math.max(...stats.sevenDayChart.map(d => d.minutes), 1)

  return (
    <div className="card">
      {!hasData ? (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-surface-200/60 text-sm">No sessions yet.</p>
          <p className="text-gray-400 dark:text-surface-200/40 text-xs mt-1">
            Complete your first focus session to see stats here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todaySessions}</p>
              <p className="text-xs text-gray-400 dark:text-surface-200/50">Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayMinutes}</p>
              <p className="text-xs text-gray-400 dark:text-surface-200/50">Minutes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-500 dark:text-accent-400">{stats.streak}</p>
              <p className="text-xs text-gray-400 dark:text-surface-200/50">Day Streak</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-1 h-16" aria-label="7-day focus chart">
            {stats.sevenDayChart.map((day, i) => {
              const height = Math.max(4, (day.minutes / maxMinutes) * 100)
              const dayLabel = new Date(day.date).toLocaleDateString('en', { weekday: 'short' })
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full rounded-sm bg-accent-500/70 transition-all duration-300"
                    style={{ height: `${height}%` }}
                    title={`${dayLabel}: ${day.minutes} min`}
                    aria-label={`${dayLabel}: ${day.minutes} minutes`}
                  />
                  <span className="text-[10px] text-gray-400 dark:text-surface-200/40">{dayLabel.charAt(0)}</span>
                </div>
              )
            })}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5">
            <button
              onClick={() => setShowHistory(v => !v)}
              className="text-xs text-gray-400 dark:text-surface-200/40 hover:text-gray-600 dark:hover:text-surface-200/70 transition-colors"
            >
              {showHistory ? '▲ Hide history' : `▼ History (${sessions.length})`}
            </button>
            <button
              onClick={handleClear}
              disabled={clearing}
              className={`text-xs transition-colors ${
                confirming
                  ? 'text-red-500 dark:text-red-400 font-medium'
                  : 'text-gray-300 dark:text-surface-200/20 hover:text-red-400 dark:hover:text-red-400'
              }`}
            >
              {clearing ? 'Clearing…' : confirming ? 'Confirm clear all?' : 'Clear data'}
            </button>
          </div>

          {confirming && !clearing && (
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-gray-400 dark:text-surface-200/30 hover:text-gray-600 text-center"
            >
              Cancel
            </button>
          )}

          {/* Session history */}
          {showHistory && sessions.length > 0 && (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {sessions.map(s => {
                const date = new Date(s.completedAt)
                const timeStr = date.toLocaleString('en', {
                  month: 'short', day: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg
                      bg-gray-50 dark:bg-surface-700/30 text-xs gap-2"
                  >
                    <span className="text-gray-600 dark:text-surface-200/60 w-20 shrink-0">
                      {METHOD_LABELS[s.method] ?? s.method}
                    </span>
                    <span className="text-gray-400 dark:text-surface-200/40 flex-1">{timeStr}</span>
                    <span className="font-medium text-gray-700 dark:text-surface-200/80 tabular-nums w-8 text-right">
                      {s.actualDuration > 0 ? `${s.actualDuration}m` : '<1m'}
                    </span>
                    <button
                      onClick={async () => {
                        setDeletingId(s.id)
                        await onDeleteSession(s.id)
                        setDeletingId(null)
                      }}
                      disabled={deletingId === s.id}
                      className="text-gray-300 dark:text-surface-200/20 hover:text-red-400 dark:hover:text-red-400
                        transition-colors ml-1 disabled:opacity-40"
                      aria-label="Delete session"
                    >
                      {deletingId === s.id ? '…' : '×'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
