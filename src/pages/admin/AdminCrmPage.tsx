import { useEffect, useState, type FormEvent } from 'react'

import { customersApi, type Customer } from '@/lib/adminApi'

import { EmptyNote, Field, inputClasses, Panel } from './ui'

export function AdminCrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setCustomers((await customersApi.list()).customers)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await customersApi.create({
        name,
        email: email || null,
        phone: phone || null,
        source: source || null,
        notes: notes || null,
      })
      setName('')
      setEmail('')
      setPhone('')
      setSource('')
      setNotes('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Remove this customer?')) return
    await customersApi.remove(id).catch(() => undefined)
    await load()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">CRM</h1>
        <p className="mt-1 text-sm text-ink/60">Everyone the studio has photographed — or will.</p>
      </div>

      <Panel title="Add a customer">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} />
          </Field>
          <Field label="Source">
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={inputClasses}
              placeholder="Instagram, referral, enquiry form…"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClasses} />
            </Field>
          </div>
          {error && <p className="text-sm text-safelight-deep sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-safelight-deep"
            >
              Add customer
            </button>
          </div>
        </form>
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-ink/50">{customers.length} customers</h2>
        {customers.length === 0 ? (
          <EmptyNote>Nobody yet — add the first client above.</EmptyNote>
        ) : (
          <div className="overflow-x-auto border border-ink/12">
            <table className="w-full text-left text-sm">
              <thead className="bg-mat/70 text-ink/60">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Source</th>
                  <th className="px-4 py-2.5 font-medium">Notes</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-ink/10">
                    <td className="px-4 py-2.5 font-medium text-ink">{c.name}</td>
                    <td className="px-4 py-2.5 text-ink/70">{c.email ?? '—'}</td>
                    <td className="px-4 py-2.5 text-ink/70">{c.source ?? '—'}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-ink/50">{c.notes ?? ''}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="text-xs text-ink/45 hover:text-safelight-deep"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
