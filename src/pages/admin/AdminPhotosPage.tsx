import { useEffect, useState, type FormEvent } from 'react'

import { photosApi } from '@/lib/adminApi'

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
  const [category, setCategory] = useState('portrait')
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setPhotos((await photosApi.list()).photos)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await photosApi.create({ category, src, alt, caption: caption || undefined })
      setSrc('')
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
        <h1 className="font-display text-3xl text-ink">Portfolio photos</h1>
        <p className="mt-1 text-sm text-ink/60">
          Photographs shown on the portfolio and home pages. Image files live in the website's
          <code className="exif"> /photos/ </code> folder or any public URL.
        </p>
      </div>

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
            <Field label="Alt text (describe the photo)">
              <input required value={alt} onChange={(e) => setAlt(e.target.value)} className={inputClasses} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Caption (optional)">
              <input value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClasses} />
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

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-ink/50">{photos.length} photos</h2>
        {photos.length === 0 ? (
          <EmptyNote>No photos yet.</EmptyNote>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => (
              <div key={p.id} className="border border-ink/12 bg-mat/40 p-3">
                <img src={p.src} alt={p.alt} className="aspect-[4/3] w-full border border-ink/10 object-cover" />
                <p className="mt-2 truncate text-xs text-ink/70">{p.alt}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="exif text-silver">{p.category}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await photosApi.remove(p.id).catch(() => undefined)
                      await load()
                    }}
                    className="text-xs text-ink/45 hover:text-safelight-deep"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
