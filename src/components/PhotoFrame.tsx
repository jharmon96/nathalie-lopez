import { useId } from 'react'

import type { Photo } from '@/config/content'

/**
 * A photograph in a mat-board frame. Until a real scan is dropped in
 * (`photo.src`), the frame shows the darkroom placeholder — a wash of the
 * print's tones under film grain — so layouts read true before the
 * photographs arrive. Every frame develops on first paint.
 */
export function PhotoFrame({
  photo,
  delay = 0,
  className = '',
}: {
  photo: Photo
  /** ms by which this frame's development is staggered */
  delay?: number
  className?: string
}) {
  const grainId = useId()
  const aspect = photo.aspect ?? '4/5'

  return (
    <figure className={`group ${className}`}>
      <div
        className="relative overflow-hidden border border-ink/12 bg-mat p-1.5"
        style={{ aspectRatio: aspect }}
      >
        <div className="develop h-full w-full" style={{ '--d': `${delay}ms` } as React.CSSProperties}>
          {photo.src ? (
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
            />
          ) : (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label={photo.alt}>
              <defs>
                <linearGradient id={`${grainId}-tone`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={photo.tones[0]} />
                  <stop offset="100%" stopColor={photo.tones[1]} />
                </linearGradient>
                <filter id={`${grainId}-grain`}>
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <radialGradient id={`${grainId}-vignette`} cx="0.5" cy="0.45" r="0.75">
                  <stop offset="60%" stopColor="transparent" />
                  <stop offset="100%" stopColor="rgba(20,16,12,0.35)" />
                </radialGradient>
              </defs>
              <rect width="100" height="100" fill={`url(#${grainId}-tone)`} />
              <rect width="100" height="100" filter={`url(#${grainId}-grain)`} opacity="0.14" />
              <rect width="100" height="100" fill={`url(#${grainId}-vignette)`} />
            </svg>
          )}
        </div>
      </div>
      {(photo.caption || photo.exif) && (
        <figcaption className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-0.5">
          {photo.caption && <span className="text-sm leading-relaxed text-ink/75">{photo.caption}</span>}
          {photo.exif && <span className="exif text-silver">{photo.exif}</span>}
        </figcaption>
      )}
    </figure>
  )
}
