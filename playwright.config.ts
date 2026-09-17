import { defineConfig, devices } from '@playwright/test';

const CHROMIUM_EXECUTABLE = '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'sr-Latn',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
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
