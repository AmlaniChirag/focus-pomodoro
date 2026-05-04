export function playChime(type: 'focus' | 'break') {
  try {
    const ctx = new AudioContext()
    // Ascending = focus done (reward), descending = break over (back to work)
    const freqs = type === 'focus'
      ? [523.25, 659.25, 783.99]
      : [783.99, 659.25, 523.25]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      osc.start(t)
      osc.stop(t + 0.55)
    })
  } catch {}
}
