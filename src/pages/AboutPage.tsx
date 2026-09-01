import { photos } from '@/config/content'
import { site } from '@/config/site'

import { PhotoFrame } from '@/components/PhotoFrame'
import { SectionHeading } from '@/components/SectionHeading'
import { usePageMeta } from '@/lib/usePageMeta'

const process = [
  { step: '01', title: 'The conversation', text: 'A call or a coffee before anything is booked. What are the pictures for? Who are they of? What will they hang next to?' },
  { step: '02', title: 'The shoot', text: 'Unhurried. Most sessions run long because the best frame rarely arrives first. Film alongside digital where it earns its place.' },
  { step: '03', title: 'The develop', text: 'Culled, printed, and proofed by hand. You see a tight edit, not everything — my job is to choose well.' },
  { step: '04', title: 'The delivery', text: 'A private gallery, print-ready files, and archival prints through the studio if you want paper you can hold.' },
]

export function AboutPage() {
  usePageMeta(`About | ${site.name}`, 'Nathalie Lopez is a photographer working in portraiture, weddings, and editorial assignments.')

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid items-start gap-12 lg:grid-cols-5">
        <PhotoFrame
          photo={{
            src: '/photos/nathalie-lopez-portrait.jpg',
            alt: 'Nathalie in the garden with her camera, mid-laugh',
            caption: 'Self-portrait, against the garden light',
            exif: 'f/2 · 1/250 · ISO 400 · 35mm',
            category: 'portrait',
            tones: ['#d3c3ab', '#4a3f33'],
            aspect: '4/5',
          }}
          className="lg:col-span-2"
        />
        <div className="flex flex-col gap-5 lg:col-span-3">
          <SectionHeading
            eyebrow="About"
            title="I photograph people when they forget I'm there."
          />
          <p className="text-lg leading-relaxed text-ink/75">
            I've been making photographs for over a decade — first in a community darkroom, then
            assisting editorial shooters, and now from my own studio in {site.location}. The darkroom
            never left me: I still believe a photograph is developed, not taken.
          </p>
          <p className="text-lg leading-relaxed text-ink/75">
            My commissions live between portraiture and documentary. Weddings, for me, are the
            purest form of both — a day you can't repeat, photographed honestly. Editorial
            assignments keep me curious: makers, kitchens, workshops, anyone at work with their
            hands.
          </p>
          <p className="text-lg leading-relaxed text-ink/75">
            When I'm not shooting I print for other photographers, teach a small darkroom class,
            and keep a stubborn, beloved M6 loaded with Portra.
          </p>
        </div>
      </div>

      <div className="mt-20">
        <SectionHeading eyebrow="Process" title="How a commission runs" />
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {process.map((stage) => (
            <li key={stage.step} className="flex flex-col gap-2 border-t-2 border-ink/15 pt-4">
              <span className="exif text-safelight-deep">{stage.step}</span>
              <h3 className="font-display text-xl text-ink">{stage.title}</h3>
              <p className="text-sm leading-relaxed text-ink/70">{stage.text}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-20">
        <SectionHeading eyebrow="Recent frames" title="From the last few months" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.slice(2, 5).map((photo, i) => (
            <PhotoFrame key={photo.caption} photo={photo} delay={i * 200} />
          ))}
        </div>
      </div>
    </div>
  )
}
