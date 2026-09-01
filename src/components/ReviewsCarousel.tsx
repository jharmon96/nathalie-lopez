import { useEffect, useState } from 'react'

export interface ReviewItem {
  author: string
  quote: string
  source: string | null
}

/** Centered testimonial carousel with the round edge arrows from the reference. */
export function ReviewsCarousel({ reviews }: { reviews: ReviewItem[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reviews.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (!paused) setIndex((i) => (i + 1) % reviews.length)
    }, 7000)
    return () => window.clearInterval(id)
  }, [reviews.length, paused])

  if (reviews.length === 0) return null

  const review = reviews[((index % reviews.length) + reviews.length) % reviews.length]

  return (
    <div
      className="relative mx-auto max-w-4xl px-14 py-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <blockquote className="text-center">
        <p className="font-display text-2xl leading-relaxed text-ink sm:text-[1.75rem]">“{review.quote}”</p>
        <footer className="mt-5 flex flex-col items-center gap-1">
          <span className="text-sm tracking-wide text-ink/80">{review.author}</span>
          {review.source && <span className="exif text-silver">{review.source}</span>}
        </footer>
      </blockquote>

      {reviews.length > 1 && (
        <>
          <RoundArrow direction="left" onClick={() => setIndex((i) => i - 1)} />
          <RoundArrow direction="right" onClick={() => setIndex((i) => i + 1)} />
          <div className="mt-6 flex justify-center gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to review ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === ((index % reviews.length) + reviews.length) % reviews.length ? 'bg-safelight' : 'bg-ink/20'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function RoundArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  const flip = direction === 'left' ? 'rotate-180' : ''
  const side = direction === 'left' ? 'left-0' : 'right-0'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous review' : 'Next review'}
      className={`absolute ${side} top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-darkroom/85 text-paper transition-colors hover:bg-safelight-deep`}
    >
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${flip}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12h16M4 12l5-5M4 12l5 5" />
      </svg>
    </button>
  )
}
