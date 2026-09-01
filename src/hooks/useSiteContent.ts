import { useEffect, useState } from 'react'

import { faqs, photos, sessions, siteText } from '@/config/content'
import { publicApi, type SiteContent } from '@/lib/adminApi'

let cache: SiteContent | null = null

function defaults(): SiteContent {
  return {
    faqs,
    photos: photos.map((p) => ({
      category: p.category,
      src: p.src ?? '',
      alt: p.alt,
      caption: p.caption ?? null,
      exif: p.exif ?? null,
      aspect: p.aspect ?? '4/5',
    })),
    sessions: sessions.map((s) => ({
      name: s.name,
      price: s.price,
      blurb: s.blurb ?? null,
      includes: s.includes,
      featured: Boolean(s.featured),
    })),
    site: { ...siteText },
  }
}

/**
 * Editable site content (FAQs, photos, sessions, homepage text) from the
 * database, falling back to the studio defaults until an admin has saved
 * changes. Fetched once per page load and cached module-wide.
 */
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(() => cache ?? defaults())

  useEffect(() => {
    if (cache) return
    let cancelled = false
    publicApi
      .content()
      .then((api) => {
        cache = api
        if (!cancelled) setContent(api)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return content
}
