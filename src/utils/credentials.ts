import * as fs from 'fs';
import * as path from 'path';

export interface Credentials {
  username: string;
  password: string;
}

/** File written by tests/global.setup.ts and read by every test worker. */
export const CREDENTIALS_FILE = path.resolve(__dirname, '../../.auth/user.json');

export function saveCredentials(creds: Credentials): void {
  fs.mkdirSync(path.dirname(CREDENTIALS_FILE), { recursive: true });
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
}

export function loadCredentials(): Credentials {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    throw new Error(
      `No test account found at ${CREDENTIALS_FILE}. Run through a project that depends on "setup" ` +
        '(e.g. npx playwright test --project=chromium) or set TEST_USERNAME / TEST_PASSWORD.',
    );
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8')) as Credentials;
}
