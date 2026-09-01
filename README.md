# Nathalie Lopez Photography

Portfolio site and studio admin for Nathalie Lopez — portraiture, weddings,
and editorial work from West Yorkshire.

Built with the same architecture and design conventions as the sibling sites
(`groundup-structures`, `blessed-hands`, `matchtrack`):

- Vite 7 + React 19 + TypeScript
- Tailwind CSS 4 via `@tailwindcss/vite`, theme tokens in `src/index.css`
  (`@theme` with a named, commented palette)
- `react-router-dom` 7 with a single `Layout` (header/footer shell, scroll
  restoration)
- Self-hosted fonts via Fontsource (Fraunces, Karla, IBM Plex Mono)
- FastAPI + async SQLAlchemy + SQLite backend for the admin area

## Pages

- **Home** — full-width hero carousel (neighbour slides peek at the screen
  edges), tagline band, selected work, investment teaser, reviews carousel,
  and an Instagram strip that polls for new posts
- **Portfolio** — category-filtered masonry gallery
- **Investment** — session cards and rates
- **FAQ** — accordion
- **About** — bio + process timeline
- **Contact** — enquiry form (composes a mailto)

## Design language

Darkroom-inspired: fibre paper white, warm charcoal ink, mat board oat,
gelatin silver gray, and a single amber-red "safelight" accent used sparingly.

Signature details:

- Every photograph "develops" on first paint (`print-develops` keyframes),
  staggered frame by frame
- Aperture-iris logo mark whose blades stop down on load (also the favicon —
  regenerate PNGs with `python3 scripts/gen-icons.py`)
- EXIF-style mono captions under each frame
- Full `prefers-reduced-motion` fallbacks

## Structure

```
src/
  components/   HeroCarousel, ReviewsCarousel, InstagramStrip, Button,
                SectionHeading, Header, Footer, Layout, ApertureMark,
                PhotoFrame, ContactForm, SocialIcons
  components/admin/  SortableList (drag-reorder used by every admin tab)
  hooks/        useScrollReveal (IntersectionObserver on [data-reveal]),
                useSiteContent (public content fetch with module cache)
  config/       site.ts (contact/urls), content.ts (fallback photos/sessions)
  lib/          usePageMeta, adminApi (typed API client)
  pages/        Home, Portfolio, Investment, FAQ, About, Contact,
                NotFound, Privacy, CustomerGallery
  pages/admin/  Login, Layout, CRM, Invoices, Galleries, Photos, Carousel,
                Pricing, FAQ, Reviews, Instagram, SiteText
backend/
  app/          FastAPI app: config, db, models, security, seed, crypto,
                routers (health, admin_auth, customers, invoices, galleries,
                public_gallery, reviews, slides, instagram, content)
  tests/        pytest suite (in-memory SQLite via StaticPool)
e2e/            Playwright end-to-end suite
```

Photographs: `PhotoFrame` renders a darkroom placeholder (tone wash + film
grain) when `src` is empty. Real portfolio photos live in the database and are
edited in the admin; `src/config/content.ts` is only the pre-database fallback.

## Admin & API

`/admin` — password-gated studio area, backed by the FastAPI service.

| Area | What it does |
| --- | --- |
| CRM | Customers with email/phone/source/notes |
| Invoices | Draft → sent → paid/void, amounts in pence |
| Galleries | Per-customer proofing galleries with share links + optional passphrase (public viewer at `/gallery/{slug}`) |
| Photos | Portfolio photo CRUD — any public HTTPS URL (local `/photos/`, S3, CDN…), drag-reorder, inline edit |
| Carousel | Hero slides for the home page; with none, the home page falls back to recent portfolio work |
| Pricing | The tiers shown on the Investment page — prices, blurbs, what's-included bullets |
| FAQ | Questions and answers on the FAQ page |
| Reviews | Home-page testimonial carousel |
| Instagram | Manual post pinning + OAuth connection |
| Page text | Investment-page wording (intro line, Prints/Film/Travel notes, bottom banner); clearing a field restores the built-in copy |

API: cookie sessions (hashed tokens, CSRF header on writes, login
throttling), all under `/api/v1`. Health at `/api/v1/health`.

## Testing

