import { site } from '@/config/site'

import { Button } from '@/components/Button'
import { usePageMeta } from '@/lib/usePageMeta'

export function NotFoundPage() {
  usePageMeta(`Not found | ${site.name}`)

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-32">
      <p className="exif text-safelight-deep">Frame 00 — unexposed</p>
      <h1 className="font-display text-5xl text-ink">This page never developed.</h1>
      <p className="max-w-md text-lg leading-relaxed text-ink/70">
        The negative came back blank. Try the portfolio instead — everything good is there.
      </p>
      <div className="flex gap-4">
        <Button to="/portfolio">View the portfolio</Button>
        <Button to="/" variant="secondary">
          Back home
        </Button>
      </div>
    </div>
  )
}
