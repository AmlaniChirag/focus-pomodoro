import { FocusMethod, MethodConfig, DEFAULT_CONFIGS } from './types'

const STORAGE_KEY = 'flowdesk-settings'
const THEME_KEY = 'flowdesk-theme'

interface StoredSettings {
  overrides: Partial<Record<FocusMethod, { focusMinutes?: number; breakMinutes?: number }>>
  volume: number
  sound: string
}

export function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { overrides: {}, volume: 0.5, sound: 'none' }
}

export function saveSettings(settings: StoredSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function getMethodConfig(method: FocusMethod): MethodConfig {
  const settings = loadSettings()
  const base = DEFAULT_CONFIGS[method]
  const override = settings.overrides[method]
  if (!override) return base
  return {
    ...base,
    focusMinutes: override.focusMinutes ?? base.focusMinutes,
    breakMinutes: override.breakMinutes ?? base.breakMinutes,
  }
}

export function loadTheme(): 'dark' | 'light' {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t === 'light' || t === 'dark') return t
  } catch {}
  return 'dark'
}

export function saveTheme(theme: 'dark' | 'light'): void {
  localStorage.setItem(THEME_KEY, theme)
}