- Backend: `cd backend && python -m pytest tests/ -q` (29 tests — auth,
  CRM, invoices, galleries, photos, slides, site text, crypto)
- End-to-end: `npm run test:e2e` — Playwright suite in `e2e/`. By default it
  targets `http://localhost:9097`; point it at a scratch backend and dev
  server with `E2E_BASE_URL` and `E2E_ADMIN_PASSWORD`.
- Live smoke check (read-only): `LIVE_ADMIN_PASSWORD=… node scripts/live-admin-check.mjs`

## Deployment

Ships like the sibling sites: multi-stage Dockerfiles (node build → nginx SPA
serve; pip → uvicorn API) and a Helm chart in `charts/nathalie-lopez/`.

- Domain: `nathalie.lopez.clan.global` (Traefik `IngressRoute`, HTTP→HTTPS)
- TLS: cert-manager `Certificate` via `letsencrypt-prod` → secret
  `nathalie-lopez-tls`
- DNS: external-dns annotation points at the fronting VPS
- Backend: SQLite on an `nfs-client` PVC mounted at `/data`
- Health endpoints: `/health` (nginx) and `/api/v1/health` (API)

Build & ship (bump `app.version`/`backend.version` in `values.yaml` and the
matching `--destination` tags in `deploy/kaniko-*.json` **and**
`deploy/kaniko-*-pod.yaml` together):

```sh
# 1. Stage the repo as a gzipped tarball on the backend pod's PVC
#    (the backend image has the same /data mount the build pod reads).
BP=$(kubectl get pod -n nathalie-lopez -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}')
tar -czf - --exclude=./node_modules --exclude=./dist . | \
  kubectl exec -i -n nathalie-lopez $BP -- sh -c 'cat > /data/context.tar.gz'

# 2. Build from the staged tarball with a pinned pod spec
kubectl delete pod kaniko -n nathalie-lopez --ignore-not-found
kubectl apply -f deploy/kaniko-fe-pod.yaml     # or kaniko-be-pod.yaml
kubectl wait --for=condition=Succeeded pod/kaniko -n nathalie-lopez --timeout=300s
kubectl logs kaniko -n nathalie-lopez | grep Pushed

# 3. Roll out (frontend and backend version bumps are independent)
helm upgrade nathalie-lopez charts/nathalie-lopez -n nathalie-lopez
kubectl rollout status deployment/nathalie-lopez-app -n nathalie-lopez
```

> **Why the PVC staging?** Piping the tarball straight into
> `kubectl run -i` (`--context=tar://stdin`) is racy: the pod name must
> exactly equal the container name `kaniko` (Kaniko's overrides merge by
> name), the tarball must be gzipped, and a slow attach corrupts stdin.
> Reading from `/data/context.tar.gz` on the PVC removes all three failure
> modes. `deploy/kaniko-fe-pod.yaml` / `kaniko-be-pod.yaml` are the pinned
> pod specs — keep their `--destination` tags in sync with `values.yaml`.

Secrets are **not** passed through Helm (values end up in release history).
Create the backend secret once, directly:

```sh
kubectl create secret generic nathalie-lopez-backend -n nathalie-lopez \
  --from-literal=admin-password='…' \
  --from-literal=session-secret='…'
# when connecting Instagram, also:
#   --from-literal=instagram-app-secret='…'
```

The chart references but never renders these values.

## Instagram connection

The home-page strip polls `/api/v1/public/instagram`. Current status:
**connected via OAuth** (Meta app "Instagram API with Instagram Login",
app ID `1110954054831809`). Note the app runs in Development mode, so the
site's account must stay on the app's tester list. Two sources feed the strip:

1. **OAuth** — the redirect URI is
   `https://nathalie.lopez.clan.global/api/v1/admin/instagram/callback`.
   App ID goes in `values.yaml` (`backend.instagramAppId`); the App Secret in
   the `nathalie-lopez-instagram` secret. Nathalie clicks **Connect
   Instagram** in `/admin`, approves on Instagram, and the long-lived token is
   stored AES-GCM encrypted in the database. Re-connect in the admin tab if
   the feed ever empties (tokens expire).
2. **Manual pinning** — paste post URLs in the admin Instagram tab.

Contact details live in `src/config/site.ts`. The contact form composes a
mailto: enquiry by design — no mail server to run or rate limit to hit.
