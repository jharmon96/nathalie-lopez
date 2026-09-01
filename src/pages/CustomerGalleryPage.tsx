import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { publicGalleryApi, type PublicGallery } from '@/lib/adminApi'
import { site } from '@/config/site'

import { PhotoFrame } from '@/components/PhotoFrame'
import { inputClasses } from '@/pages/admin/ui'
import { usePageMeta } from '@/lib/usePageMeta'

export function CustomerGalleryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [gallery, setGallery] = useState<PublicGallery | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  usePageMeta(`Gallery | ${site.name}`)

  useEffect(() => {
    if (!slug) return
    publicGalleryApi
      .get(slug)
      .then(setGallery)
      .catch(() => setNotFound(true))
  }, [slug])

  async function handleUnlock(event: FormEvent) {
    event.preventDefault()
    if (!slug) return
    setError(null)
    try {
      setGallery(await publicGalleryApi.unlock(slug, passphrase))
    } catch {
      setError("That passphrase isn't right — check the spelling.")
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <p className="exif text-safelight-deep">Gallery not found</p>
        <p className="mt-4 text-ink/70">Check the link you were sent, or write to {site.email}.</p>
      </div>
    )
  }

  if (!gallery) {
    return <div className="py-32 text-center text-ink/50">Loading…</div>
  }

  const locked = gallery.requires_password && gallery.photos === null

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="eyebrow text-safelight-deep">{site.name} · private gallery</p>
        <h1 className="mt-3 font-display text-4xl text-ink">{gallery.title}</h1>
        {gallery.description && <p className="mt-3 leading-relaxed text-ink/70">{gallery.description}</p>}
      </div>

      {locked ? (
        <form onSubmit={handleUnlock} className="mt-10 flex max-w-md flex-col gap-3 border border-ink/12 bg-mat/40 p-6">
          <label className="flex flex-col gap-1">
            <span className="eyebrow text-ink/55">Passphrase</span>
            <input
              required
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className={inputClasses}
              placeholder="The studio sent it with the link"
            />
          </label>
          {error && <p className="text-sm text-safelight-deep">{error}</p>}
          <button type="submit" className="self-start bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-safelight-deep">
            Open gallery
          </button>
        </form>
      ) : (
        <div className="mt-10 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>figure]:mb-6">
          {(gallery.photos ?? []).map((photo, i) => (
            <PhotoFrame
              key={photo.url}
              className="break-inside-avoid"
              delay={i * 150}
              photo={{
                src: photo.url,
                alt: photo.caption ?? `Gallery photograph ${i + 1}`,
                caption: photo.caption ?? undefined,
                category: 'portrait',
                tones: ['#dccdb9', '#7a6a55'],
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-16 border-t border-ink/10 pt-6 text-center">
        <Link to="/" className="text-sm text-ink/50 hover:text-safelight-deep">
          {site.name} · {site.location}
        </Link>
      </div>
    </div>
  )
}
