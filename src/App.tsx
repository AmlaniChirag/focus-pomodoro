import { useState, useEffect, useCallback } from 'react'
import { FocusMethod, AmbientSound } from './lib/types'
import {
  getMethodConfig, loadSettings, saveSettings,
  loadTheme, saveTheme, loadFavorites,
} from './lib/storage'
import { useTimer } from './hooks/useTimer'
import { useStats } from './hooks/useStats'
import { useAuth } from './hooks/useAuth'
import Timer from './components/Timer'
import MethodSwitcher from './components/MethodSwitcher'
import SoundPicker from './components/SoundPicker'
import StatsPanel from './components/StatsPanel'
import ThemeToggle from './components/ThemeToggle'
import DurationInputs from './components/DurationInputs'
import Toast from './components/Toast'
import AuthButton from './components/AuthButton'

export default function App() {
  const [method, setMethod] = useState<FocusMethod>('pomodoro')
  const [theme, setTheme] = useState<'dark' | 'light'>(loadTheme)
  const [toast, setToast] = useState<string | null>(null)
  const [, forceUpdate] = useState(0)

  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth()

  const settings = loadSettings()
  const [sound, setSound] = useState<AmbientSound>(settings.sound as AmbientSound || 'none')
  const [volume, setVolume] = useState(settings.volume ?? 0.5)
  const [customSoundUrl, setCustomSoundUrl] = useState(settings.customSoundUrl ?? '')
  const [favorites, setFavorites] = useState(loadFavorites)

  const { stats, loading: statsLoading, fetchStats, saveSession } = useStats(user?.id)

  const handleSessionComplete = useCallback(async (actualSeconds: number) => {
    const config = getMethodConfig(method)
    const plannedMinutes = config.isCountUp ? 0 : config.focusMinutes
    const actualMinutes = Math.round(actualSeconds / 60)
    const err = await saveSession(method, plannedMinutes, actualMinutes)
    if (err) {
      setToast(`Could not save session: ${err}`)
    } else {
      setToast('✓ Session saved!')
    }
  }, [method, saveSession])

  const {
    phase, displaySeconds, isRunning, isCountUp,
    start, pause, reset, stopFlowtime,
  } = useTimer(method, handleSessionComplete)

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchStats() }, [user?.id, fetchStats])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  const handleSoundChange = (s: AmbientSound) => {
    setSound(s)
    const curr = loadSettings()
    curr.sound = s
    saveSettings(curr)
  }

  const handleVolumeChange = (v: number) => {
    setVolume(v)
    const curr = loadSettings()
    curr.volume = v
    saveSettings(curr)
  }

  const handleCustomUrlChange = (url: string) => {
    setCustomSoundUrl(url)
    const curr = loadSettings()
    curr.customSoundUrl = url
    saveSettings(curr)
  }

  const soundPlaying = isRunning && phase === 'focus'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative
      bg-surface-50 text-surface-900 dark:bg-surface-950 dark:text-white transition-colors duration-300">

      {/* Top bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <AuthButton
          user={user}
          loading={authLoading}
          onSignIn={signInWithGoogle}
          onSignOut={signOut}
        />
        <ThemeToggle theme={theme} onToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
      </div>

      <main className="w-full max-w-lg flex flex-col items-center gap-8">
        <MethodSwitcher
          active={method}
          onChange={setMethod}
          disabled={isRunning || phase !== 'idle'}
        />

        <div id="timer-panel" className="flex flex-col items-center gap-6 w-full">
          <Timer
            method={method}
            displaySeconds={displaySeconds}
            phase={phase}
            isRunning={isRunning}
            isCountUp={isCountUp}
          />

          <div className="flex items-center gap-3">
            {phase === 'idle' ? (
              <button onClick={start} className="btn-primary" aria-label="Start timer">
                Start
              </button>
            ) : isCountUp && isRunning ? (
              <button onClick={stopFlowtime} className="btn-primary" aria-label="Stop flowtime session">
                Stop
              </button>
            ) : (
              <>
                <button
                  onClick={isRunning ? pause : start}
                  className="btn-primary"
                  aria-label={isRunning ? 'Pause timer' : 'Resume timer'}
                >
                  {isRunning ? 'Pause' : 'Resume'}
                </button>
                <button onClick={reset} className="btn-secondary" aria-label="Reset timer">
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        <div className="w-full card space-y-4">
          <DurationInputs method={method} onUpdate={() => forceUpdate(n => n + 1)} />
          <div className="border-t border-gray-200 dark:border-white/5 pt-4">
            <SoundPicker
              sound={sound}
              volume={volume}
              customUrl={customSoundUrl}
              favorites={favorites}
              isFocusRunning={soundPlaying}
              onSoundChange={handleSoundChange}
              onVolumeChange={handleVolumeChange}
              onCustomUrlChange={handleCustomUrlChange}
              onFavoritesChange={() => setFavorites(loadFavorites())}
            />
          </div>
        </div>

        <div className="w-full">
          <StatsPanel stats={stats} loading={statsLoading} />
        </div>
      </main>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
