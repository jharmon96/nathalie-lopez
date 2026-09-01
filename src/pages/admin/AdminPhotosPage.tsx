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
          Drag to reorder — the order here is the order on the Portfolio page. Image files live in
          the website's /photos/ folder or any public URL.
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
  const [draft, setDraft] = useState({ alt: photo.alt, caption: photo.caption ?? '' })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function save() {
    if (draft.alt === photo.alt && draft.caption === (photo.caption ?? '')) return
    setStatus('saving')
    await photosApi.update(photo.id, { alt: draft.alt, caption: draft.caption || undefined }).catch(() => undefined)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }

  function onBlur(e: React.FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) save()
  }

  return (
    <div className="border border-ink/12 bg-mat/40 p-3">
      {status === 'saving' && <span className="exif text-safelight-deep">saving…</span>}
      {status === 'saved' && <span className="exif text-safelight-deep">saved ✓</span>}
      <div className="flex items-start gap-4">
        <img src={photo.src} alt={photo.alt} className="h-20 w-28 border border-ink/10 object-cover" />
        <div className="min-w-0 flex-1">
          <input
            value={draft.alt}
            onChange={(e) => setDraft((d) => ({ ...d, alt: e.target.value }))}
            onBlur={onBlur}
            className="w-full bg-transparent text-sm text-ink outline-none"
            aria-label="Alt text"
          />
          <input
            value={draft.caption ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
            onBlur={onBlur}
            className="mt-1 w-full bg-transparent text-xs text-ink/60 outline-none"
            placeholder="Caption (optional)"
          />
        </div>
        <button
          type="button"
          onClick={async () => {
            await photosApi.remove(photo.id).catch(() => undefined)
            onDeleted()
          }}
          className="text-xs text-ink/45 hover:text-safelight-deep"
        >
          Delete
        </button>
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
      await photosApi.create({ category, src, alt })
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
        <Field label="Image URL">
          <input required value={src} onChange={(e) => setSrc(e.target.value)} className={inputClasses} placeholder="/photos/my-photo.jpg" />
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClasses}>
            <option value="portrait">Portraits</option>
            <option value="wedding">Weddings</option>
            <option value="editorial">Editorial</option>
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
