import { Stats } from '../lib/types'

interface StatsPanelProps {
  stats: Stats
  loading: boolean
}

export default function StatsPanel({ stats, loading }: StatsPanelProps) {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-20 bg-gray-100 dark:bg-surface-700/50 rounded-lg" />
      </div>
    )
  }

  const hasData = stats.todaySessions > 0 || stats.sevenDayChart.some(d => d.minutes > 0)
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
        </div>
      )}
    </div>
  )
}
