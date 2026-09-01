import { expect, test, type Page } from '@playwright/test'

/**
 * End-to-end: the admin must expose Pricing (tiers on the Investment page)
 * and Page text (Investment page wording), and edits must appear on the site.
 *
 * Runs against a scratch backend seeded with the standard demo content.
 */

const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-pass-123'
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:9097'

async function openAdmin(page: Page, path = '/admin') {
  await page.goto(`${BASE}/admin`)
  const password = page.getByLabel('Admin password')
  const nav = page.getByRole('navigation', { name: 'Admin' })
  // The admin shell redirects to /login after its auth check — wait for
  // whichever of the two turns up, then sign in if needed.
  await expect(password.or(nav)).toBeVisible({ timeout: 10_000 })
  if (await password.isVisible()) {
    await password.fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(nav).toBeVisible({ timeout: 10_000 })
  }
  if (path !== '/admin') await page.goto(`${BASE}${path}`)
}

test.describe.serial('admin pricing & page text', () => {
  test('admin nav exposes Pricing and Page text', async ({ page }) => {
    await openAdmin(page)
    const nav = page.getByRole('navigation', { name: 'Admin' })
    await expect(nav.getByText('Pricing', { exact: true })).toBeVisible()
    await expect(nav.getByText('Page text')).toBeVisible()
    await expect(nav.getByText('Sessions & pricing')).toHaveCount(0) // old label retired
    await page.screenshot({ path: 'e2e/artifacts/01-admin-nav.png' })
  })

  test('pricing tab lists the investment tiers', async ({ page }) => {
    await openAdmin(page, '/admin/sessions')
    await expect(page.getByRole('heading', { name: 'Pricing' })).toBeVisible()
    await expect(page.getByLabel('Tier price')).toHaveCount(3)
    await page.screenshot({ path: 'e2e/artifacts/02-pricing-tab.png', fullPage: true })
  })

  test('editing a tier price updates the investment page', async ({ page }) => {
    await openAdmin(page, '/admin/sessions')
    const price = page.getByLabel('Tier price').first()
    await price.fill('from £999 (e2e)')
    await price.blur()
    await expect(page.getByText('saved ✓')).toBeVisible({ timeout: 5000 })

    // The public investment page must show the new price.
    await page.goto(`${BASE}/investment`)
    await expect(page.getByText('from £999 (e2e)')).toBeVisible()
    await page.screenshot({ path: 'e2e/artifacts/03-investment-new-price.png', fullPage: true })
  })

  test('page text tab edits investment wording', async ({ page }) => {
    await openAdmin(page, '/admin/site-text')
    await expect(page.getByRole('heading', { name: 'Page text' })).toBeVisible()
    const lede = page.locator('label:has-text("Investment page — intro line") textarea')
    await lede.fill('E2E wording check: honest pricing, nothing hidden.')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('saved ✓')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'e2e/artifacts/04-page-text-tab.png', fullPage: true })

    await page.goto(`${BASE}/investment`)
    await expect(page.getByText('E2E wording check: honest pricing, nothing hidden.')).toBeVisible()
  })

  test('tier includes editor saves one-per-line bullets', async ({ page }) => {
    await openAdmin(page, '/admin/sessions')
    const includes = page.getByLabel('Tier includes').first()
    await includes.fill('E2E bullet one\nE2E bullet two')
    await includes.blur()
    await expect(page.getByText('saved ✓').first()).toBeVisible({ timeout: 5000 })

    await page.goto(`${BASE}/investment`)
    await expect(page.getByText('E2E bullet one')).toBeVisible()
    await expect(page.getByText('E2E bullet two')).toBeVisible()
  })
})
