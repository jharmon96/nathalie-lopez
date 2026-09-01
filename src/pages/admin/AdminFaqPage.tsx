import { useEffect, useState, type FocusEvent, type FormEvent } from 'react'

import { faqsApi } from '@/lib/adminApi'

import { SortableList } from '@/components/admin/Sortable'
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

  async function handleReorder(ids: number[]) {
    await faqsApi.reorder(ids).catch(() => undefined)
    await load()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">FAQ</h1>
        <p className="mt-1 text-sm text-ink/60">
          Drag to reorder. Edits save when you click away.
        </p>
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
          <SortableList
            items={faqs}
            keyOf={(f) => f.id}
            onReorder={handleReorder}
            renderItem={(faq) => <FaqEditor faq={faq} onDeleted={load} />}
          />
        )}
      </section>
    </div>
  )
}

function FaqEditor({ faq, onDeleted }: { faq: Faq; onDeleted: () => Promise<void> }) {
  const [draft, setDraft] = useState({ question: faq.question, answer: faq.answer ?? '' })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function save() {
    if (draft.question === faq.question && draft.answer === (faq.answer ?? '')) return
    setStatus('saving')
    await faqsApi.update(faq.id, { ...draft, sort_order: faq.sort_order }).catch(() => undefined)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }

  function onBlur(e: FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) save()
  }

  return (
    <div
      className="border border-ink/12 bg-mat/40 p-5"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) save()
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <input
          value={draft.question}
          onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          onBlur={onBlur}
          className="w-full bg-transparent font-display text-lg text-ink outline-none"
          aria-label="Question"
        />
        {status !== 'idle' && <span className="exif text-safelight-deep">{status}</span>}
        <button
          type="button"
          onClick={async () => {
            await faqsApi.remove(faq.id).catch(() => undefined)
            onDeleted()
          }}
          className="text-xs text-ink/45 hover:text-safelight-deep"
        >
          Delete
        </button>
      </div>
      <textarea
        value={draft.answer}
        onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
        onBlur={onBlur}
        rows={2}
        className="mt-2 w-full bg-transparent text-sm leading-relaxed text-ink/70 outline-none"
        aria-label="Answer"
      />
    </div>
  )
}
