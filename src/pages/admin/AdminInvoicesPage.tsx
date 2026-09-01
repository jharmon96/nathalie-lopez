import { useEffect, useState, type FormEvent } from 'react'

import { customersApi, invoicesApi, type Invoice } from '@/lib/adminApi'

import { EmptyNote, Field, inputClasses, money, Panel } from './ui'

const statusStyles: Record<Invoice['status'], string> = {
  draft: 'border-ink/25 text-ink/60',
  sent: 'border-safelight/60 text-safelight-deep',
  paid: 'border-transparent bg-ink text-paper',
  void: 'border-ink/15 text-ink/35 line-through',
}

export function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<customerOption[]>([])
  const [number, setNumber] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [status, setStatus] = useState<Invoice['status']>('draft')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const [invoiceResult, customerResult] = await Promise.all([invoicesApi.list(), customersApi.list()])
    setInvoices(invoiceResult.invoices)
    setCustomers(customerResult.customers.map((c) => ({ id: c.id, name: c.name })))
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const amount_cents = Math.round(parseFloat(amount) * 100)
    if (Number.isNaN(amount_cents)) {
      setError('Amount must be a number')
      return
    }
    try {
      await invoicesApi.create({
        customer_id: customerId ? Number(customerId) : null,
        number,
        amount_cents,
        status,
        issued_at: new Date().toISOString().slice(0, 10),
        due_at: dueAt || null,
        notes: null,
      })
      setNumber('')
      setAmount('')
      setDueAt('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  async function setStatusOn(invoice: Invoice, newStatus: Invoice['status']) {
    await invoicesApi
      .update(invoice.id, {
        customer_id: invoice.customer_id,
        number: invoice.number,
        amount_cents: invoice.amount_cents,
        status: newStatus,
        issued_at: invoice.issued_at,
        due_at: invoice.due_at,
        notes: invoice.notes,
      })
      .catch(() => undefined)
    await load()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this invoice?')) return
    await invoicesApi.remove(id).catch(() => undefined)
    await load()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Invoices</h1>
        <p className="mt-1 text-sm text-ink/60">Draft, send, and settle — one row per commission.</p>
      </div>

      <Panel title="New invoice">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-4">
          <Field label="Number">
            <input
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className={inputClasses}
              placeholder="NL-2026-001"
            />
          </Field>
          <Field label="Customer">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClasses}>
              <option value="">— none —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (£)">
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClasses}
              placeholder="350.00"
            />
          </Field>
          <Field label="Due">
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={inputClasses} />
          </Field>
          <div className="sm:col-span-3">
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as Invoice['status'])} className={inputClasses}>
                <option value="draft">draft</option>
                <option value="sent">sent</option>
                <option value="paid">paid</option>
              </select>
            </Field>
          </div>
          {error && <p className="text-sm text-safelight-deep sm:col-span-4">{error}</p>}
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-safelight-deep"
            >
              Create invoice
            </button>
          </div>
        </form>
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-ink/50">{invoices.length} invoices</h2>
        {invoices.length === 0 ? (
          <EmptyNote>Nothing invoiced yet.</EmptyNote>
        ) : (
          <div className="overflow-x-auto border border-ink/12">
            <table className="w-full text-left text-sm">
              <thead className="bg-mat/70 text-ink/60">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Number</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Due</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-ink/10">
                    <td className="px-4 py-2.5 font-mono text-xs text-ink">{inv.number}</td>
                    <td className="px-4 py-2.5 text-ink/70">
                      {customers.find((c) => c.id === inv.customer_id)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">{money(inv.amount_cents)}</td>
                    <td className="px-4 py-2.5 text-ink/70">{inv.due_at ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block border px-2 py-0.5 text-xs ${statusStyles[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      {inv.status !== 'sent' && inv.status !== 'paid' && (
                        <button type="button" onClick={() => setStatusOn(inv, 'sent')} className="mr-3 text-xs text-ink/45 hover:text-safelight-deep">
                          mark sent
                        </button>
                      )}
                      {inv.status !== 'paid' && (
                        <button type="button" onClick={() => setStatusOn(inv, 'paid')} className="mr-3 text-xs text-ink/45 hover:text-safelight-deep">
                          mark paid
                        </button>
                      )}
                      <button type="button" onClick={() => handleDelete(inv.id)} className="text-xs text-ink/45 hover:text-safelight-deep">
                        delete
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

interface customerOption {
  id: number
  name: string
}
