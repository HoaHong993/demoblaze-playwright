/**
 * k6 load test for the DemoBlaze public API (optional, requires k6: https://k6.io).
 *
 *   k6 run perf/k6/load-test.js
 *   k6 run -e VUS=20 -e DURATION=1m perf/k6/load-test.js
 *
 * Kept deliberately small: DemoBlaze is a shared public demo site, so do not
 * run heavy loads against it.
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';

const API = __ENV.API_URL || 'https://api.demoblaze.com';
const headers = { 'Content-Type': 'application/json' };

export const options = {
  stages: [
    { duration: '15s', target: Number(__ENV.VUS || 5) },
    { duration: __ENV.DURATION || '30s', target: Number(__ENV.VUS || 5) },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
    'http_req_duration{name:entries}': ['p(95)<1200'],
  },
};

export default function () {
  group('browse catalog', () => {
    const list = http.get(`${API}/entries`, { tags: { name: 'entries' } });
    check(list, {
      'entries 200': (r) => r.status === 200,
      'entries has items': (r) => r.json('Items').length > 0,
    });

    const view = http.post(`${API}/view`, JSON.stringify({ id: '1' }), {
      headers,
      tags: { name: 'view' },
    });
    check(view, { 'view 200': (r) => r.status === 200 });

    const byCat = http.post(`${API}/bycat`, JSON.stringify({ cat: 'phone' }), {
      headers,
      tags: { name: 'bycat' },
    });
    check(byCat, { 'bycat 200': (r) => r.status === 200 });
  });

  sleep(1);
}
