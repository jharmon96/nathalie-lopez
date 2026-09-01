import { useEffect, useState } from 'react'

import { photos, sessions } from '@/config/content'
import { site } from '@/config/site'
import { publicApi, type ReviewData, type SlideData } from '@/lib/adminApi'

import { Button } from '@/components/Button'
import { HeroCarousel } from '@/components/HeroCarousel'
import { InstagramStrip } from '@/components/InstagramStrip'
import { PhotoFrame } from '@/components/PhotoFrame'
import { ReviewsCarousel } from '@/components/ReviewsCarousel'
import { SectionHeading } from '@/components/SectionHeading'
import { usePageMeta } from '@/lib/usePageMeta'

/** Studio photographs as the carousel fallback until slides are curated in admin. */
const fallbackSlides: SlideData[] = photos
  .filter((p) => p.src)
  .map((p) => ({ image_url: p.src as string, alt: p.alt, caption: p.caption ?? null }))

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
  const [slides, setSlides] = useState<SlideData[]>(fallbackSlides)
  const [reviews, setReviews] = useState<ReviewData[]>(fallbackReviews)

  useEffect(() => {
    publicApi.slides().then((r) => r.slides.length > 0 && setSlides(r.slides)).catch(() => undefined)
    publicApi.reviews().then((r) => r.reviews.length > 0 && setReviews(r.reviews)).catch(() => undefined)
  }, [])

  return (
    <div>
      {/* ---- Full-bleed hero carousel ------------------------------------- */}
      <HeroCarousel slides={slides} />

      {/* ---- Tagline band --------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="eyebrow text-ink/80">
          Wedding &amp; portrait photography capturing{' '}
          <span className="font-display normal-case tracking-normal text-ink italic">
            life's most unforgettable moments
          </span>
        </h1>
        <div className="rule mx-auto mt-6 w-64" />
        <p className="mt-6 text-lg text-ink/70">{site.serviceArea}</p>
      </section>

      {/* ---- Selected work ------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <SectionHeading
          eyebrow="Selected work"
          title="Recent frames"
          lede="A rotating pick from the last few months — portraits, weddings, and assignments for print."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.slice(0, 3).map((photo, i) => (
            <PhotoFrame key={photo.caption} photo={photo} delay={i * 200} />
          ))}
        </div>
        <div className="mt-8">
          <Button to="/portfolio" variant="quiet">
            View the full portfolio →
          </Button>
        </div>
      </section>

      {/* ---- Ways to work together ----------------------------------------- */}
      <section className="bg-mat/70 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Investment"
            title="Ways to work together"
            lede="Every booking starts with a conversation about what the pictures are for."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {sessions.map((session) => (
              <div key={session.name} className="flex flex-col gap-2 border border-ink/12 bg-paper p-6">
                <h3 className="font-display text-2xl text-ink">{session.name}</h3>
                <span className="exif text-safelight-deep">{session.price}</span>
                <p className="text-sm leading-relaxed text-ink/70">{session.blurb}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button to="/investment" variant="quiet">
              Sessions and rates →
            </Button>
          </div>
        </div>
      </section>

      {/* ---- Reviews -------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading eyebrow="Kind words" title="From the people in the pictures" align="center" />
        <div className="mt-8">
          <ReviewsCarousel reviews={reviews} />
        </div>
      </section>

      {/* ---- CTA ------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-col items-start gap-6 border border-ink/12 bg-darkroom px-8 py-12 sm:items-center sm:text-center">
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
