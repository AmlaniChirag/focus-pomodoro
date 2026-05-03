import { FocusMethod, DEFAULT_CONFIGS } from '../lib/types'
import { loadSettings, saveSettings } from '../lib/storage'

interface DurationInputsProps {
  method: FocusMethod
  onUpdate: () => void
}

export default function DurationInputs({ method, onUpdate }: DurationInputsProps) {
  const defaults = DEFAULT_CONFIGS[method]
  const settings = loadSettings()
  const override = settings.overrides[method] || {}

  if (method === 'flowtime') {
    return (
      <p className="text-xs text-gray-400 dark:text-surface-200/40">
        Flowtime has no fixed duration — start and stop when you feel done.
      </p>
    )
  }

  const handleFocusChange = (value: string) => {
    const min = Math.min(180, Math.max(1, parseInt(value) || defaults.focusMinutes))
    const newSettings = loadSettings()
    newSettings.overrides[method] = { ...newSettings.overrides[method], focusMinutes: min }
    saveSettings(newSettings)
    onUpdate()
  }

  const handleBreakChange = (value: string) => {
    const min = Math.min(180, Math.max(1, parseInt(value) || defaults.breakMinutes))
    const newSettings = loadSettings()
    newSettings.overrides[method] = { ...newSettings.overrides[method], breakMinutes: min }
    saveSettings(newSettings)
    onUpdate()
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <label htmlFor={`focus-${method}`} className="text-xs text-gray-500 dark:text-surface-200/50">
          Focus
        </label>
        <input
          id={`focus-${method}`}
          type="number"
          min={1}
          max={180}
          defaultValue={override.focusMinutes ?? defaults.focusMinutes}
          onBlur={e => handleFocusChange(e.target.value)}
          className="w-16 px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-sm text-gray-900 text-center
            dark:bg-surface-700/50 dark:border-white/10 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-accent-400/50"
          aria-label={`Focus duration in minutes for ${defaults.label}`}
        />
        <span className="text-xs text-gray-400 dark:text-surface-200/40">min</span>
      </div>

      {defaults.hasBreak && (
        <div className="flex items-center gap-2">
          <label htmlFor={`break-${method}`} className="text-xs text-gray-500 dark:text-surface-200/50">
            Break
          </label>
          <input
            id={`break-${method}`}
            type="number"
            min={1}
            max={180}
            defaultValue={override.breakMinutes ?? defaults.breakMinutes}
            onBlur={e => handleBreakChange(e.target.value)}
            className="w-16 px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-sm text-gray-900 text-center
              dark:bg-surface-700/50 dark:border-white/10 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-accent-400/50"
            aria-label={`Break duration in minutes for ${defaults.label}`}
          />
          <span className="text-xs text-gray-400 dark:text-surface-200/40">min</span>
        </div>
      )}
    </div>
  )
}
