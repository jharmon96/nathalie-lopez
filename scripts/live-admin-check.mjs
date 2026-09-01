/**
 * Read-only live check: the deployed admin exposes Pricing and Page text,
 * and the investment page renders. Pass the admin password via env.
 *
 *   LIVE_ADMIN_PASSWORD=… node scripts/live-admin-check.mjs
 *
 * The sandbox cannot resolve the live domain, so chromium is launched with a
 * host-resolver rule pinning it to the VPS address (see README).
 */
import { chromium } from 'playwright'

const BASE = process.env.LIVE_BASE_URL ?? 'https://nathalie.lopez.clan.global'
const PASSWORD = process.env.LIVE_ADMIN_PASSWORD
if (!PASSWORD) {
  console.error('Set LIVE_ADMIN_PASSWORD')
  process.exit(1)
}

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP nathalie.lopez.clan.global 134.199.245.186'],
})
const page = await browser.newPage()
await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' })
const password = page.getByLabel('Admin password')
await password.waitFor({ state: 'visible', timeout: 20_000 })
await password.fill(PASSWORD)
await page.getByRole('button', { name: /sign in/i }).click()
const nav = page.getByRole('navigation', { name: 'Admin' })
await nav.waitFor({ timeout: 20_000 })
await nav.getByText('Pricing', { exact: true }).waitFor({ timeout: 10_000 })
await nav.getByText('Page text').waitFor({ timeout: 10_000 })
console.log('✓ nav shows Pricing and Page text')
await page.screenshot({ path: 'e2e/artifacts/live-admin-nav.png' })

await page.goto(`${BASE}/admin/sessions`, { waitUntil: 'domcontentloaded' })
await page.getByRole('heading', { name: 'Pricing' }).waitFor({ timeout: 10_000 })
const tiers = await page.getByLabel('Tier price').count()
console.log(`✓ Pricing tab lists ${tiers} tiers`)
await page.screenshot({ path: 'e2e/artifacts/live-pricing-tab.png', fullPage: true })

await page.goto(`${BASE}/investment`, { waitUntil: 'domcontentloaded' })
await page.getByText('Sessions and rates').first().waitFor({ timeout: 10_000 })
console.log('✓ investment page renders')
await page.screenshot({ path: 'e2e/artifacts/live-investment.png', fullPage: true })

await browser.close()
console.log('✓ live check complete')
