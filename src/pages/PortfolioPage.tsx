import { useState } from 'react'

import { site } from '@/config/site'
import { useSiteContent } from '@/hooks/useSiteContent'

import { PhotoFrame } from '@/components/PhotoFrame'
import { SectionHeading } from '@/components/SectionHeading'
import { usePageMeta } from '@/lib/usePageMeta'

type Category = 'all' | 'portrait' | 'wedding' | 'editorial'

const filterLabels: { id: Category; label: string }[] = [
  { id: 'all', label: 'All work' },
  { id: 'portrait', label: 'Portraits' },
  { id: 'wedding', label: 'Weddings' },
  { id: 'editorial', label: 'Editorial' },
]

export function PortfolioPage() {
  usePageMeta(`Portfolio | ${site.name}`, 'Portraits, weddings, and editorial photography by Nathalie Lopez.')
  const [active, setActive] = useState<Category>('all')
  const content = useSiteContent()

  const shown = active === 'all' ? content.photos : content.photos.filter((p) => p.category === active)

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        eyebrow="Portfolio"
        title="The work"
        lede="Contact sheets, culled. Every frame here is one I'd hang on my own wall."
      />

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {filterLabels.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={active === category.id}
            onClick={() => setActive(category.id)}
            className={`border px-4 py-1.5 text-sm transition-colors ${
              active === category.id
                ? 'border-ink bg-ink text-paper'
                : 'border-ink/20 text-ink/70 hover:border-safelight hover:text-safelight-deep'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-10 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>figure]:mb-6">
        {shown.map((photo, i) => (
          <div
            key={`${photo.src}-${photo.alt}-${i}`}
            data-reveal
            style={{ '--reveal-delay': `${(i % 9) * 100}ms` } as React.CSSProperties}
            className="mb-6 break-inside-avoid"
          >
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
    </div>
  )
}
