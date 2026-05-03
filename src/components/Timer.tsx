import { useEffect } from 'react'
import { FocusMethod } from '../lib/types'
import { getMethodConfig } from '../lib/storage'

interface TimerProps {
  method: FocusMethod
  displaySeconds: number
  phase: 'focus' | 'break' | 'idle'
  isRunning: boolean
  isCountUp: boolean
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function Timer({ method, displaySeconds, phase, isRunning, isCountUp }: TimerProps) {
  const config = getMethodConfig(method)

  useEffect(() => {
    const time = formatTime(displaySeconds)
    const phaseLabel = phase === 'idle' ? 'FlowDesk' : phase === 'focus' ? 'Focus' : 'Break'
    document.title = phase === 'idle' ? 'FlowDesk' : `${time} — ${phaseLabel}`
  }, [displaySeconds, phase])

  const phaseLabel = phase === 'focus'
    ? 'Focus'
    : phase === 'break'
      ? 'Break'
      : 'Ready'

  const phaseColor = phase === 'focus'
    ? 'text-accent-400'
    : phase === 'break'
      ? 'text-emerald-400'
      : 'text-gray-400 dark:text-surface-200/60'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium uppercase tracking-widest ${phaseColor}`}>
          {phaseLabel}
        </span>
        <span className="text-gray-300 dark:text-surface-200/40 text-sm">·</span>
        <span className="text-gray-500 dark:text-surface-200/60 text-sm font-medium">
          {config.label}
        </span>
      </div>

      <div
        className="timer-display text-gray-900 dark:text-white select-none"
        role="timer"
        aria-live="polite"
        aria-label={`${formatTime(displaySeconds)} ${phaseLabel}`}
      >
        {formatTime(displaySeconds)}
      </div>

      {isCountUp && isRunning && (
        <p className="text-gray-400 dark:text-surface-200/40 text-xs">Counting up — stop when ready</p>
      )}
    </div>
  )
}
