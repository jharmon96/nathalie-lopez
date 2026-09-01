import type { ReactNode } from 'react'

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
}: {
  eyebrow?: string
  title: string
  lede?: ReactNode
  align?: 'left' | 'center'
}) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left'
  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow && <span className="eyebrow text-safelight-deep">{eyebrow}</span>}
      <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl">{title}</h2>
      {lede && <p className="max-w-2xl text-lg leading-relaxed text-ink/70">{lede}</p>}
    </div>
  )
}
