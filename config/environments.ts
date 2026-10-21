import * as dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  name: string;
  baseUrl: string;
  apiUrl: string;
}

/**
 * Central list of environments. DemoBlaze only has one public environment,
 * but the structure lets the team add staging/uat without touching tests.
 */
const environments: Record<string, EnvConfig> = {
  prod: {
    name: 'prod',
    baseUrl: 'https://www.demoblaze.com',
    apiUrl: 'https://api.demoblaze.com',
  },
};

const envName = process.env.TEST_ENV ?? 'prod';
const selected = environments[envName];

if (!selected) {
  throw new Error(
    `Unknown TEST_ENV "${envName}". Available: ${Object.keys(environments).join(', ')}`,
  );
}

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const config = {
  env: selected.name,
  baseUrl: process.env.BASE_URL ?? selected.baseUrl,
  apiUrl: process.env.API_URL ?? selected.apiUrl,
  credentials: {
    username: process.env.TEST_USERNAME ?? '',
    password: process.env.TEST_PASSWORD ?? '',
  },
  headless: (process.env.HEADLESS ?? 'true') !== 'false',
  workers: toInt(process.env.WORKERS, 4),
  retries: toInt(process.env.RETRIES, process.env.CI ? 2 : 1),
  perf: {
    pageLoadBudgetMs: toInt(process.env.PERF_PAGE_LOAD_BUDGET_MS, 5000),
    apiBudgetMs: toInt(process.env.PERF_API_BUDGET_MS, 2000),
  },
} as const;
