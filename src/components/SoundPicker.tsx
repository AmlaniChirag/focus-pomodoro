import { useState } from 'react'
import { AmbientSound, SoundFavorite } from '../lib/types'
import { useAmbientAudio, isYouTubeUrl } from '../hooks/useAmbientAudio'
import { saveFavorite, deleteFavorite } from '../lib/storage'

const BUILTIN_SOUNDS: { id: AmbientSound; label: string; emoji: string }[] = [
  { id: 'none', label: 'None', emoji: '🔇' },
  { id: 'whitenoise', label: 'White Noise', emoji: '〰️' },
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'lofi', label: 'Lo-fi', emoji: '🎵' },
  { id: 'forest', label: 'Forest', emoji: '🌿' },
  { id: 'custom', label: '+ Custom', emoji: '🔗' },
]

interface SoundPickerProps {
  sound: AmbientSound
  volume: number
  customUrl: string
  favorites: SoundFavorite[]
  isFocusRunning: boolean
  onSoundChange: (s: AmbientSound) => void
  onVolumeChange: (v: number) => void
  onCustomUrlChange: (url: string) => void
  onFavoritesChange: () => void
}

export default function SoundPicker({
  sound,
  volume,
  customUrl,
  favorites,
  isFocusRunning,
  onSoundChange,
  onVolumeChange,
  onCustomUrlChange,
  onFavoritesChange,
}: SoundPickerProps) {
  const [urlDraft, setUrlDraft] = useState(customUrl)
  const [favName, setFavName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)

  const isPlaying = sound !== 'none' && isFocusRunning
  useAmbientAudio(sound, volume, isPlaying, customUrl)

  const isYT = isYouTubeUrl(urlDraft)

  const handleSaveFavorite = () => {
    if (!favName.trim() || !urlDraft.trim()) return
    saveFavorite({ id: crypto.randomUUID(), name: favName.trim(), url: urlDraft.trim() })
    setFavName('')
    setShowSaveForm(false)
    onFavoritesChange()
  }

  const loadFavorite = (fav: SoundFavorite) => {
    setUrlDraft(fav.url)
    onCustomUrlChange(fav.url)
    onSoundChange('custom')
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Built-in sounds */}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ambient sound">
        {BUILTIN_SOUNDS.map(s => (
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

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {favorites.map(fav => (
            <div key={fav.id} className="flex items-center gap-0.5">
              <button
                onClick={() => loadFavorite(fav)}
                className={`px-2.5 py-1.5 rounded-l-lg text-xs font-medium transition-all
                  focus:outline-none focus:ring-2 focus:ring-accent-400/50
                  ${sound === 'custom' && customUrl === fav.url
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-surface-700/50 dark:text-surface-200/60 dark:hover:text-surface-200'
                  }`}
              >
                ⭐ {fav.name}
              </button>
              <button
                onClick={() => { deleteFavorite(fav.id); onFavoritesChange() }}
                className="px-1.5 py-1.5 rounded-r-lg text-xs bg-gray-100 text-gray-400 hover:text-red-500
                  dark:bg-surface-700/50 dark:text-surface-200/30 dark:hover:text-red-400
                  focus:outline-none"
                aria-label={`Remove ${fav.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom URL input */}
      {sound === 'custom' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder={isYT ? '▶ YouTube detected' : 'Paste YouTube, .mp3, or .ogg URL'}
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
              {isYouTubeUrl(urlDraft) ? '▶ YT' : 'Set'}
            </button>
            {urlDraft && (
              <button
                onClick={() => setShowSaveForm(v => !v)}
                className="px-3 py-1.5 rounded-lg text-xs bg-yellow-500/20 text-yellow-500
                  hover:bg-yellow-500/30 focus:outline-none"
                title="Save as favorite"
              >
                ⭐
              </button>
            )}
          </div>

          {showSaveForm && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name this sound..."
                value={favName}
                onChange={e => setFavName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveFavorite()}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs
                  bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400
                  dark:bg-surface-700/50 dark:border-white/10 dark:text-white dark:placeholder:text-surface-200/30
                  focus:outline-none focus:ring-2 focus:ring-accent-400/50"
              />
              <button
                onClick={handleSaveFavorite}
                className="px-3 py-1.5 rounded-lg text-xs bg-yellow-500 text-white
                  hover:bg-yellow-600 focus:outline-none"
              >
                Save
              </button>
            </div>
          )}

          <p className="text-[10px] text-gray-400 dark:text-surface-200/30">
            {isYouTubeUrl(urlDraft)
              ? '▶ YouTube will play via embedded player during focus'
              : 'Direct audio URL only — YouTube, Spotify embeds also supported'}
          </p>
        </div>
      )}

      {/* Volume */}
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
