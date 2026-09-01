import { useEffect, useState, type FormEvent } from 'react'

import { slidesApi, type AdminSlide } from '@/lib/adminApi'

import { EmptyNote, Field, inputClasses, Panel } from './ui'

export function AdminCarouselPage() {
  const [slides, setSlides] = useState<AdminSlide[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setSlides((await slidesApi.list()).slides)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await slidesApi.create({ image_url: imageUrl, alt, caption: caption || null, sort_order: slides.length })
      setImageUrl('')
      setAlt('')
      setCaption('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Hero carousel</h1>
        <p className="mt-1 text-sm text-ink/60">
          Horizontal slides at the top of the home page. Landscape images work best.
        </p>
      </div>

      <Panel title="Add a slide">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Image URL">
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
          <div className="flex flex-col gap-4">
            {slides.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 border border-ink/12 bg-mat/40 p-3">
                <span className="exif text-silver">{i + 1}</span>
                <img src={s.image_url} alt={s.alt} className="h-14 w-24 border border-ink/10 object-cover" />
                <p className="flex-1 truncate text-sm text-ink/70">{s.caption ?? s.alt}</p>
                <button
                  type="button"
                  onClick={async () => {
                    await slidesApi.remove(s.id).catch(() => undefined)
                    await load()
                  }}
                  className="text-xs text-ink/45 hover:text-safelight-deep"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
