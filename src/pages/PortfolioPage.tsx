import { useState } from 'react'

import { categories, photos, type Category } from '@/config/content'
import { site } from '@/config/site'

import { PhotoFrame } from '@/components/PhotoFrame'
import { SectionHeading } from '@/components/SectionHeading'
import { usePageMeta } from '@/lib/usePageMeta'

export function PortfolioPage() {
  usePageMeta(`Portfolio | ${site.name}`, 'Portraits, weddings, and editorial photography by Nathalie Lopez.')
  const [active, setActive] = useState<Category | 'all'>('all')

  const shown = active === 'all' ? photos : photos.filter((photo) => photo.category === active)

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        eyebrow="Portfolio"
        title="The work"
        lede="Contact sheets, culled. Every frame here is one I'd hang on my own wall."
      />

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {categories.map((category) => (
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
          <PhotoFrame key={photo.caption} photo={photo} delay={i * 120} className="break-inside-avoid" />
        ))}
      </div>
    </div>
  )
}
