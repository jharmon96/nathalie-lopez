import { useState } from 'react'

import { SectionHeading } from '@/components/SectionHeading'
import { faqs as fallbackFaqs } from '@/config/content'
import { site } from '@/config/site'
import { type FaqData } from '@/lib/adminApi'
import { usePageMeta } from '@/lib/usePageMeta'
import { useSiteContent } from '@/hooks/useSiteContent'

export function FaqPage() {
  usePageMeta(`FAQ | ${site.name}`, 'Frequently asked questions about booking Nathalie Lopez Photography.')
  const [open, setOpen] = useState<number | null>(0)
  const siteContent = useSiteContent()
  const faqs = siteContent.faqs.length > 0 ? siteContent.faqs : fallbackFaqs

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" lede="Anything else at all — write and ask." />
      <div className="mt-10 flex flex-col">
        {faqs.map((faq: FaqData, i) => (
          <div key={`${faq.question}-${i}`} className="border-b border-ink/12">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-display text-xl text-ink">{faq.question}</span>
              <span
                aria-hidden="true"
                className={`text-safelight-deep transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>
            {open === i && <p className="pb-5 leading-relaxed text-ink/70">{faq.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
