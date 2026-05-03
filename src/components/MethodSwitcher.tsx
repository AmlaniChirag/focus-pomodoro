import { FocusMethod, DEFAULT_CONFIGS } from '../lib/types'

const METHODS: FocusMethod[] = ['pomodoro', 'deepwork', '5217', 'flowtime']

interface MethodSwitcherProps {
  active: FocusMethod
  onChange: (method: FocusMethod) => void
  disabled: boolean
}

export default function MethodSwitcher({ active, onChange, disabled }: MethodSwitcherProps) {
  return (
    <div
      className="flex rounded-xl bg-gray-100 dark:bg-surface-800/80 p-1 gap-1"
      role="tablist"
      aria-label="Focus method"
    >
      {METHODS.map(m => (
        <button
          key={m}
          role="tab"
          aria-selected={active === m}
          aria-controls="timer-panel"
          disabled={disabled}
          onClick={() => onChange(m)}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent-400/50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${active === m
              ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-surface-200/70 dark:hover:text-white dark:hover:bg-surface-700/50'
            }
          `}
        >
          {DEFAULT_CONFIGS[m].label}
        </button>
      ))}
    </div>
  )
}
