import { site } from '@/config/site'

import { usePageMeta } from '@/lib/usePageMeta'

const sections = [
  {
    heading: 'Purpose',
    body: [
      'Instagram data is accessed solely to synchronize and display the studio\'s Instagram feed on this website. Nothing is collected for advertising, profiling, or resale.',
    ],
  },
  {
    heading: 'Data collected',
    body: [
      'When the feed is connected, this website stores the Instagram account identifier, post captions, media types, media and thumbnail URLs, links to the original posts, and publication timestamps.',
    ],
  },
  {
    heading: 'Data not collected',
    body: [
      'Instagram passwords, private messages, advertising or payment information, and follower identities are never requested or stored. The website cannot publish, edit, or delete Instagram content.',
    ],
  },
  {
    heading: 'Storage',
    body: [
      'Feed data and media URLs are stored in the studio\'s private database. Photographs are not copied into long-term storage — the strip links to the media URLs Instagram publishes.',
    ],
  },
  {
    heading: 'Access credential',
    body: [
      'Connecting the feed stores a revocable OAuth access credential, encrypted at rest, so synchronization can continue without repeated sign-ins. Your Instagram password is never received or stored.',
    ],
  },
  {
    heading: 'Sharing',
    body: [
      'Instagram data is not sold or shared for advertising. It is processed only by this website and its hosting infrastructure on behalf of the studio.',
    ],
  },
  {
    heading: 'Retention & deletion',
    body: [
      'Imported posts and the access credential remain until the connection is revoked or deletion is requested. To have the credential and all imported Instagram data deleted immediately, contact the studio.',
    ],
  },
  {
    heading: 'Revocation',
    body: [
      'Access can be revoked at any time through Instagram\'s connected-app settings (Settings → Website permissions → Apps and websites), or by contacting the studio. Revocation stops future synchronization; previously imported posts may remain displayed until removed.',
    ],
  },
  {
    heading: 'Public display',
    body: [
      'Synchronized posts will be displayed publicly on this website, exactly as they appear on the connected Instagram profile.',
    ],
  },
]

export function PrivacyPage() {
  usePageMeta(`Privacy | ${site.name}`, 'How this website handles Instagram data and credentials.')

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl text-ink">Privacy policy</h1>
      <p className="mt-3 text-sm text-ink/60">Last updated: September 2026</p>
      <div className="mt-10 flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-2xl text-ink">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-2 leading-relaxed text-ink/75">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        <section>
          <h2 className="font-display text-2xl text-ink">Contact</h2>
          <p className="mt-2 leading-relaxed text-ink/75">
            Questions about this policy or requests to delete stored Instagram data: {site.email}.
          </p>
        </section>
      </div>
    </div>
  )
}
