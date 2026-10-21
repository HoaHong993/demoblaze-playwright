import { defineConfig, devices } from '@playwright/test';
import { config } from './config/environments';

/**
 * Projects:
 *  - setup          : creates a test account through the API (runs once, before UI/API projects)
 *  - chromium/firefox/webkit : desktop cross-browser UI tests
 *  - mobile-chrome/mobile-safari : cross-platform (mobile viewport) UI tests
 *  - api            : API tests, no browser
 *  - performance    : page-load / API response-time budgets (Chromium only)
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: config.retries,
  workers: process.env.CI ? 2 : config.workers,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },

    {
      name: 'chromium',
      testMatch: /ui\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: /ui\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: /ui\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      testMatch: /ui\/.*\.spec\.ts/,
      grep: /@smoke/,
      dependencies: ['setup'],
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      testMatch: /ui\/.*\.spec\.ts/,
      grep: /@smoke/,
      dependencies: ['setup'],
      use: { ...devices['iPhone 14'] },
    },

    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { baseURL: config.apiUrl },
    },

    {
      name: 'performance',
      testMatch: /performance\/.*\.spec\.ts/,
      retries: 0,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
