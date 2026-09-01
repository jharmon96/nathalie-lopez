import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface ButtonProps {
  to?: string
  href?: string
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'quiet'
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}

const base =
  'inline-flex items-center justify-center gap-2 px-6 py-2.5 font-medium tracking-wide transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none'

const variants = {
  primary: 'bg-ink text-paper hover:bg-safelight-deep',
  secondary: 'border border-ink/25 text-ink hover:border-safelight hover:text-safelight-deep',
  quiet: 'px-0 text-safelight-deep underline-offset-4 hover:underline',
}

export function Button({
  to,
  href,
  type = 'button',
  variant = 'primary',
  disabled,
  onClick,
  children,
  className = '',
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`
  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {children}
      </Link>
    )
  }
  if (href) {
    const external = href.startsWith('http')
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {children}
      </a>
    )
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  )
}
