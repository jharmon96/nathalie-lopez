import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scroll-reveal: elements marked `data-reveal` start shifted down and faded,
 * then ease into place the first time they enter the viewport. Re-runs on
 * route changes; honours prefers-reduced-motion (elements render revealed).
 */
export function useScrollReveal(deps: unknown[] = []) {
  const location = useLocation()

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.setAttribute('data-reveal-visible', 'true'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-reveal-visible', 'true')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    elements.forEach((el) => {
      // Elements already revealed keep their state across route changes
      if (!el.hasAttribute('data-reveal-visible')) observer.observe(el)
    })

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, ...deps])
}
