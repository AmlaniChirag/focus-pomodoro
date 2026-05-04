import { useState } from 'react'
import { AmbientSound } from '../lib/types'
import { useAmbientAudio } from '../hooks/useAmbientAudio'

const SOUNDS: { id: AmbientSound; label: string; emoji: string }[] = [
  { id: 'none', label: 'None', emoji: '🔇' },
  { id: 'whitenoise', label: 'White Noise', emoji: '〰️' },
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'lofi', label: 'Lo-fi', emoji: '🎵' },
  { id: 'forest', label: 'Forest', emoji: '🌿' },
  { id: 'custom', label: 'Custom URL', emoji: '🔗' },
]

interface SoundPickerProps {
  sound: AmbientSound
  volume: number
  customUrl: string
  isFocusRunning: boolean
  onSoundChange: (s: AmbientSound) => void
  onVolumeChange: (v: number) => void
  onCustomUrlChange: (url: string) => void
}

export default function SoundPicker({
  sound,
  volume,
  customUrl,
  isFocusRunning,
  onSoundChange,
  onVolumeChange,
  onCustomUrlChange,
}: SoundPickerProps) {
  const [urlDraft, setUrlDraft] = useState(customUrl)

  const isPlaying = sound !== 'none' && isFocusRunning
  useAmbientAudio(sound, volume, isPlaying, customUrl)

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
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {sound === 'custom' && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Paste direct audio URL (.mp3, .ogg, YouTube won't work)"
            value={urlDraft}
            onChange={e => setUrlDraft(e.target.value)}
            onBlur={() => onCustomUrlChange(urlDraft)}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs
              bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400
              dark:bg-surface-700/50 dark:border-white/10 dark:text-white dark:placeholder:text-surface-200/30
              focus:outline-none focus:ring-2 focus:ring-accent-400/50"
            aria-label="Custom audio URL"
          />
          <button
            onClick={() => onCustomUrlChange(urlDraft)}
            className="px-3 py-1.5 rounded-lg text-xs bg-accent-500 text-white
              hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-400/50"
          >
            Set
          </button>
        </div>
      )}

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
