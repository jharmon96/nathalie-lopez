import { useCallback, useEffect, useRef, useState } from 'react'

export interface HeroSlide {
  image_url: string
  alt: string
  caption?: string | null
}

/**
 * Full-bleed horizontal carousel. The centre slide is prominent while its
 * neighbours peek in from the screen edges (scroll-snap does the heavy
 * lifting; the arrows just scroll). Autoplay advances every 5s unless the
 * visitor prefers reduced motion or is hovering the strip.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const [index, setIndex] = useState(0)

  const goTo = useCallback(
    (raw: number) => {
      const track = trackRef.current
      if (!track || slides.length === 0) return
      const i = ((raw % slides.length) + slides.length) % slides.length
      const child = track.children[i] as HTMLElement | undefined
      if (!child) return
      const left = child.offsetLeft - (track.clientWidth - child.clientWidth) / 2
      track.scrollTo({ left, behavior: 'smooth' })
      setIndex(i)
    },
    [slides.length],
  )

  // Autoplay
  useEffect(() => {
    if (slides.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (!pausedRef.current) setIndex((i) => (i + 1) % slides.length)
    }, 5000)
    return () => window.clearInterval(id)
  }, [slides.length])

  // Keep index in sync when the visitor swipes/scrolls manually
  const onScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || track.children.length < 2) return
    const first = track.children[0] as HTMLElement
    const second = track.children[1] as HTMLElement
    const step = second.offsetLeft - first.offsetLeft
    if (step <= 0) return
    setIndex(Math.round(track.scrollLeft / step) % slides.length)
  }, [slides.length])

  if (slides.length === 0) return null

  return (
    <section
      aria-label="Featured photographs"
      className="relative w-full"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {slides.map((slide, i) => (
          <figure
            key={`${slide.image_url}-${i}`}
            className={`relative mx-2 flex-none snap-center sm:mx-3 ${
              slides.length === 1 ? 'w-full' : 'w-[82%] sm:w-[calc(100%-10rem)]'
            }`}
          >
            <img
              src={slide.image_url}
              alt={slide.alt}
              className="aspect-[16/9] w-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {slide.caption && (
              <figcaption className="absolute bottom-3 left-4 exif text-paper/90 drop-shadow">
                {slide.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <CarouselArrow direction="left" onClick={() => goTo(index - 1)} />
          <CarouselArrow direction="right" onClick={() => goTo(index + 1)} />
        </>
      )}
    </section>
  )
}

function CarouselArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  const flip = direction === 'left' ? 'rotate-180' : ''
  const side = direction === 'left' ? 'left-3' : 'right-3'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous slide' : 'Next slide'}
      className={`absolute ${side} top-1/2 flex h-10 w-12 -translate-y-1/2 items-center justify-center rounded-lg bg-paper/90 text-ink shadow-md transition-colors hover:bg-paper`}
    >
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${flip}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12h16M4 12l5-5M4 12l5 5" />
      </svg>
    </button>
  )
}
