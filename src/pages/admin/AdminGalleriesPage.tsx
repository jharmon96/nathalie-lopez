import { useEffect, useState, type FormEvent } from 'react'

import { customersApi, galleriesApi, type Gallery } from '@/lib/adminApi'
import { site } from '@/config/site'

import { EmptyNote, Field, inputClasses, Panel } from './ui'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function AdminGalleriesPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([])
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const [galleryResult, customerResult] = await Promise.all([galleriesApi.list(), customersApi.list()])
    setGalleries(galleryResult.galleries)
    setCustomers(customerResult.customers.map((c) => ({ id: c.id, name: c.name })))
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await galleriesApi.create({
        customer_id: customerId ? Number(customerId) : null,
        title,
        slug: slugify(slug),
        passphrase: passphrase || null,
        description: null,
      })
      setTitle('')
      setSlug('')
      setPassphrase('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  async function addPhoto(gallery: Gallery) {
    const url = photoUrls[gallery.id]?.trim()
    if (!url) return
    await galleriesApi
      .addPhoto(gallery.id, { url, caption: null, sort_order: gallery.photos.length })
      .catch(() => undefined)
    setPhotoUrls((prev) => ({ ...prev, [gallery.id]: '' }))
    await load()
  }

  async function removePhoto(gallery: Gallery, photoId: number) {
    await galleriesApi.removePhoto(gallery.id, photoId).catch(() => undefined)
    await load()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this gallery and its photos?')) return
    await galleriesApi.remove(id).catch(() => undefined)
    await load()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Customer galleries</h1>
        <p className="mt-1 text-sm text-ink/60">
          Private proofing galleries. Share links look like {site.url}/gallery/&#123;slug&#125;.
        </p>
      </div>

      <Panel title="New gallery">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
          <Field label="Title">
            <input
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setSlug(slugify(e.target.value))
              }}
              className={inputClasses}
              placeholder="The Halliwell wedding"
            />
          </Field>
          <Field label="Slug">
            <input required value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClasses} />
          </Field>
          <Field label="Customer">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClasses}>
              <option value="">— none —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Passphrase (optional)">
              <input
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className={inputClasses}
                placeholder="Leave empty for link-only access"
              />
            </Field>
          </div>
          {error && <p className="text-sm text-safelight-deep sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-safelight-deep"
            >
              Create gallery
            </button>
          </div>
        </form>
      </Panel>

      <section className="flex flex-col gap-6">
        <h2 className="eyebrow text-ink/50">{galleries.length} galleries</h2>
        {galleries.length === 0 ? (
          <EmptyNote>No galleries yet.</EmptyNote>
        ) : (
          galleries.map((g) => (
            <div key={g.id} className="border border-ink/12 bg-mat/40 p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl text-ink">{g.title}</h3>
                  <p className="exif mt-1 text-silver">
                    /gallery/{g.slug}
                    {g.passphrase && ' · passphrase-protected'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`${site.url}/gallery/${g.slug}`).catch(() => undefined)}
                    className="border border-ink/25 px-3 py-1 text-xs text-ink/70 hover:border-safelight hover:text-safelight-deep"
                  >
                    Copy link
                  </button>
                  <a
                    href={`/gallery/${g.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-ink/25 px-3 py-1 text-xs text-ink/70 hover:border-safelight hover:text-safelight-deep"
                  >
                    Open
                  </a>
                  <button type="button" onClick={() => handleDelete(g.id)} className="text-xs text-ink/45 hover:text-safelight-deep">
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {g.photos.map((p) => (
                  <figure key={p.url} className="relative">
                    <img src={p.url} alt={p.caption ?? ''} className="h-16 w-16 border border-ink/12 object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(g, p.id)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center border border-ink/25 bg-paper text-xs text-ink/60 hover:text-safelight-deep"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </figure>
                ))}
                {g.photos.length === 0 && <p className="text-sm italic text-ink/45">No photos yet — paste an image URL below.</p>}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={photoUrls[g.id] ?? ''}
                  onChange={(e) => setPhotoUrls((prev) => ({ ...prev, [g.id]: e.target.value }))}
                  className={inputClasses}
                  placeholder="https://…/photo.jpg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPhoto(g)
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addPhoto(g)}
                  className="whitespace-nowrap border border-ink/25 px-4 text-sm text-ink/70 hover:border-safelight hover:text-safelight-deep"
                >
                  Add photo
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
