import { useEffect, useState } from 'react'

import { sessionsApi } from '@/lib/adminApi'

import { EmptyNote, Field, inputClasses } from './ui'

interface Session {
  id: number
  name: string
  price: string
  blurb: string | null
  includes: string | null
  featured: boolean
  sort_order: number
}

export function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])

  async function load() {
    setSessions((await sessionsApi.list()).sessions)
  }

  useEffect(() => {
  }, [])

  async function update(session: Session, price: string, blurb: string) {
    await sessionsApi
      .update(session.id, {
        name: session.name,
        price,
        blurb,
        includes: session.includes,
        featured: session.featured,
      })
      .catch(() => undefined)
    await load()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Sessions</h1>
        <p className="mt-1 text-sm text-ink/60">
          Prices and details shown on the Investment page. Changes appear on the site immediately.
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyNote>No sessions yet — they are seeded automatically on first run.</EmptyNote>
      ) : (
        sessions.map((s) => <SessionEditor key={s.id} session={s} onSave={update} />)
      )}
    </div>
  )
}

function SessionEditor({ session, onSave }: { session: Session; onSave: (s: Session, price: string, blurb: string) => void }) {
  const [price, setPrice] = useState(session.price)
  const [blurb, setBlurb] = useState(session.blurb ?? '')
  const [saved, setSaved] = useState(false)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(session, price, blurb)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }}
      className="border border-ink/12 bg-mat/40 p-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl text-ink">{session.name}</h2>
        {saved && <span className="exif text-safelight-deep">saved</span>}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Price">
          <input required value={price} onChange={(e) => setPrice(e.target.value)} className={inputClasses} />
        </Field>
        <Field label="Description">
          <input value={blurb} onChange={(e) => setBlurb(e.target.value)} className={inputClasses} />
        </Field>
      </div>
      <button type="submit" className="mt-4 bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-safelight-deep">
        Save changes
      </button>
    </form>
  )
}
