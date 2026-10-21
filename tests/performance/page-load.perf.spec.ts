import { test, expect } from '@playwright/test';
import { config } from '../../config/environments';
import { DemoblazeApi } from '../../src/api/DemoblazeApi';

/**
 * Lightweight front-end performance checks using the browser Navigation Timing API.
 * These are budget checks for regression detection, not load tests
 * (see perf/k6/load-test.js for load testing).
 */
const pages = [
  { name: 'Home', path: '/index.html' },
  { name: 'Product detail', path: '/prod.html?idp_=1' },
  { name: 'Cart', path: '/cart.html' },
];

test.describe('Performance budgets @perf', () => {
  for (const p of pages) {
    test(`PERF_01 - ${p.name} page loads within budget @perf`, async ({ page }, testInfo) => {
      await page.goto(p.path, { waitUntil: 'load' });

      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const fcp = performance.getEntriesByName('first-contentful-paint')[0];
        return {
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          load: Math.round(nav.loadEventEnd - nav.startTime),
          firstContentfulPaint: fcp ? Math.round(fcp.startTime) : null,
        };
      });

      // Attach the numbers to the HTML report for trend tracking.
      await testInfo.attach(`${p.name}-timing.json`, {
        body: JSON.stringify(timing, null, 2),
        contentType: 'application/json',
      });

      expect(timing.load, `${p.name} load time (ms)`).toBeLessThan(config.perf.pageLoadBudgetMs);
    });
  }

  test('PERF_02 - key API endpoints respond within budget @perf', async ({ request }, testInfo) => {
    const api = new DemoblazeApi(request, config.apiUrl);
    const results = {
      entries: (await api.getProducts()).durationMs,
      view: (await api.getProduct(1)).durationMs,
      bycat: (await api.getProductsByCategory('phone')).durationMs,
    };

    await testInfo.attach('api-timing.json', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });

    for (const [endpoint, ms] of Object.entries(results)) {
      expect(ms, `/${endpoint} response time (ms)`).toBeLessThan(config.perf.apiBudgetMs);
    }
  });
});
