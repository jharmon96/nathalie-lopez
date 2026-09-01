import { useState, type FormEvent } from 'react'

import { sessions } from '@/config/content'
import { site } from '@/config/site'

import { Button } from './Button'

const inputClasses =
  'w-full border border-ink/20 bg-paper px-4 py-2.5 text-ink placeholder:text-ink/35 focus:border-safelight focus:outline-none'

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [session, setSession] = useState(sessions[0].name)
  const [when, setWhen] = useState('')
  const [message, setMessage] = useState('')

  // Static site, no backend: the enquiry is composed into the visitor's mail
  // client. PLACEHOLDER: point at an API endpoint when one exists.
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const subject = `Enquiry — ${session}${when ? `, ${when}` : ''}`
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Session: ${session}`,
      when ? `Preferred date: ${when}` : null,
      '',
      message,
    ]
      .filter((line) => line !== null)
      .join('\n')
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow text-ink/55">Name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClasses}
            placeholder="Your name"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow text-ink/55">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClasses}
            placeholder="you@example.com"
          />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow text-ink/55">Session</span>
          <select value={session} onChange={(event) => setSession(event.target.value)} className={inputClasses}>
            {sessions.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
            <option value="Something else">Something else</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow text-ink/55">Preferred date</span>
          <input type="date" value={when} onChange={(event) => setWhen(event.target.value)} className={inputClasses} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="eyebrow text-ink/55">Tell me about it</span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={inputClasses}
          placeholder="The people, the place, the plan — anything at all."
        />
      </label>
      <div className="flex items-center gap-4">
        <Button type="submit">Send enquiry</Button>
        <span className="text-sm text-ink/50">Opens your mail client, addressed to {site.email}</span>
      </div>
    </form>
  )
}
