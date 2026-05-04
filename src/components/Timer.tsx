import { useEffect } from 'react'
import { FocusMethod } from '../lib/types'
import { getMethodConfig } from '../lib/storage'

const RADIUS = 108
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface TimerProps {
  method: FocusMethod
  displaySeconds: number
  phase: 'focus' | 'break' | 'idle'
  isRunning: boolean
  isCountUp: boolean
  progress: number
  sessionsCompleted: number
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

export { formatTime }

export default function Timer({
  method,
  displaySeconds,
  phase,
  isRunning,
  isCountUp,
  progress,
  sessionsCompleted,
}: TimerProps) {
  const config = getMethodConfig(method)

  useEffect(() => {
    const time = formatTime(displaySeconds)
    const phaseLabel = phase === 'idle' ? 'FlowDesk' : phase === 'focus' ? 'Focus' : 'Break'
    document.title = phase === 'idle' ? 'FlowDesk' : `${time} — ${phaseLabel}`
    return () => { document.title = 'FlowDesk' }
  }, [displaySeconds, phase])

  const phaseLabel = phase === 'focus' ? 'Focus' : phase === 'break' ? 'Break' : 'Ready'

  const phaseColor = phase === 'focus'
    ? 'text-accent-400'
    : phase === 'break'
      ? 'text-emerald-400'
      : 'text-gray-400 dark:text-surface-200/60'

  // Ring stroke color
  const ringStroke = phase === 'focus'
    ? 'stroke-accent-500'
    : phase === 'break'
      ? 'stroke-emerald-500'
      : 'stroke-gray-300 dark:stroke-surface-600'

  const ringOffset = isCountUp
    ? CIRCUMFERENCE * 0.85   // fixed partial arc for flowtime
    : CIRCUMFERENCE * (1 - progress)

  // Pomodoro session dots
  const longBreakInterval = config.longBreakInterval ?? 4
  const showDots = method === 'pomodoro'
  const dotsCompleted = sessionsCompleted % longBreakInterval

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

      {/* Ring + Timer */}
      <div className="relative flex items-center justify-center w-[240px] h-[240px]">
        <svg
          className={`absolute inset-0 w-full h-full -rotate-90 ${isCountUp && isRunning ? 'animate-spin-slow' : ''}`}
          viewBox="0 0 240 240"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="120" cy="120" r={RADIUS}
            fill="none"
            strokeWidth="3"
            className="stroke-gray-100 dark:stroke-surface-700/60"
          />
          {/* Progress arc */}
          <circle
            cx="120" cy="120" r={RADIUS}
            fill="none"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={phase === 'idle' ? CIRCUMFERENCE : ringOffset}
            className={`${ringStroke} transition-[stroke-dashoffset] duration-1000 ease-linear`}
          />
        </svg>

        <div
          className="timer-display text-gray-900 dark:text-white select-none"
          role="timer"
          aria-live="polite"
          aria-label={`${formatTime(displaySeconds)} ${phaseLabel}`}
        >
          {formatTime(displaySeconds)}
        </div>
      </div>

      {/* Pomodoro session dots */}
      {showDots && (
        <div className="flex items-center gap-2" aria-label={`${dotsCompleted} of ${longBreakInterval} sessions`}>
          {Array.from({ length: longBreakInterval }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < dotsCompleted
                  ? 'bg-accent-500 scale-110'
                  : 'bg-gray-200 dark:bg-surface-700'
              }`}
              title={`Session ${i + 1}`}
            />
          ))}
          {sessionsCompleted > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-surface-200/30 ml-1">
              {Math.floor(sessionsCompleted / longBreakInterval) > 0
                ? `cycle ${Math.floor(sessionsCompleted / longBreakInterval) + 1}`
                : ''}
            </span>
          )}
        </div>
      )}

      {isCountUp && isRunning && (
        <p className="text-gray-400 dark:text-surface-200/40 text-xs">Counting up — stop when ready</p>
      )}
    </div>
  )
}
