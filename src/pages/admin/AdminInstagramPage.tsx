import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { instagramApi } from '@/lib/adminApi'
import { site } from '@/config/site'

import { EmptyNote, Field, inputClasses, Panel } from './ui'

interface Post {
  id: number
  url: string
  image_url: string
  caption: string | null
  synced: boolean
}

interface ConnectionStatus {
  app_configured: boolean
  connected: boolean
  token_updated_at: string | null
}

export function AdminInstagramPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const params = new URLSearchParams(window.location.search)

  async function load() {
    const [postResult, statusResult] = await Promise.all([instagramApi.list(), instagramApi.status()])
    setPosts(postResult.posts)
    setStatus(statusResult)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await instagramApi.create({ url, image_url: imageUrl, caption: null })
      setUrl('')
      setImageUrl('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Instagram</h1>
        <p className="mt-1 text-sm text-ink/60">
          Posts shown in the strip at the bottom of the home page. With an Instagram token
          configured this list syncs itself; without one, pin posts manually here.
        </p>
      </div>

      <Panel title="Connection">
        {params.get('connected') === '1' && (
          <p className="mb-3 text-sm text-ink/75">
            Connected — your recent posts have been pulled into the feed below.
          </p>
        )}
        {params.get('error') && (
          <p className="mb-3 text-sm text-safelight-deep">
            The connection did not complete ({params.get('error')}). Try again, or write to the studio.
          </p>
        )}
        {status?.connected ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink/75">
              Connected to <span className="font-medium">@{site.instagram}</span>
              {status.token_updated_at && (
                <span className="exif text-silver"> · token refreshed {status.token_updated_at.slice(0, 10)}</span>
              )}
            </p>
            <p className="text-sm text-ink/55">
              The feed refreshes itself; use the button below to pull again right away.
            </p>
          </div>
        ) : status?.app_configured ? (
          <p className="text-sm text-ink/70">
            Not connected yet — start the authorization to display your recent posts automatically.
          </p>
        ) : (
          <p className="text-sm text-ink/70">
            Instagram is not connected yet. Pin posts manually below, or ask the studio to
            finish the connection setup.
          </p>
        )}
        {status?.app_configured && !status.connected && (
          <>
            <div className="mb-3 border-l-2 border-safelight/50 pl-4 text-sm leading-relaxed text-ink/65">
              <p className="font-medium text-ink/80">Connect your Instagram account</p>
              <p className="mt-1">
                By continuing, you authorize this website to access your Instagram username, basic
                professional profile information and published media for the purpose of displaying
                and synchronizing your Instagram feed. This connection does not provide access to
                your Instagram password, private messages, advertising or payment information, or
                permission to publish, edit or delete content.
              </p>
              <p className="mt-1">
                The website stores a revocable Instagram access credential — encrypted — to perform
                future synchronizations. You may revoke access at any time through Instagram's
                connected-app settings. See the website's <Link to="/privacy" className="underline">privacy policy</Link> for
                storage, retention and deletion details.
              </p>
            </div>
            <a
              href="/api/v1/admin/instagram/authorize"
              className="mt-1 inline-flex self-start bg-ink px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-safelight-deep"
            >
              Connect Instagram
            </a>
          </>
        )}
      </Panel>

      <Panel title="Pin a post manually">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Post URL">
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClasses}
              placeholder={`https://instagram.com/p/…`}
            />
          </Field>
          <Field label="Image URL">
            <input required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputClasses} />
          </Field>
          {error && <p className="text-sm text-safelight-deep">{error}</p>}
          <button type="submit" className="self-start bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-safelight-deep">
            Pin post
          </button>
        </form>
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-ink/50">{posts.length} posts</h2>
        {posts.length === 0 ? (
          <EmptyNote>Feed is empty — the home page shows studio photographs instead.</EmptyNote>
        ) : (
          <div className="flex flex-wrap gap-4">
            {posts.map((p) => (
              <div key={p.id} className="relative">
                <img src={p.image_url} alt={p.caption ?? ''} className="h-24 w-24 border border-ink/10 object-cover" />
                {p.synced && (
                  <span className="absolute bottom-1 left-1 bg-darkroom/80 px-1 exif text-paper" title="Synced from Instagram">
                    IG
                  </span>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await instagramApi.remove(p.id).catch(() => undefined)
                    await load()
                  }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center border border-ink/25 bg-paper text-xs text-ink/60 hover:text-safelight-deep"
                  aria-label="Remove post"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="exif text-silver">
          Feed link for visitors: {site.url} · @{site.instagram}
        </p>
      </section>
    </div>
  )
}
