import { useEffect, useState } from 'react'


import { site } from '@/config/site'
import { publicApi, type ReviewData } from '@/lib/adminApi'
import { useSiteContent } from '@/hooks/useSiteContent'

import { Button } from '@/components/Button'
import { HeroCarousel } from '@/components/HeroCarousel'
import { InstagramStrip } from '@/components/InstagramStrip'
import { PhotoFrame } from '@/components/PhotoFrame'
import { ReviewsCarousel } from '@/components/ReviewsCarousel'
import { SectionHeading } from '@/components/SectionHeading'
import { usePageMeta } from '@/lib/usePageMeta'

const fallbackReviews: ReviewData[] = [
  {
    author: 'Catalina G',
    quote:
      'Nathalie instantly created a safe and comfortable environment while shooting. She hits the nail on the head every time and gives great direction so the pictures come out beautiful.',
    source: null,
  },
]

export function HomePage() {
  usePageMeta(
    `${site.name} | Photography`,
    'Nathalie Lopez is a photographer based in West Yorkshire, working in portraiture, weddings, and editorial assignments — available for commissions and print orders.',
  )
  const content = useSiteContent()
  const [reviews, setReviews] = useState<ReviewData[]>(fallbackReviews)

  useEffect(() => {
    publicApi
      .reviews()
      .then((r) => r.reviews.length > 0 && setReviews(r.reviews))
      .catch(() => undefined)
  }, [])

  const heroSlides = content.photos
    .filter((p) => p.src)
    .slice(0, 5)
    .map((p) => ({ image_url: p.src, alt: p.alt, caption: p.caption }))

  return (
    <div>
      {/* ---- Full-bleed hero carousel ------------------------------------- */}
      <HeroCarousel slides={heroSlides} />

      {/* ---- Tagline band --------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center" data-reveal>
        <p className="eyebrow text-ink/80">
          Wedding &amp; portrait photography capturing{' '}
          <span className="font-display normal-case tracking-normal text-ink italic">
            life's most unforgettable moments
          </span>
        </p>
        <div className="rule mx-auto mt-6 w-64" />
        <p className="mt-6 text-lg text-ink/70">{content.site.service_area ?? site.serviceArea}</p>
      </section>

      {/* ---- Selected work ------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div data-reveal>
          <SectionHeading
            eyebrow="Selected work"
            title="Recent frames"
            lede="A rotating pick from the last few months — portraits, weddings, and assignments for print."
          />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.photos.slice(0, 3).map((photo, i) => (
            <div key={photo.src + photo.alt} data-reveal style={{ '--reveal-delay': `${i * 120}ms` } as React.CSSProperties}>
              <PhotoFrame
                photo={{
                  src: photo.src,
                  alt: photo.alt,
                  caption: photo.caption ?? undefined,
                  exif: photo.exif ?? undefined,
                  category: 'portrait',
                  tones: ['#d9c6ad', '#6f5b4a'],
                  aspect: photo.aspect,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-8" data-reveal>
          <Button to="/portfolio" variant="quiet">
            View the full portfolio →
          </Button>
        </div>
      </section>

      {/* ---- Ways to work together ----------------------------------------- */}
      <section className="bg-mat/70 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div data-reveal>
            <SectionHeading
              eyebrow="Investment"
              title="Ways to work together"
              lede="Every booking starts with a conversation about what the pictures are for."
            />
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {content.sessions.map((session, i) => (
              <div
                key={session.name}
                data-reveal
                style={{ '--reveal-delay': `${i * 120}ms` } as React.CSSProperties}
                className="flex flex-col gap-2 border border-ink/12 bg-paper p-6"
              >
                <h3 className="font-display text-2xl text-ink">{session.name}</h3>
                <span className="exif text-safelight-deep">{session.price}</span>
                <p className="text-sm leading-relaxed text-ink/70">{session.blurb}</p>
              </div>
            ))}
          </div>
          <div className="mt-8" data-reveal>
            <Button to="/investment" variant="quiet">
              Sessions and rates →
            </Button>
          </div>
        </div>
      </section>

      {/* ---- Reviews -------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div data-reveal>
          <SectionHeading eyebrow="Kind words" title="From the people in the pictures" align="center" />
        </div>
        <div className="mt-8" data-reveal>
          <ReviewsCarousel reviews={reviews} />
        </div>
      </section>

      {/* ---- CTA ------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div data-reveal className="flex flex-col items-start gap-6 border border-ink/12 bg-darkroom px-8 py-12 sm:items-center sm:text-center">
          <h2 className="max-w-2xl font-display text-3xl leading-tight text-paper sm:text-4xl">
            Have something worth remembering?
          </h2>
          <p className="max-w-xl leading-relaxed text-paper/70">
            Dates go quickly in the warm months. Tell me what you're planning and we'll make
            something of it.
          </p>
          <Button to="/contact">Get in touch</Button>
        </div>
      </section>

      {/* ---- Instagram strip -------------------------------------------------- */}
      <InstagramStrip />
    </div>
  )
}
