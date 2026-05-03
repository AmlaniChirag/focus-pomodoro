import { useEffect, useRef } from 'react'
import { AmbientSound } from '../lib/types'

const SOUNDS: { id: AmbientSound; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'whitenoise', label: 'White Noise' },
  { id: 'rain', label: 'Rain' },
  { id: 'lofi', label: 'Lo-fi' },
  { id: 'forest', label: 'Forest' },
]

const SOUND_URLS: Record<Exclude<AmbientSound, 'none'>, string> = {
  whitenoise: 'https://cdn.freesound.org/previews/612/612737_5674468-lq.mp3',
  rain: 'https://cdn.freesound.org/previews/531/531947_6178507-lq.mp3',
  lofi: 'https://cdn.freesound.org/previews/456/456058_9224052-lq.mp3',
  forest: 'https://cdn.freesound.org/previews/365/365167_6593068-lq.mp3',
}

interface SoundPickerProps {
  sound: AmbientSound
  volume: number
  isPlaying: boolean
  onSoundChange: (s: AmbientSound) => void
  onVolumeChange: (v: number) => void
}

export default function SoundPicker({
  sound,
  volume,
  isPlaying,
  onSoundChange,
  onVolumeChange,
}: SoundPickerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (sound === 'none' || !isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      return
    }

    const url = SOUND_URLS[sound]
    if (!audioRef.current || audioRef.current.src !== url) {
      audioRef.current?.pause()
      const audio = new Audio(url)
      audio.loop = true
      audio.volume = volume
      audio.play().catch(() => {})
      audioRef.current = audio
    } else {
      audioRef.current.volume = volume
      audioRef.current.play().catch(() => {})
    }

    return () => {
      audioRef.current?.pause()
    }
  }, [sound, isPlaying, volume])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

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
        </div>
      )}
    </div>
  )
}
