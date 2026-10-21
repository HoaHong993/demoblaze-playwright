import { test as setup, expect } from '@playwright/test';
import { config } from '../config/environments';
import { DemoblazeApi } from '../src/api/DemoblazeApi';
import { saveCredentials } from '../src/utils/credentials';
import { randomPassword, uniqueUsername } from '../src/utils/data-factory';

/**
 * Runs once before UI/API projects.
 * - If TEST_USERNAME/TEST_PASSWORD are provided, verifies they can log in.
 * - Otherwise creates a brand-new account via the sign-up API.
 * The account is saved to .auth/user.json for all workers.
 */
setup('prepare shared test account', async ({ request }) => {
  const api = new DemoblazeApi(request, config.apiUrl);
  let { username, password } = config.credentials;

  if (!username || !password) {
    username = uniqueUsername('qa');
    password = randomPassword();
    const signUp = await api.signUp(username, password);
    expect(signUp.status).toBe(200);
    expect(signUp.body, JSON.stringify(signUp.body)).not.toHaveProperty('errorMessage');
  }

  const token = await api.getToken(username, password);
  expect(token.length).toBeGreaterThan(0);

  saveCredentials({ username, password });
});
