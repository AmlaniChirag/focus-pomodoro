export type FocusMethod = 'pomodoro' | 'deepwork' | '5217' | 'flowtime'

export type TimerPhase = 'focus' | 'break' | 'idle'

export interface MethodConfig {
  label: string
  focusMinutes: number
  breakMinutes: number
  longBreakMinutes?: number
  longBreakInterval?: number
  hasBreak: boolean
  isCountUp: boolean
}

export const DEFAULT_CONFIGS: Record<FocusMethod, MethodConfig> = {
  pomodoro: {
    label: 'Pomodoro',
    focusMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    hasBreak: true,
    isCountUp: false,
  },
  deepwork: {
    label: 'Deep Work',
    focusMinutes: 90,
    breakMinutes: 0,
    hasBreak: false,
    isCountUp: false,
  },
  '5217': {
    label: '52/17',
    focusMinutes: 52,
    breakMinutes: 17,
    hasBreak: true,
    isCountUp: false,
  },
  flowtime: {
    label: 'Flowtime',
    focusMinutes: 0,
    breakMinutes: 0,
    hasBreak: false,
    isCountUp: true,
  },
}

export type AmbientSound = 'none' | 'whitenoise' | 'rain' | 'lofi' | 'forest' | 'custom'

export interface SessionRecord {
  id: string
  method: string
  plannedDuration: number
  actualDuration: number
  completedAt: string
}

export interface Stats {
  todaySessions: number
  todayMinutes: number
  sevenDayChart: { date: string; minutes: number }[]
  streak: number
}
