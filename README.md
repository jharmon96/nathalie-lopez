# Nathalie Lopez — Photography

Portfolio site for Nathalie Lopez: portraiture, weddings, and editorial work.

Built with the same architecture and design conventions as the sibling sites
(`groundup-structures`, `blessed-hands`, `matchtrack`):

- Vite 7 + React 19 + TypeScript
- Tailwind CSS 4 via `@tailwindcss/vite`, theme tokens in `src/index.css`
  (`@theme` with a named, commented palette)
- `react-router-dom` 7 with a single `Layout` (header/footer shell, scroll
  restoration)
- Self-hosted fonts via Fontsource (Fraunces, Karla, IBM Plex Mono)
- Central site config in `src/config/site.ts`; content in `src/config/content.ts`

## Design language

Darkroom-inspired: fibre-paper white, warm charcoal ink, mat-board oat, gelatin
silver gray, and a single amber-red "safelight" accent used sparingly.

Signature details:

- Every photograph "develops" on first paint (`print-develops` keyframes),
  staggered frame by frame
- Aperture-iris logo mark whose blades stop down on load
- EXIF-style mono captions under each frame
- Full `prefers-reduced-motion` fallbacks

## Structure

```
src/
  components/   Button, SectionHeading, Header, Footer, Layout,
                ApertureMark, PhotoFrame, ContactForm
  config/       site.ts (contact/url), content.ts (photos, sessions)
  lib/          usePageMeta (title/description per route)
  pages/        Home, Portfolio, Services, About, Contact, NotFound
```

Photographs: `PhotoFrame` renders a darkroom placeholder (tone wash + film
grain) until a real `src` is set on each photo in `src/config/content.ts`.

## Run

```sh
npm install
npm run dev        # http://localhost:9095
npm run build      # tsc -b && vite build → dist/
npm run preview
```

## Admin & API

`/admin` — password-gated studio area (CRM, invoices, customer galleries),
backed by a FastAPI + SQLite service (`backend/`) that persists to a PVC.

- Sign-in: `POST /api/v1/admin/login` (cookie session, CSRF header on writes,
  login throttling)
- CRM: `/api/v1/admin/customers`
- Invoices: `/api/v1/admin/invoices` (draft → sent → paid/void, amounts in
  pence)
- Galleries: `/api/v1/admin/galleries` + public viewer at
  `/gallery/{slug}` — optional per-gallery passphrase
- Set at install: `--set backend.adminPassword=… backend.sessionSecret=…`

## Deployment

Ships like the sibling sites: a multi-stage Dockerfile (node build → nginx SPA
serve) and a Helm chart in `charts/nathalie-lopez/`.

- Domain: `nathalie.lopez.clan.global` (Traefik `IngressRoute`, HTTP→HTTPS)
- TLS: cert-manager `Certificate` via `letsencrypt-prod` → secret
  `nathalie-lopez-tls`
- DNS: external-dns annotation points at the fronting VPS
- Backend: FastAPI + SQLite on an `nfs-client` PVC mounted at `/data`
  (RBD/Ceph was timing out in this cluster — use `nfs-client`)
- Health endpoints: `/health` (nginx) and `/api/v1/health` (API)

Build & ship:

```sh
docker build -t extendederp/nathalie-lopez:amd64-v4 .            # frontend
docker build -f backend/Dockerfile -t extendederp/nathalie-lopez-backend:amd64-v2 .
docker push extendederp/nathalie-lopez:amd64-v4
docker push extendederp/nathalie-lopez-backend:amd64-v2
# kaniko alternative: deploy/kaniko-fe.json + deploy/kaniko-be.json
helm upgrade --install nathalie-lopez charts/nathalie-lopez -n nathalie-lopez \
  --set backend.adminPassword=… --set backend.sessionSecret=…
```

Contact details live in `src/config/site.ts` (email
`photographybynathalie@gmail.com`, based in West Yorkshire, Instagram
`@nathalielopezphotography`). The contact form composes a mailto: enquiry —
wire it to an API endpoint when a backend exists.
