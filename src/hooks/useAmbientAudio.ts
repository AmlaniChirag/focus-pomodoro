import { useRef, useEffect, useCallback } from 'react'
import { AmbientSound } from '../lib/types'

interface AudioNodes {
  ctx: AudioContext
  gain: GainNode
  sources: AudioNode[]
  stop: () => void
}

// ── YouTube helpers ───────────────────────────────────────────

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
  } catch {}
  return null
}

export function isYouTubeUrl(url: string): boolean {
  return !!extractYouTubeId(url)
}

// ── Web Audio generators ──────────────────────────────────────

function buildWhiteNoise(ctx: AudioContext, gain: GainNode): AudioBufferSourceNode {
  const rate = ctx.sampleRate
  const buf = ctx.createBuffer(2, rate * 4, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const shelf = ctx.createBiquadFilter()
  shelf.type = 'highshelf'
  shelf.frequency.value = 6000
  shelf.gain.value = -6
  src.connect(shelf)
  shelf.connect(gain)
  src.start()
  return src
}

function buildPinkNoise(ctx: AudioContext, gain: GainNode, lpFreq = 1200): AudioBufferSourceNode {
  const rate = ctx.sampleRate
  const buf = ctx.createBuffer(2, rate * 5, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520
      b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.0168980
      b6 = w * 0.115926
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
    }
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = lpFreq
  lp.Q.value = 0.4
  src.connect(lp)
  lp.connect(gain)
  src.start()
  return src
}

function buildForest(ctx: AudioContext, gain: GainNode): AudioBufferSourceNode {
  const src = buildPinkNoise(ctx, gain, 2000)
  return src
}

function buildLofi(ctx: AudioContext, gain: GainNode): AudioNode[] {
  const notes = [
    { freq: 130.81, type: 'sine' as OscillatorType, vol: 0.08 },
    { freq: 196.00, type: 'triangle' as OscillatorType, vol: 0.06 },
    { freq: 261.63, type: 'sine' as OscillatorType, vol: 0.07 },
    { freq: 329.63, type: 'triangle' as OscillatorType, vol: 0.05 },
    { freq: 392.00, type: 'sine' as OscillatorType, vol: 0.04 },
    { freq: 493.88, type: 'triangle' as OscillatorType, vol: 0.03 },
  ]
  return notes.map(({ freq, type, vol }) => {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = vol
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 800
    lp.Q.value = 0.7
    osc.connect(lp)
    lp.connect(g)
    g.connect(gain)
    osc.start()
    return osc
  })
}

function createGeneratedSound(sound: AmbientSound, volume: number): AudioNodes | null {
  if (sound === 'none' || sound === 'custom') return null
  try {
    const ctx = new AudioContext()
    const gain = ctx.createGain()
    gain.gain.value = volume
    gain.connect(ctx.destination)

    let sources: AudioNode[] = []
    if (sound === 'whitenoise') sources = [buildWhiteNoise(ctx, gain)]
    else if (sound === 'rain') sources = [buildPinkNoise(ctx, gain, 1000)]
    else if (sound === 'forest') sources = [buildForest(ctx, gain)]
    else if (sound === 'lofi') sources = buildLofi(ctx, gain)

    const stop = () => {
      sources.forEach(s => {
        try {
          if (s instanceof AudioBufferSourceNode || s instanceof OscillatorNode) s.stop()
        } catch {}
      })
      ctx.close().catch(() => {})
    }

    return { ctx, gain, sources, stop }
  } catch {
    return null
  }
}

// ── YouTube IFrame player ─────────────────────────────────────

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: object) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  setVolume(v: number): void
  destroy(): void
  getPlayerState(): number
}

let ytApiLoaded = false
let ytApiReady = false
const ytReadyCallbacks: Array<() => void> = []

function loadYouTubeApi() {
  if (ytApiLoaded) return
  ytApiLoaded = true
  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true
    ytReadyCallbacks.forEach(cb => cb())
    ytReadyCallbacks.length = 0
  }
}

function whenYTReady(cb: () => void) {
  if (ytApiReady) { cb(); return }
  ytReadyCallbacks.push(cb)
  loadYouTubeApi()
}

function createYouTubePlayer(videoId: string, volume: number): Promise<{ player: YTPlayer; container: HTMLDivElement }> {
  return new Promise(resolve => {
    whenYTReady(() => {
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden'
      document.body.appendChild(container)
      const inner = document.createElement('div')
      container.appendChild(inner)

      const player = new window.YT.Player(inner, {
        height: '1',
        width: '1',
        videoId,
        playerVars: { autoplay: 1, loop: 1, playlist: videoId, controls: 0 },
        events: {
          onReady: () => {
            player.setVolume(Math.round(volume * 100))
            player.playVideo()
            resolve({ player, container })
          },
        },
      })
    })
  })
}

// ── Hook ─────────────────────────────────────────────────────

export function useAmbientAudio(
  sound: AmbientSound,
  volume: number,
  isPlaying: boolean,
  customUrl?: string,
) {
  const nodesRef = useRef<AudioNodes | null>(null)
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null)
  const ytRef = useRef<{ player: YTPlayer; container: HTMLDivElement } | null>(null)

  const stopAll = useCallback(() => {
    nodesRef.current?.stop()
    nodesRef.current = null
    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause()
      htmlAudioRef.current.src = ''
      htmlAudioRef.current = null
    }
    if (ytRef.current) {
      ytRef.current.player.destroy()
      ytRef.current.container.remove()
      ytRef.current = null
    }
  }, [])

  useEffect(() => {
    stopAll()
    if (sound === 'none' || !isPlaying || !customUrl && sound === 'custom') return

    if (sound === 'custom' && customUrl) {
      const ytId = extractYouTubeId(customUrl)
      if (ytId) {
        createYouTubePlayer(ytId, volume).then(refs => {
          ytRef.current = refs
        })
      } else {
        const audio = new Audio(customUrl)
        audio.loop = true
        audio.volume = volume
        audio.play().catch(() => {})
        htmlAudioRef.current = audio
      }
    } else {
      nodesRef.current = createGeneratedSound(sound, volume)
    }

    return stopAll
  }, [sound, isPlaying, customUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (nodesRef.current) {
      nodesRef.current.gain.gain.setTargetAtTime(volume, nodesRef.current.ctx.currentTime, 0.015)
    }
    if (htmlAudioRef.current) {
      htmlAudioRef.current.volume = Math.max(0, Math.min(1, volume))
    }
    if (ytRef.current) {
      ytRef.current.player.setVolume(Math.round(volume * 100))
    }
  }, [volume])

  useEffect(() => stopAll, [stopAll])
}
