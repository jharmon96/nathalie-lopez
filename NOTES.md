# Engineering notes

Gotchas and conventions that aren't obvious from the code. Read this before
changing the build, the auth flow, or the admin editors.

## Deployment

- **Kaniko pod name must be exactly `kaniko`** (pod name == container name).
  Kaniko's `--overrides` merge with the base pod by container name — if the
  names differ, the args silently drop and the executor prints its help text.
- **`--context=tar://stdin` is fragile.** The tarball must be gzipped and a
  slow `kubectl run -i` attach corrupts the stream. Use the PVC flow:
  stage `context.tar.gz` on `/data` via `kubectl exec` into the backend pod,
  then build with `deploy/kaniko-fe-pod.yaml` / `deploy/kaniko-be-pod.yaml`
  (`--context=tar:///data/context.tar.gz`). No stdin, no races.
- **Version sync:** bump `app.version` / `backend.version` in
  `charts/nathalie-lopez/values.yaml` *and* the `--destination` tag in the
  matching `deploy/kaniko-*.json` + `deploy/kaniko-*-pod.yaml` in the same
  commit. Frontend and backend versions bump independently (fe vN, be vM).
- **Secrets never go through Helm** (values end up in release history).
  `nathalie-lopez-backend` (admin-password, session-secret) and
  `nathalie-lopez-instagram` (instagram-app-secret) are kubectl-created once;
  the chart references them but never renders them.
- **Storage class is `nfs-client`**, not `csi-rbd-sc` — the Ceph provisioner
  times out on this cluster. SQLite lives on the PVC at `/data`.
- Deleting the Helm release would delete the PVC (it's release-owned with
  keep annotation — verify before any `helm uninstall`).
- After a backend image push with an unchanged tag (rare), `kubectl rollout
  restart deployment/nathalie-lopez-backend -n nathalie-lopez` forces a pull.

## Local development & sandbox quirks

- npm cache in this environment is unwritable: prefix installs with
  `npm_config_cache=/tmp/npm-cache`.
- The sandbox cannot reliably resolve `nathalie.lopez.clan.global`:
  - curl: `--resolve nathalie.lopez.clan.global:443:134.199.245.186`
  - Playwright/chromium: launch arg
    `--host-resolver-rules=MAP nathalie.lopez.clan.global 134.199.245.186`
  - Playwright browsers live outside the repo: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers`
- Local dev stack: `npm run dev` on :9095 (vite) +
  `kubectl port-forward deployment/nathalie-lopez-backend 8100:8000 -n nathalie-lopez`
  with `VITE_API_TARGET=http://localhost:8100`. The port-forward dies whenever
  a helm upgrade replaces the backend pod — just restart it.

## Backend conventions

- Every admin PATCH router follows **partial-update semantics**:
  a separate `*Update` model with all-optional fields +
  `body.model_dump(exclude_unset=True)`. Do not accept the full create body on
  PATCH — partial sends would 422 (this was a real bug on photos).
- SQLite stores naive datetimes; compare with the `_naive_utc()` helper in
  `app/security.py`, never against aware `datetime.now()`.
- Tests set env vars in `backend/tests/conftest.py` **before** importing the
  app (settings are lru-cached). In-memory SQLite needs `StaticPool` +
  `check_same_thread=False`. Login throttling is disabled in tests via
  `NLP_LOGIN_RATE_MAX=1000`, secure cookies via `NLP_DEBUG=true` (the test
  client is plain http).
- `seed_content` runs on startup: first boot of a fresh DB is non-empty by
  design (6 photos, 3 sessions/pricing tiers, 6 FAQs, fallback site text).

## Frontend / admin conventions

- Admin editors share one pattern: `SortableList` for ordering +
  blur-autosave (`onBlur` on the card container, guarded with
  `contains(relatedTarget)` so tabbing between fields doesn't save) + explicit
  `saving…/saved ✓` status. **Never swallow save errors** — surface them in the
  card, an editor that shows "saved ✓" on a failed request is a bug
  (this was a real bug too).
- Editable copy uses the `SiteText` key-value store: field defaults live in
  the page/component, the admin "Page text" tab stores overrides, and an empty
  stored value means "fall back to built-in". New copy follows the same
  `copy(siteText, key, fallback)` shape (see `InvestmentPage`).
- The public site reads everything through `/api/v1/public/content`
  (one call: FAQs, photos, pricing tiers, site text) or `/public/slides`,
  `/public/reviews`, `/public/instagram`. The hero carousel uses curated
  slides when any exist and falls back to the latest portfolio photos
  otherwise — keep that contract when touching `HomePage`.
- Any public HTTPS URL is a valid image URL (site `/photos/`, S3, CDN).
  S3 objects must be publicly readable; the site has no S3 credentials.

## Testing

- Backend: `cd backend && python -m pytest tests/ -q` (29 tests).
- E2E: `npm run test:e2e` — needs the scratch stack: fresh backend on :8773
  (`NLP_LOGIN_RATE_MAX=1000`, throwaway `NLP_DATABASE_URL`) and
  `VITE_API_TARGET=http://localhost:8773 npm run dev -- --port 9097`.
  The Playwright suite logs in per test, so the rate limit matters.
- Live smoke check (read-only): `LIVE_ADMIN_PASSWORD=… node scripts/live-admin-check.mjs`

## Instagram

- Meta app runs in **Development mode** — the site's account must remain on
  the app's tester list or OAuth authorize fails. If the strip ever goes
  empty, re-connect in Admin → Instagram (token expiry) and check the tester
  invitation status in the Meta app console.
