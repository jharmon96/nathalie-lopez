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
  config/       site.ts (contact/urls), content.ts (photos, sessions)
  lib/          usePageMeta, adminApi (typed API client)
  pages/        Home, Portfolio, Investment, FAQ, About, Contact,
                NotFound, Privacy, CustomerGallery
  pages/admin/  Login, Layout, CRM, Invoices, Galleries, Reviews,
                Carousel, Instagram
backend/
  app/          FastAPI app: config, db, models, security, routers
```

Photographs: `PhotoFrame` renders a darkroom placeholder (tone wash + film
grain) until a real `src` is set on each photo in `src/config/content.ts`.

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

Build & ship (bump tags in `deploy/kaniko-*.json` and `values.yaml`):

```sh
# in-cluster builds
tar -czf - --exclude=./node_modules --exclude=./dist . | \
  kubectl run kaniko --rm -i --restart=Never \
  --image=gcr.io/kaniko-project/executor:latest -n nathalie-lopez \
  --overrides="$(cat deploy/kaniko-fe.json)"

tar -czf - --exclude=./node_modules --exclude=./dist . | \
  kubectl run kaniko-be --rm -i --restart=Never \
  --image=gcr.io/kaniko-project/executor:latest -n nathalie-lopez \
  --overrides="$(cat deploy/kaniko-be.json)"

helm upgrade nathalie-lopez charts/nathalie-lopez -n nathalie-lopez
```

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

The home-page strip polls `/api/v1/public/instagram`. Two sources:

1. **OAuth** — a Meta app ("Instagram API with Instagram Login") with the
   redirect URI `https://nathalie.lopez.clan.global/api/v1/admin/instagram/callback`.
   App ID goes in `values.yaml` (`backend.instagramAppId`); the App Secret in
   the `nathalie-lopez-instagram` secret. Nathalie clicks **Connect
   Instagram** in `/admin`, approves on Instagram, and the long-lived token is
   stored AES-GCM encrypted in the database.
2. **Manual pinning** — paste post URLs in the admin Instagram tab.

Contact details live in `src/config/site.ts`. The contact form composes a
mailto: enquiry — wire it to an API endpoint when a backend exists.
