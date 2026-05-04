import { useRef, useEffect, useCallback } from 'react'
import { AmbientSound } from '../lib/types'

interface AudioNodes {
  ctx: AudioContext
  gain: GainNode
  sources: AudioNode[]
  stop: () => void
}

function buildWhiteNoise(ctx: AudioContext, gain: GainNode): AudioBufferSourceNode {
  const rate = ctx.sampleRate
  const buf = ctx.createBuffer(1, rate * 3, rate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  src.connect(gain)
  src.start()
  return src
}

function buildRain(ctx: AudioContext, gain: GainNode): AudioBufferSourceNode {
  const rate = ctx.sampleRate
  const buf = ctx.createBuffer(1, rate * 3, rate)
  const data = buf.getChannelData(0)
  // brown-ish noise (integrated white noise)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 800
  lp.Q.value = 0.5
  src.connect(lp)
  lp.connect(gain)
  src.start()
  return src
}

function buildForest(ctx: AudioContext, gain: GainNode): AudioBufferSourceNode {
  const rate = ctx.sampleRate
  const buf = ctx.createBuffer(1, rate * 4, rate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 400
  bp.Q.value = 0.3
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 2200
  src.connect(bp)
  bp.connect(lp)
  lp.connect(gain)
  src.start()
  return src
}

function buildLofi(ctx: AudioContext, gain: GainNode): OscillatorNode[] {
  const freqs = [220, 277.18, 329.63, 415.30] // Am chord
  return freqs.map((f, i) => {
    const osc = ctx.createOscillator()
    osc.type = i % 2 === 0 ? 'sine' : 'triangle'
    osc.frequency.value = f
    const oscGain = ctx.createGain()
    oscGain.gain.value = 0.06
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1200
    osc.connect(lp)
    lp.connect(oscGain)
    oscGain.connect(gain)
    osc.start()
    return osc
  })
}

function createSound(sound: AmbientSound, volume: number): AudioNodes | null {
  if (sound === 'none') return null
  try {
    const ctx = new AudioContext()
    const gain = ctx.createGain()
    gain.gain.value = volume
    gain.connect(ctx.destination)

    let sources: AudioNode[] = []
    if (sound === 'whitenoise') sources = [buildWhiteNoise(ctx, gain)]
    else if (sound === 'rain') sources = [buildRain(ctx, gain)]
    else if (sound === 'forest') sources = [buildForest(ctx, gain)]
    else if (sound === 'lofi') sources = buildLofi(ctx, gain)

    const stop = () => {
      sources.forEach(s => {
        try {
          if (s instanceof AudioBufferSourceNode || s instanceof OscillatorNode) s.stop()
        } catch {}
      })
      ctx.close()
    }

    return { ctx, gain, sources, stop }
  } catch {
    return null
  }
}

export function useAmbientAudio(
  sound: AmbientSound,
  volume: number,
  isPlaying: boolean
) {
  const nodesRef = useRef<AudioNodes | null>(null)

  const stopCurrent = useCallback(() => {
    nodesRef.current?.stop()
    nodesRef.current = null
  }, [])

  // Start/stop based on sound + isPlaying
  useEffect(() => {
    stopCurrent()
    if (sound === 'none' || !isPlaying) return

    const nodes = createSound(sound, volume)
    nodesRef.current = nodes

    return stopCurrent
  }, [sound, isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update volume live without restarting
  useEffect(() => {
    if (nodesRef.current) {
      nodesRef.current.gain.gain.setTargetAtTime(volume, nodesRef.current.ctx.currentTime, 0.01)
    }
  }, [volume])

  useEffect(() => {
    return stopCurrent
  }, [stopCurrent])
}
