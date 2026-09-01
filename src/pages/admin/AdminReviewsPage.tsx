import { useEffect, useState, type FormEvent } from 'react'

import { reviewsApi, type AdminReview } from '@/lib/adminApi'

import { EmptyNote, Field, inputClasses, Panel } from './ui'

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [author, setAuthor] = useState('')
  const [quote, setQuote] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setReviews((await reviewsApi.list()).reviews)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await reviewsApi.create({ author, quote, source: source || null, sort_order: reviews.length })
      setAuthor('')
      setQuote('')
      setSource('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Reviews</h1>
        <p className="mt-1 text-sm text-ink/60">Shown in the home-page carousel, in order.</p>
      </div>

      <Panel title="Add a review">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author">
              <input required value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClasses} />
            </Field>
            <Field label="Source (optional)">
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={inputClasses}
                placeholder="Google, The Knot…"
              />
            </Field>
          </div>
          <Field label="Quote">
            <textarea required rows={3} value={quote} onChange={(e) => setQuote(e.target.value)} className={inputClasses} />
          </Field>
          {error && <p className="text-sm text-safelight-deep">{error}</p>}
          <button type="submit" className="self-start bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-safelight-deep">
            Add review
          </button>
        </form>
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-ink/50">{reviews.length} reviews</h2>
        {reviews.length === 0 ? (
          <EmptyNote>No reviews yet.</EmptyNote>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="border border-ink/12 bg-mat/40 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium text-ink">{r.author}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await reviewsApi.remove(r.id).catch(() => undefined)
                    await load()
                  }}
                  className="text-xs text-ink/45 hover:text-safelight-deep"
                >
                  Delete
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">“{r.quote}”</p>
              {r.source && <p className="exif mt-1 text-silver">{r.source}</p>}
            </div>
          ))
        )}
      </section>
    </div>
  )
}
