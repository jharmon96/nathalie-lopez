import { useEffect, useState, type FormEvent } from 'react'

import { slidesApi, type AdminSlide } from '@/lib/adminApi'

import { SortableList } from '@/components/admin/Sortable'
import { EmptyNote, Field, inputClasses, Panel } from './ui'

export function AdminCarouselPage() {
  const [slides, setSlides] = useState<AdminSlide[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setSlides((await slidesApi.list()).slides)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load slides')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await slidesApi.create({ image_url: imageUrl.trim(), alt, caption: caption || null, sort_order: slides.length })
      setImageUrl('')
      setAlt('')
      setCaption('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  async function handleReorder(ids: number[]) {
    await slidesApi.reorder(ids).catch(() => undefined)
    await load()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Hero carousel</h1>
        <p className="mt-1 text-sm text-ink/60">
          Full-width slides across the top of the home page — landscape images work best. Until you add
          the first slide, the home page shows your latest portfolio photos instead.
        </p>
      </div>

      <Panel title="Add a slide">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Image URL" hint="Any publicly viewable HTTPS URL — the site's /photos/ folder, an S3 bucket, Cloudflare, Imgur…">
              <input
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputClasses}
                placeholder="/photos/… or https://…"
              />
            </Field>
          </div>
          <Field label="Alt text">
            <input required value={alt} onChange={(e) => setAlt(e.target.value)} className={inputClasses} />
          </Field>
          <Field label="Caption (optional)">
            <input value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClasses} />
          </Field>
          {error && <p className="text-sm text-safelight-deep sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" className="self-start bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-safelight-deep">
              Add slide
            </button>
          </div>
        </form>
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-ink/50">{slides.length} slides</h2>
        {slides.length === 0 ? (
          <EmptyNote>No slides yet — the home page falls back to recent work.</EmptyNote>
        ) : (
          <SortableList
            items={slides}
            keyOf={(s) => s.id}
            onReorder={handleReorder}
            renderItem={(s) => <SlideEditor slide={s} onDeleted={load} />}
          />
        )}
      </section>
    </div>
  )
}

function SlideEditor({ slide, onDeleted }: { slide: AdminSlide; onDeleted: () => Promise<void> }) {
  const [draft, setDraft] = useState({
    image_url: slide.image_url,
    alt: slide.alt,
    caption: slide.caption ?? '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function dirty() {
    return (
      draft.image_url !== slide.image_url ||
      draft.alt !== slide.alt ||
      draft.caption !== (slide.caption ?? '')
    )
  }

  async function save() {
    if (!dirty()) return
    setStatus('saving')
    setErrorMessage(null)
    try {
      await slidesApi.update(slide.id, {
        image_url: draft.image_url.trim(),
        alt: draft.alt,
        caption: draft.caption || null,
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
        {status === 'saving' && <span className="exif text-safelight-deep">saving…</span>}
        {status === 'saved' && <span className="exif text-safelight-deep">saved ✓</span>}
        {status === 'error' && <span className="exif text-safelight-deep">error: {errorMessage}</span>}
        <button
          type="button"
          onClick={async () => {
            await slidesApi.remove(slide.id).catch(() => undefined)
            onDeleted()
          }}
          className="ml-auto text-xs text-ink/45 hover:text-safelight-deep"
        >
          Delete
        </button>
      </div>
      <div className="flex items-start gap-4" onBlur={onBlur}>
        <img
          src={draft.image_url}
          alt={draft.alt}
          className="h-14 w-24 shrink-0 border border-ink/10 object-cover"
        />
        <div className="min-w-0 flex-1">
          <input
            value={draft.image_url}
            onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))}
            className="w-full bg-transparent text-sm text-ink outline-none"
            placeholder="Image URL"
            aria-label="Image URL"
          />
          <div className="mt-1 flex gap-3">
            <input
              value={draft.alt}
              onChange={(e) => setDraft((d) => ({ ...d, alt: e.target.value }))}
              className="min-w-0 flex-1 bg-transparent text-xs text-ink/60 outline-none"
              placeholder="Alt text"
              aria-label="Alt text"
            />
            <input
              value={draft.caption ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
              className="min-w-0 flex-1 bg-transparent text-xs text-ink/60 outline-none"
              placeholder="Caption (optional)"
              aria-label="Caption"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
