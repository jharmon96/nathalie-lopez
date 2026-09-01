import { Link } from 'react-router-dom'

import { site } from '@/config/site'

import { ApertureMark } from './ApertureMark'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-ink/10 bg-mat/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <div className="flex items-center gap-3">
            <ApertureMark className="h-8 w-8 text-ink" animate={false} />
            <span className="wordmark text-2xl text-ink">{site.name}</span>
          </div>
          <div className="rule mt-4 w-40" />
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            {site.slogan}. Working from {site.location} and wherever the light is good.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-12 text-sm">
          <div className="flex flex-col gap-2.5">
            <span className="eyebrow text-ink/45">Site</span>
            <Link to="/portfolio" className="text-ink/70 hover:text-safelight-deep">
              Portfolio
            </Link>
            <Link to="/investment" className="text-ink/70 hover:text-safelight-deep">
              Investment
            </Link>
            <Link to="/about" className="text-ink/70 hover:text-safelight-deep">
              About
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="eyebrow text-ink/45">Reach</span>
            <a
              href={`https://instagram.com/${site.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="text-ink/70 hover:text-safelight-deep"
            >
              @{site.instagram}
            </a>
            <a href={`mailto:${site.email}`} className="text-ink/70 hover:text-safelight-deep">
              Email
            </a>
            <span className="text-ink/45">{site.location}</span>
          </div>
        </nav>
      </div>
      <div className="border-t border-ink/10 py-5 text-center">
        <span className="eyebrow text-ink/40">
          © {year} {site.fullName} ·{' '}
          <Link to="/privacy" className="hover:text-safelight-deep">
            Privacy
          </Link>
        </span>
      </div>
    </footer>
  )
}
