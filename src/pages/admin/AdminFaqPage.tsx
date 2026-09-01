import { useEffect, useState, type FormEvent } from 'react'

import { faqsApi } from '@/lib/adminApi'

import { EmptyNote, Field, inputClasses, Panel } from './ui'

interface Faq {
  id: number
  question: string
  answer: string
  sort_order: number
}

export function AdminFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setFaqs((await faqsApi.list()).faqs)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await faqsApi.create({ question, answer, sort_order: faqs.length })
      setQuestion('')
      setAnswer('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">FAQ</h1>
        <p className="mt-1 text-sm text-ink/60">Questions shown on the FAQ page, in order.</p>
      </div>

      <Panel title="Add a question">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Question">
            <input required value={question} onChange={(e) => setQuestion(e.target.value)} className={inputClasses} />
          </Field>
          <Field label="Answer">
            <textarea required rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} className={inputClasses} />
          </Field>
          {error && <p className="text-sm text-safelight-deep">{error}</p>}
          <button type="submit" className="self-start bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-safelight-deep">
            Add question
          </button>
        </form>
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-ink/50">{faqs.length} questions</h2>
        {faqs.length === 0 ? (
          <EmptyNote>No questions yet.</EmptyNote>
        ) : (
          faqs.map((f) => (
            <div key={f.id} className="border border-ink/12 bg-mat/40 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-lg text-ink">{f.question}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await faqsApi.remove(f.id).catch(() => undefined)
                    await load()
                  }}
                  className="text-xs text-ink/45 hover:text-safelight-deep"
                >
                  Delete
                </button>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">{f.answer}</p>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
