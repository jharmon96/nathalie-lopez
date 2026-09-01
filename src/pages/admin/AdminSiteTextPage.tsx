import { useEffect, useState } from 'react'

import { site } from '@/config/site'
import { siteTextApi } from '@/lib/adminApi'

import { Field, inputClasses, Panel } from './ui'

/**
 * Editable page copy, keyed to the SiteText store. Anything left blank falls
 * back to the built-in default on the public page, so a field only has to be
 * filled in when Nathalie wants different wording.
 */
const FIELDS: { key: string; label: string; fallback: string; multiline?: boolean; hint?: string }[] = [
  {
    key: 'invest_lede',
    label: 'Investment page — intro line',
    fallback: "Straightforward pricing, no packages padded with things you don't need. Every booking begins with a conversation.",
    multiline: true,
  },
  { key: 'invest_note_prints_title', label: 'Prints — heading', fallback: 'Prints' },
  {
    key: 'invest_note_prints_text',
    label: 'Prints — text',
    fallback:
      'Every commission includes print-ready files. Archival pigment and true darkroom silver-gelatin prints are available through the studio — sized, matted, and signed.',
    multiline: true,
  },
  { key: 'invest_note_film_title', label: 'Film — heading', fallback: 'Film' },
  {
    key: 'invest_note_film_text',
    label: 'Film — text',
    fallback: 'Sessions can include 35mm and 120 film alongside digital. Scans are delivered in the same gallery, labelled by stock.',
    multiline: true,
  },
  {
    key: 'invest_note_travel_title',
    label: 'Travel — heading',
    fallback: 'Travel',
  },
  {
    key: 'invest_note_travel_text',
    label: 'Travel — text',
    fallback: `Based in ${site.location}, happy to travel. Weddings beyond the region carry simple, flat-rate travel pricing.`,
    multiline: true,
    hint: `Default mentions "${site.location}".`,
  },
  { key: 'invest_cta_title', label: 'Bottom banner — heading', fallback: 'Not sure which fits?' },
  {
    key: 'invest_cta_text',
    label: 'Bottom banner — text',
    fallback: "Write to me anyway. If a half-hour portrait sitting is the honest answer, that's what I'll say.",
    multiline: true,
  },
]

export function AdminSiteTextPage() {
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    siteTextApi
      .get()
      .then(({ values }) => {
        // Prefill each field with the stored value, else its default, so the
        // form always shows the wording the site currently displays.
        const merged: Record<string, string> = {}
        for (const f of FIELDS) merged[f.key] = values[f.key] ?? f.fallback
        setDraft(merged)
        setLoaded(true)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load page text'))
  }, [])

  async function save() {
    setStatus('saving')
    setErrorMessage(null)
    try {
      // Send every managed key: an empty value clears the stored wording so
      // the page falls back to its built-in default.
      const values: Record<string, string> = {}
      for (const f of FIELDS) values[f.key] = (draft[f.key] ?? '').trim()
      await siteTextApi.put(values)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Could not save')
    }
  }

  function set(key: string, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Page text</h1>
        <p className="mt-1 text-sm text-ink/60">
          Wording on the Investment page — the intro line, the Prints / Film / Travel notes, and the
          banner at the bottom. Clear a field to restore the original wording.
        </p>
      </div>

      {error && <p className="text-sm text-safelight-deep">{error}</p>}
      {!loaded && !error && <p className="text-sm text-ink/50">Loading…</p>}

      {loaded && (
        <>
          <Panel title="Investment page">
            <div className="grid gap-5">
              {FIELDS.map((f) => (
                <Field key={f.key} label={f.label} hint={f.hint}>
                  {f.multiline ? (
                    <textarea
                      rows={2}
                      value={draft[f.key] ?? ''}
                      onChange={(e) => set(f.key, e.target.value)}
                      className={inputClasses}
                    />
                  ) : (
                    <input value={draft[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} className={inputClasses} />
                  )}
                </Field>
              ))}
            </div>
          </Panel>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={save}
              className="self-start bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-safelight-deep"
            >
              Save changes
            </button>
            {status === 'saving' && <span className="exif text-safelight-deep">saving…</span>}
            {status === 'saved' && <span className="exif text-safelight-deep">saved ✓</span>}
            {status === 'error' && <span className="exif text-safelight-deep">error: {errorMessage}</span>}
          </div>
        </>
      )}
    </div>
  )
}
