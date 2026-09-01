import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { adminApi, ApiError } from '@/lib/adminApi'
import { site } from '@/config/site'

import { ApertureMark } from '@/components/ApertureMark'
import { inputClasses } from './ui'

export function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await adminApi.login(password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong — try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-darkroom px-6">
      <div className="w-full max-w-sm border border-paper/15 bg-paper p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <ApertureMark className="h-10 w-10 text-ink" />
          <h1 className="font-display text-2xl text-ink">Studio admin</h1>
          <p className="eyebrow text-silver">{site.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClasses}
            placeholder="Admin password"
            aria-label="Admin password"
          />
          {error && <p className="text-sm text-safelight-deep">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-safelight-deep disabled:opacity-45"
          >
            {busy ? 'Checking…' : 'Sign in'}
          </button>
        </form>
        <Link to="/" className="mt-6 block text-center text-sm text-ink/50 hover:text-safelight-deep">
          ← Back to the site
        </Link>
      </div>
    </div>
  )
}
