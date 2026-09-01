import type { ReactNode } from 'react'

/** Shared form chrome for the admin section. */
export const inputClasses =
  'w-full border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-safelight focus:outline-none'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="eyebrow text-ink/50">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink/45">{hint}</span>}
    </label>
  )
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-ink/12 bg-mat/40 p-6">
      <h3 className="eyebrow mb-4 text-safelight-deep">{title}</h3>
      {children}
    </section>
  )
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-sm italic text-ink/45">{children}</p>
}

export function money(cents: number): string {
  return `£${(cents / 100).toFixed(2)}`
}
