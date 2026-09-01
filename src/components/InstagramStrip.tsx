import { useEffect, useState } from 'react'

import { photos } from '@/config/content'
import { site } from '@/config/site'
import { publicApi, type InstagramPostData } from '@/lib/adminApi'

import { InstagramIcon } from './SocialIcons'

/**
 * Edge-to-edge strip of square Instagram photos at the bottom of the home
 * page. Polls the API so new posts appear without a rebuild; while the feed
 * is empty it falls back to the studio's own photographs linking to the
 * Instagram profile.
 */
export function InstagramStrip() {
  const [posts, setPosts] = useState<InstagramPostData[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      publicApi
        .instagram()
        .then((result) => {
          if (!cancelled) setPosts(result.posts)
        })
        .catch(() => undefined)
    }
    load()
    const id = window.setInterval(load, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const profileUrl = `https://instagram.com/${site.instagram}`
  const items =
    posts && posts.length > 0
      ? posts.slice(0, 12).map((p) => ({ url: p.url, image_url: p.image_url, caption: p.caption }))
      : photos
          .filter((p) => p.src)
          .slice(0, 6)
          .map((p) => ({ url: profileUrl, image_url: p.src as string, caption: p.caption ?? null }))

  return (
    <section aria-label="Instagram" className="mt-20">
      <div className="mb-5 flex items-center justify-center gap-3">
        <InstagramIcon className="h-5 w-5 text-ink/70" />
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="eyebrow text-ink/70 transition-colors hover:text-safelight-deep"
        >
          @{site.instagram}
        </a>
      </div>
      <div className="grid w-full grid-cols-3 sm:grid-cols-6">
        {items.map((post) => (
          <a key={post.url + post.image_url} href={post.url} target="_blank" rel="noreferrer" className="group relative block">
            <img
              src={post.image_url}
              alt={post.caption ?? 'Instagram photograph'}
              loading="lazy"
              className="aspect-square w-full object-cover transition-opacity duration-200 group-hover:opacity-85"
            />
          </a>
        ))}
      </div>
    </section>
  )
}
