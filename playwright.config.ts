import { defineConfig, devices } from '@playwright/test';

const CHROMIUM_EXECUTABLE = '/opt/pw-browsers/chromium';

// Default port/URL match `npm run preview`'s hardcoded 4173. Set PW_PORT to
// run the webServer on a different port (e.g. when 4173 is already taken by
// another agent's preview server), or PLAYWRIGHT_BASE_URL to point at an
// already-running server entirely (skips launching a new webServer process).
const PORT = process.env.PW_PORT ? Number(process.env.PW_PORT) : 4173;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'sr-Latn',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'm360',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 360, height: 640 },
        isMobile: true,
        hasTouch: true,
        launchOptions: { executablePath: CHROMIUM_EXECUTABLE },
      },
    },
    {
      name: 'm390',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        launchOptions: { executablePath: CHROMIUM_EXECUTABLE },
      },
    },
    {
      name: 't768',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        launchOptions: { executablePath: CHROMIUM_EXECUTABLE },
      },
    },
    {
      name: 'd1440',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        launchOptions: { executablePath: CHROMIUM_EXECUTABLE },
      },
    },
  ],
});
