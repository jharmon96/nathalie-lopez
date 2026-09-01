import { useEffect, useState, type FormEvent } from 'react'

import { photosApi } from '@/lib/adminApi'

import { SortableList } from '@/components/admin/Sortable'
import { EmptyNote, Field, inputClasses, Panel } from './ui'

interface Photo {
  id: number
  category: string
  src: string
  alt: string
  caption: string | null
  sort_order: number
}

const CATEGORIES = [
  { value: 'portrait', label: 'Portraits' },
  { value: 'wedding', label: 'Weddings' },
  { value: 'editorial', label: 'Editorial' },
]

const URL_HINT =
  "Any publicly viewable HTTPS URL works — the site's /photos/ folder, an S3 bucket, Cloudflare, Imgur…"

export function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setPhotos((await photosApi.list()).photos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load photos')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleReorder(ids: number[]) {
    await photosApi.reorder(ids).catch(() => undefined)
    await load()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Portfolio photos</h1>
        <p className="mt-1 text-sm text-ink/60">
          Drag to reorder — the order here is the order on the Portfolio page. {URL_HINT}
        </p>
      </div>

      <PhotoCreateForm onCreated={load} />

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-ink/50">{photos.length} photos</h2>
        {error && <p className="text-sm text-safelight-deep">{error}</p>}
        {photos.length === 0 ? (
          <EmptyNote>No photos yet.</EmptyNote>
        ) : (
          <SortableList
            items={photos}
            keyOf={(p) => p.id}
            onReorder={handleReorder}
            renderItem={(p) => <PhotoEditor photo={p} onDeleted={load} />}
          />
        )}
      </section>
    </div>
  )
}

function PhotoEditor({ photo, onDeleted }: { photo: Photo; onDeleted: () => Promise<void> }) {
  const [draft, setDraft] = useState({
    category: photo.category,
    src: photo.src,
    alt: photo.alt,
    caption: photo.caption ?? '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function dirty() {
    return (
      draft.category !== photo.category ||
      draft.src !== photo.src ||
      draft.alt !== photo.alt ||
      draft.caption !== (photo.caption ?? '')
    )
  }

  async function save() {
    if (!dirty()) return
    setStatus('saving')
    setErrorMessage(null)
    try {
      await photosApi.update(photo.id, {
        category: draft.category,
        src: draft.src.trim(),
        alt: draft.alt,
        caption: draft.caption || undefined,
      })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
      onDeleted() // reload so the baseline matches the server
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Could not save')
    }
  }

  function onBlur(e: React.FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) save()
  }

  return (
    <div className="border border-ink/12 bg-mat/40 p-3">
      <div className="mb-1 flex items-center gap-3">
        <span className="exif text-ink/40">{photo.category}</span>
        {status === 'saving' && <span className="exif text-safelight-deep">saving…</span>}
        {status === 'saved' && <span className="exif text-safelight-deep">saved ✓</span>}
        {status === 'error' && <span className="exif text-safelight-deep">error: {errorMessage}</span>}
        <button
          type="button"
          onClick={async () => {
            await photosApi.remove(photo.id).catch(() => undefined)
            onDeleted()
          }}
          className="ml-auto text-xs text-ink/45 hover:text-safelight-deep"
        >
          Delete
        </button>
      </div>
      <div className="flex items-start gap-4" onBlur={onBlur}>
        <img
          src={draft.src}
          alt={draft.alt}
          className="h-20 w-28 shrink-0 border border-ink/10 object-cover"
        />
        <div className="min-w-0 flex-1">
          <input
            value={draft.src}
            onChange={(e) => setDraft((d) => ({ ...d, src: e.target.value }))}
            className="w-full bg-transparent text-sm text-ink outline-none"
            placeholder="Image URL"
            aria-label="Image URL"
          />
          <div className="mt-1 flex gap-3">
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="w-36 bg-transparent text-xs text-ink/60 outline-none"
              aria-label="Category"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              value={draft.alt}
              onChange={(e) => setDraft((d) => ({ ...d, alt: e.target.value }))}
              className="min-w-0 flex-1 bg-transparent text-xs text-ink/60 outline-none"
              placeholder="Alt text"
              aria-label="Alt text"
            />
          </div>
          <input
            value={draft.caption ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
            className="mt-1 w-full bg-transparent text-xs text-ink/60 outline-none"
            placeholder="Caption (optional)"
            aria-label="Caption"
          />
        </div>
      </div>
    </div>
  )
}

function PhotoCreateForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [category, setCategory] = useState('portrait')
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await photosApi.create({ category, src: src.trim(), alt })
      setSrc('')
      setAlt('')
      await onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  return (
    <Panel title="Add a photo">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Image URL" hint={URL_HINT}>
          <input
            required
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            className={inputClasses}
            placeholder="https://your-bucket.s3.amazonaws.com/photo.jpg"
          />
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClasses}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Alt text">
            <input required value={alt} onChange={(e) => setAlt(e.target.value)} className={inputClasses} />
          </Field>
        </div>
        {error && <p className="text-sm text-safelight-deep sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button type="submit" className="self-start bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-safelight-deep">
            Add photo
          </button>
        </div>
      </form>
    </Panel>
  )
}
