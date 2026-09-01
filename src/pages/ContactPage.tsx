import { site } from '@/config/site'

import { ContactForm } from '@/components/ContactForm'
import { SectionHeading } from '@/components/SectionHeading'
import { usePageMeta } from '@/lib/usePageMeta'

export function ContactPage() {
  usePageMeta(`Contact | ${site.name}`, 'Enquire about portrait sittings, wedding coverage, or editorial commissions.')

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid items-start gap-12 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionHeading
            eyebrow="Contact"
            title="Tell me what you're planning."
            lede="The more you share — the people, the place, the mood — the better the first reply."
          />
          <div className="flex flex-col gap-2.5 text-sm">
            <span className="eyebrow text-ink/45">Studio</span>
            <a href={`mailto:${site.email}`} className="text-ink/75 hover:text-safelight-deep">
              {site.email}
            </a>
            <span className="text-ink/45">{site.location}</span>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <span className="eyebrow text-ink/45">Elsewhere</span>
            <a
              href={`https://instagram.com/${site.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="text-ink/75 hover:text-safelight-deep"
            >
              @{site.instagram}
            </a>
          </div>
          <p className="border-l-2 border-safelight/50 pl-4 text-sm leading-relaxed text-ink/60">
            Weddings book 6–12 months out; portraits usually 2–4 weeks. If your date is sooner,
            write anyway — there are sometimes cancellations.
          </p>
        </div>

        <div className="border border-ink/12 bg-mat/40 p-8 lg:col-span-3">
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
