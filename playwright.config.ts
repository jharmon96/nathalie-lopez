import { defineConfig } from '@playwright/test'

export default defineConfig({
  baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:9097',
  testDir: './e2e',
  workers: 1,
  retries: 0,
  timeout: 30_000,
  use: {
    headless: true,
    screenshot: 'off',
  },
  reporter: [['list']],
})
