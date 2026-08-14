import { defineConfig, devices } from '@playwright/test';

/**
 * Test chay tren he thong DANG CHAY, khong tu dung server.
 *
 * Ly do: luong mua hang can ca ba service cong Postgres va Redis. Dung
 * `webServer` de Playwright tu bat se giau mat loi cau hinh that su - neu
 * catalog-service khong len duoc, ta muon thay ro dieu do chu khong phai mot
 * test timeout kho hieu.
 */
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    locale: 'vi-VN',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
