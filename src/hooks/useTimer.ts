import { useState, useRef, useCallback, useEffect } from 'react'
import { FocusMethod, TimerPhase } from '../lib/types'
import { getMethodConfig } from '../lib/storage'
import { playChime } from '../lib/chime'

interface TimerState {
  phase: TimerPhase
  elapsed: number
  totalSeconds: number
  isRunning: boolean
  sessionsCompleted: number
}

export function useTimer(
  method: FocusMethod,
  onComplete: (actualSeconds: number) => void,
  autoStartBreak = false,
) {
  const [state, setState] = useState<TimerState>({
    phase: 'idle',
    elapsed: 0,
    totalSeconds: 0,
    isRunning: false,
    sessionsCompleted: 0,
  })

  const startTimeRef = useRef(0)
  const pausedElapsedRef = useRef(0)
  const rafRef = useRef(0)
  const phaseRef = useRef<TimerPhase>('idle')
  const sessionsRef = useRef(0)
  const totalSecondsRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  const methodRef = useRef(method)
  const autoStartRef = useRef(autoStartBreak)

  onCompleteRef.current = onComplete
  methodRef.current = method
  autoStartRef.current = autoStartBreak

  const handlePhaseComplete = useCallback(() => {
    const cfg = getMethodConfig(methodRef.current)
    if (phaseRef.current === 'focus') {
      const actualSeconds = cfg.isCountUp
        ? Math.floor((pausedElapsedRef.current + (Date.now() - startTimeRef.current)) / 1000)
        : cfg.focusMinutes * 60
      onCompleteRef.current(actualSeconds)
      playChime('focus')

      if (cfg.hasBreak) {
        const newSessions = sessionsRef.current + 1
        sessionsRef.current = newSessions
        const isLongBreak = cfg.longBreakInterval && newSessions % cfg.longBreakInterval === 0
        const breakSeconds = isLongBreak
          ? (cfg.longBreakMinutes ?? cfg.breakMinutes) * 60
          : cfg.breakMinutes * 60

        phaseRef.current = 'break'
        totalSecondsRef.current = breakSeconds
        pausedElapsedRef.current = 0
        startTimeRef.current = Date.now()
        setState({
          phase: 'break',
          elapsed: 0,
          totalSeconds: breakSeconds,
          isRunning: autoStartRef.current,
          sessionsCompleted: newSessions,
        })
        if (autoStartRef.current) {
          rafRef.current = requestAnimationFrame(tick)
        }
        sendNotification('Focus complete! Time for a break.')
      } else {
        sessionsRef.current += 1
        phaseRef.current = 'idle'
        setState(prev => ({
          ...prev,
          phase: 'idle',
          isRunning: false,
          elapsed: 0,
          sessionsCompleted: prev.sessionsCompleted + 1,
        }))
        sendNotification('Session complete!')
      }
    } else if (phaseRef.current === 'break') {
      playChime('break')
      phaseRef.current = 'idle'
      setState(prev => ({ ...prev, phase: 'idle', isRunning: false, elapsed: 0 }))
      sendNotification('Break over! Ready for another session?')
    }
  }, [])

  const tick = useCallback(() => {
    const now = Date.now()
    const elapsed = pausedElapsedRef.current + (now - startTimeRef.current)
    const elapsedSeconds = Math.floor(elapsed / 1000)
    const cfg = getMethodConfig(methodRef.current)

    if (!cfg.isCountUp && elapsedSeconds >= totalSecondsRef.current) {
      cancelAnimationFrame(rafRef.current)
      setState(prev => ({ ...prev, elapsed: totalSecondsRef.current }))
      handlePhaseComplete()
      return
    }

    setState(prev => ({ ...prev, elapsed: elapsedSeconds }))
    rafRef.current = requestAnimationFrame(tick)
  }, [handlePhaseComplete])

  const start = useCallback(() => {
    const cfg = getMethodConfig(methodRef.current)
    if (phaseRef.current === 'idle') {
      phaseRef.current = 'focus'
      const totalSeconds = cfg.isCountUp ? 0 : cfg.focusMinutes * 60
      totalSecondsRef.current = totalSeconds
      pausedElapsedRef.current = 0
      startTimeRef.current = Date.now()
      setState(prev => ({
        phase: 'focus',
        elapsed: 0,
        totalSeconds,
        isRunning: true,
        sessionsCompleted: prev.sessionsCompleted,
      }))
      rafRef.current = requestAnimationFrame(tick)
    } else {
      startTimeRef.current = Date.now()
      setState(prev => ({ ...prev, isRunning: true }))
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  const pause = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    pausedElapsedRef.current += Date.now() - startTimeRef.current
    setState(prev => ({ ...prev, isRunning: false }))
  }, [])

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    pausedElapsedRef.current = 0
    phaseRef.current = 'idle'
    totalSecondsRef.current = 0
    setState(prev => ({
      phase: 'idle',
      elapsed: 0,
      totalSeconds: 0,
      isRunning: false,
      sessionsCompleted: prev.sessionsCompleted,
    }))
  }, [])

  const stopFlowtime = useCallback(() => {
    const cfg = getMethodConfig(methodRef.current)
    if (cfg.isCountUp && phaseRef.current === 'focus') {
      cancelAnimationFrame(rafRef.current)
      const actualSeconds = Math.floor(
        (pausedElapsedRef.current + (Date.now() - startTimeRef.current)) / 1000
      )
      onCompleteRef.current(actualSeconds)
      playChime('focus')
      sessionsRef.current += 1
      phaseRef.current = 'idle'
      setState(prev => ({
        ...prev,
        phase: 'idle',
        isRunning: false,
        sessionsCompleted: prev.sessionsCompleted + 1,
      }))
    }
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    pausedElapsedRef.current = 0
    phaseRef.current = 'idle'
    totalSecondsRef.current = 0
    sessionsRef.current = 0
    setState({ phase: 'idle', elapsed: 0, totalSeconds: 0, isRunning: false, sessionsCompleted: 0 })
  }, [method])

  const config = getMethodConfig(method)
  const displaySeconds = config.isCountUp
    ? state.elapsed
    : Math.max(0, state.totalSeconds - state.elapsed)

  const progress = (!config.isCountUp && state.totalSeconds > 0)
    ? state.elapsed / state.totalSeconds
    : 0

  return {
    phase: state.phase,
    displaySeconds,
    isRunning: state.isRunning,
    sessionsCompleted: state.sessionsCompleted,
    isCountUp: config.isCountUp,
    progress,
    start,
    pause,
    reset,
    stopFlowtime,
  }
}

function sendNotification(message: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('FlowDesk', { body: message })
  }
}
