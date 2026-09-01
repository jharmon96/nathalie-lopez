interface ApertureMarkProps {
  className?: string
  /** Set to false for static rendering (footer, favicon-sized uses). */
  animate?: boolean
}

/** The iris, stopping down. Blades draw one after another on first paint. */
export function ApertureMark({ className = 'h-9 w-9', animate = true }: ApertureMarkProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <circle
        cx="20"
        cy="20"
        r="15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        className={animate ? 'aperture-ring' : undefined}
        pathLength={1}
      />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M20 6.5 L26.5 26" pathLength={1} className={animate ? 'aperture-blade' : undefined} />
        <path d="M32.4 14.4 L12.6 20.9" pathLength={1} className={animate ? 'aperture-blade' : undefined} />
        <path d="M28.3 31.1 L13.4 16.6" pathLength={1} className={animate ? 'aperture-blade' : undefined} />
      </g>
      <circle cx="20" cy="20" r="2.6" fill="var(--color-safelight)" />
    </svg>
  )
}
