import { useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface AuthButtonProps {
  user: User | null
  loading: boolean
  onSendMagicLink: (email: string) => Promise<string | null>
  onSignOut: () => void
}

export default function AuthButton({ user, loading, onSendMagicLink, onSignOut }: AuthButtonProps) {
  const [email, setEmail] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return null

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-surface-200/50 hidden sm:block">
          {user.email?.split('@')[0]}
        </span>
        <button
          onClick={onSignOut}
          className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-700
            dark:text-surface-200/40 dark:hover:text-surface-200
            transition-colors focus:outline-none"
          aria-label="Sign out"
        >
          Sign out
        </button>
      </div>
    )
  }

  if (sent) {
    return (
      <span className="text-xs text-green-500 dark:text-green-400">
        ✓ Check your email
      </span>
    )
  }

  if (showInput) {
    const handleSubmit = async () => {
      if (!email.trim()) return
      setBusy(true)
      setError(null)
      const err = await onSendMagicLink(email.trim())
      setBusy(false)
      if (err) setError(err)
      else setSent(true)
    }

    return (
      <div className="flex items-center gap-1.5">
        <input
          type="email"
          autoFocus
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="px-2.5 py-1.5 rounded-lg text-xs w-40
            bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400
            dark:bg-surface-700/50 dark:border-white/10 dark:text-white dark:placeholder:text-surface-200/30
            focus:outline-none focus:ring-2 focus:ring-accent-400/50"
        />
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="px-2.5 py-1.5 rounded-lg text-xs bg-accent-500 text-white
            hover:bg-accent-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent-400/50"
        >
          {busy ? '…' : 'Send'}
        </button>
        <button
          onClick={() => { setShowInput(false); setError(null) }}
          className="px-1.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600
            dark:text-surface-200/40 dark:hover:text-surface-200 focus:outline-none"
        >
          ✕
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        bg-gray-100 hover:bg-gray-200 text-gray-700
        dark:bg-surface-700/50 dark:hover:bg-surface-700 dark:text-surface-200
        transition-colors focus:outline-none focus:ring-2 focus:ring-accent-400/50"
      aria-label="Sign in"
    >
      Sign in
    </button>
  )
}
