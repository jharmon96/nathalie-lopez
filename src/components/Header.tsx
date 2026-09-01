import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { site } from '@/config/site'

import { FacebookIcon, InstagramIcon } from './SocialIcons'

const links = [
  { to: '/about', label: 'About' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/investment', label: 'Investment' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-paper/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 pt-4 pb-3">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4 pt-2">
            <a
              href={`https://instagram.com/${site.instagram}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-ink/70 transition-colors hover:text-safelight-deep"
            >
              <InstagramIcon />
            </a>
            {site.facebook && (
              <a
                href={site.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="text-ink/70 transition-colors hover:text-safelight-deep"
              >
                <FacebookIcon />
              </a>
            )}
          </div>

          <Link to="/" className="flex flex-col items-center leading-none" onClick={() => setMenuOpen(false)}>
            <span className="wordmark text-3xl text-ink sm:text-4xl">{site.fullName}</span>
          </Link>

          <div className="w-10" aria-hidden="true" />
        </div>

        <nav aria-label="Main" className="mt-3 hidden items-center justify-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `eyebrow transition-colors hover:text-safelight-deep ${isActive ? 'text-safelight-deep' : 'text-ink/70'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-2 flex justify-center md:hidden">
          <button
            type="button"
            className="p-2 text-ink"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {menuOpen ? <path d="M 5 5 L 19 19 M 19 5 L 5 19" /> : <path d="M 3 7 H 21 M 3 12 H 21 M 3 17 H 21" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav aria-label="Main mobile" className="mt-3 border-t border-ink/10 pt-4 md:hidden">
            <ul className="flex flex-col gap-4 text-center">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="eyebrow block text-ink/80 hover:text-safelight-deep"
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
}
