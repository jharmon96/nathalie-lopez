import { useState } from 'react'

import { site } from '@/config/site'

import { SectionHeading } from '@/components/SectionHeading'
import { usePageMeta } from '@/lib/usePageMeta'

const faqs = [
  {
    q: 'How do we book you?',
    a: 'Start with the enquiry form. We begin with a call or a coffee, and once we agree on the plan a 25% retainer locks in the date.',
  },
  {
    q: 'Do you travel?',
    a: 'Happily. Based in West Yorkshire, I photograph weddings and commissions across the UK and further afield — destination weddings carry simple, flat-rate travel pricing.',
  },
  {
    q: 'How many photographs will we get?',
    a: 'A portrait sitting yields 20+ finished frames; a full wedding day, 600+. Every gallery is a tight edit — culled, printed, and proofed by hand — not everything shot.',
  },
  {
    q: 'Do you shoot film?',
    a: 'Yes — 35mm and 120 alongside digital where it earns its place. Film scans arrive in the same gallery, labelled by stock.',
  },
  {
    q: 'How long until we see the gallery?',
    a: 'Portrait galleries within two weeks. Weddings within eight weeks, with a handful of sneak peeks in the days after.',
  },
  {
    q: 'Can we order prints and albums?',
    a: 'Absolutely. Archival pigment prints, silver-gelatin darkroom prints, and heirloom albums are all available through the studio.',
  },
]

export function FaqPage() {
  usePageMeta(`FAQ | ${site.name}`, 'Frequently asked questions about booking Nathalie Lopez Photography.')
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" lede="Anything else at all — write and ask." />
      <div className="mt-10 flex flex-col">
        {faqs.map((faq, i) => (
          <div key={faq.q} className="border-b border-ink/12">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-display text-xl text-ink">{faq.q}</span>
              <span
                aria-hidden="true"
                className={`text-safelight-deep transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>
            {open === i && <p className="pb-5 leading-relaxed text-ink/70">{faq.a}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
