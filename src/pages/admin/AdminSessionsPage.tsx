import { useEffect, useState, type FormEvent } from 'react'

import { sessionsApi } from '@/lib/adminApi'

import { SortableList } from '@/components/admin/Sortable'
import { EmptyNote, Field, inputClasses, Panel } from './ui'

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
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setSessions((await sessionsApi.list()).sessions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sessions')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleReorder(ids: number[]) {
    await sessionsApi.reorder(ids).catch(() => undefined)
    await load()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Pricing</h1>
        <p className="mt-1 text-sm text-ink/60">
          The tiers shown on the Investment page — drag to reorder. Changes appear on the site
          immediately.
        </p>
      </div>

      <Panel title="Add a tier">
        <SessionCreateForm onCreated={load} />
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-ink/50">{sessions.length} tiers</h2>
        {error && <p className="text-sm text-safelight-deep">{error}</p>}
        {sessions.length === 0 ? (
          <EmptyNote>No tiers yet.</EmptyNote>
        ) : (
          <SortableList
            items={sessions}
            keyOf={(s) => s.id}
            onReorder={handleReorder}
            renderItem={(s) => <SessionEditor session={s} onSaved={load} />}
          />
        )}
      </section>
    </div>
  )
}

function SessionCreateForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [blurb, setBlurb] = useState('')
  const [featured, setFeatured] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await sessionsApi.create({
        name,
        price,
        blurb: blurb || null,
        includes: null,
        featured,
        sort_order: 99,
      })
      setName('')
      setPrice('')
      setBlurb('')
      setFeatured(false)
      await onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name">
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
      </Field>
      <Field label="Price">
        <input required value={price} onChange={(e) => setPrice(e.target.value)} className={inputClasses} placeholder="from £300" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description">
          <input value={blurb} onChange={(e) => setBlurb(e.target.value)} className={inputClasses} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink/70 sm:col-span-2">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Mark as most-booked (highlighted)
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className="self-start bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-safelight-deep">
          Add tier
        </button>
        {error && <p className="mt-2 text-sm text-safelight-deep">{error}</p>}
      </div>
    </form>
  )
}

function SessionEditor({ session, onSaved }: { session: Session; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState({
    name: session.name,
    price: session.price,
    blurb: session.blurb ?? '',
    includes: session.includes ?? '',
    featured: session.featured,
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function save() {
    if (
      draft.name === session.name &&
      draft.price === session.price &&
      draft.blurb === (session.blurb ?? '') &&
      draft.includes === (session.includes ?? '') &&
      draft.featured === session.featured
    ) {
      return
    }
    setStatus('saving')
    await sessionsApi
      .update(session.id, {
        name: draft.name,
        price: draft.price,
        blurb: draft.blurb,
        includes: draft.includes,
        featured: draft.featured,
      })
      .catch(() => undefined)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
    await onSaved()
  }

  function onBlur(e: React.FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) save()
  }

  return (
    <div
      className="border border-ink/12 bg-mat/40 p-5"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) save()
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          onBlur={onBlur}
          className="w-full bg-transparent font-display text-lg text-ink outline-none"
          aria-label="Session name"
        />
        {status === 'saving' && <span className="exif text-safelight-deep">saving…</span>}
        {status === 'saved' && <span className="exif text-safelight-deep">saved ✓</span>}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="eyebrow text-ink/45">Price</span>
          <input
            value={draft.price}
            onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
            onBlur={onBlur}
            aria-label="Tier price"
            className="w-full bg-transparent px-1 py-0.5 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="eyebrow text-ink/45">Description</span>
          <input
            value={draft.blurb}
            onChange={(e) => setDraft((d) => ({ ...d, blurb: e.target.value }))}
            onBlur={onBlur}
            className="w-full bg-transparent px-1 py-0.5 text-sm text-ink outline-none"
          />
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" checked={draft.featured} onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))} onBlur={onBlur} />
        Most-booked (highlighted)
      </label>
      <label className="mt-3 flex flex-col gap-1">
        <span className="eyebrow text-ink/45">What's included — one line per bullet</span>
        <textarea
          rows={4}
          value={draft.includes}
          onChange={(e) => setDraft((d) => ({ ...d, includes: e.target.value }))}
          onBlur={onBlur}
          placeholder={'2-hour shoot\n40 edited images\nOnline gallery'}
          aria-label="Tier includes"
          className="w-full bg-transparent px-1 py-0.5 text-sm text-ink outline-none"
        />
      </label>
    </div>
  )
}
