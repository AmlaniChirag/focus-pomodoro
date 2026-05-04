import { AmbientSound } from '../lib/types'
import { useAmbientAudio } from '../hooks/useAmbientAudio'

const SOUNDS: { id: AmbientSound; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'whitenoise', label: 'White Noise' },
  { id: 'rain', label: 'Rain' },
  { id: 'lofi', label: 'Lo-fi' },
  { id: 'forest', label: 'Forest' },
]

interface SoundPickerProps {
  sound: AmbientSound
  volume: number
  /** true when focus timer is actively running */
  isFocusRunning: boolean
  onSoundChange: (s: AmbientSound) => void
  onVolumeChange: (v: number) => void
}

export default function SoundPicker({
  sound,
  volume,
  isFocusRunning,
  onSoundChange,
  onVolumeChange,
}: SoundPickerProps) {
  // Play sound: during active focus, OR when a sound is selected while idle (preview)
  const isPlaying = sound !== 'none' && isFocusRunning
  useAmbientAudio(sound, volume, isPlaying)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ambient sound">
        {SOUNDS.map(s => (
          <button
            key={s.id}
            role="radio"
            aria-checked={sound === s.id}
            onClick={() => onSoundChange(s.id)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-accent-400/50
              ${sound === s.id
                ? 'bg-accent-500/20 text-accent-400 ring-1 ring-accent-500/30'
                : 'bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-surface-700/50 dark:text-surface-200/60 dark:hover:text-surface-200'
              }
            `}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sound !== 'none' && (
        <div className="flex items-center gap-3">
          <label htmlFor="volume-slider" className="text-xs text-gray-400 dark:text-surface-200/50">
            Vol
          </label>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-accent-500 cursor-pointer"
            aria-label="Volume"
          />
          {!isFocusRunning && (
            <span className="text-[10px] text-gray-400 dark:text-surface-200/40 whitespace-nowrap">
              plays during focus
            </span>
          )}
        </div>
      )}
    </div>
  )
}
