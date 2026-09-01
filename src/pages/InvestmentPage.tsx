import { site } from '@/config/site'
import { useSiteContent } from '@/hooks/useSiteContent'

import { Button } from '@/components/Button'
import { SectionHeading } from '@/components/SectionHeading'
import { usePageMeta } from '@/lib/usePageMeta'

const notes = [
  {
    title: 'Prints',
    text: 'Every commission includes print-ready files. Archival pigment and true darkroom silver-gelatin prints are available through the studio — sized, matted, and signed.',
  },
  {
    title: 'Film',
    text: 'Sessions can include 35mm and 120 film alongside digital. Scans are delivered in the same gallery, labelled by stock.',
  },
  {
    title: 'Travel',
    text: 'Based in ' + site.location + ', happy to travel. Weddings beyond the region carry simple, flat-rate travel pricing.',
  },
]

export function InvestmentPage() {
  usePageMeta(`Investment | ${site.name}`, 'Portrait sittings, wedding coverage, and editorial commissions — sessions and rates.')
  const { sessions } = useSiteContent()

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        eyebrow="Investment"
        title="Sessions and rates"
        lede="Straightforward pricing, no packages padded with things you don't need. Every booking begins with a conversation."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {sessions.map((session) => (
          <div
            key={session.name}
            className={`flex flex-col gap-4 border p-7 ${
              session.featured ? 'border-safelight/60 bg-mat/60' : 'border-ink/12 bg-paper'
            }`}
          >
            <div className="flex flex-col gap-1">
              {session.featured && <span className="eyebrow text-safelight-deep">Most booked</span>}
              <h3 className="font-display text-2xl text-ink">{session.name}</h3>
              <span className="exif text-silver">{session.price}</span>
            </div>
            <p className="text-sm leading-relaxed text-ink/70">{session.blurb}</p>
            <ul className="mt-2 flex flex-col gap-2 text-sm text-ink/75">
              {session.includes.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="h-1 w-1 rounded-full bg-safelight" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-4">
              <Button to="/contact" variant={session.featured ? 'primary' : 'secondary'} className="w-full">
                Enquire
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        {notes.map((note) => (
          <div key={note.title} className="flex flex-col gap-2 border-t-2 border-ink/15 pt-4">
            <h3 className="font-display text-xl text-ink">{note.title}</h3>
            <p className="text-sm leading-relaxed text-ink/70">{note.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-start gap-4 border border-ink/12 bg-darkroom px-8 py-10 sm:items-center sm:text-center">
        <h2 className="font-display text-3xl text-paper">Not sure which fits?</h2>
        <p className="max-w-xl leading-relaxed text-paper/70">
          Write to me anyway. If a half-hour portrait sitting is the honest answer, that's what
          I'll say.
        </p>
        <Button to="/contact">Start the conversation</Button>
      </div>
    </div>
  )
}
