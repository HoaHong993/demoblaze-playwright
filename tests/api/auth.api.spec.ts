import { test, expect } from '../../src/fixtures/test-fixtures';
import { config } from '../../config/environments';
import { randomPassword, uniqueUsername } from '../../src/utils/data-factory';
import { MESSAGES } from '../../src/data/test-data';

test.describe('API - Authentication', () => {
  test('API_AUTH_01 - sign up a new user @api @smoke', async ({ api }) => {
    const res = await api.signUp(uniqueUsername('api'), randomPassword());

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('errorMessage');
    expect(res.durationMs).toBeLessThan(config.perf.apiBudgetMs);
  });

  test('API_AUTH_02 - sign up with an existing username is rejected @api', async ({
    api,
    sharedUser,
  }) => {
    const res = await api.signUp(sharedUser.username, 'whatever');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ errorMessage: MESSAGES.userAlreadyExist });
  });

  test('API_AUTH_03 - login with valid credentials returns a token @api @smoke', async ({
    api,
    sharedUser,
  }) => {
    const res = await api.login(sharedUser.username, sharedUser.password);

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('string');
    expect(res.body as string).toMatch(/^Auth_token: \S+/);
  });

  test('API_AUTH_04 - login with wrong password @api', async ({ api, sharedUser }) => {
    const res = await api.login(sharedUser.username, 'definitely-wrong');
    expect(res.body).toEqual({ errorMessage: MESSAGES.wrongPassword });
  });

  test('API_AUTH_05 - login with unknown user @api', async ({ api }) => {
    const res = await api.login(uniqueUsername('ghost'), 'whatever');
    expect(res.body).toEqual({ errorMessage: MESSAGES.userNotExist });
  });
});
