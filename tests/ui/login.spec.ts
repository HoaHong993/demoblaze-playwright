import { test, expect } from '../../src/fixtures/test-fixtures';
import { waitForAlert } from '../../src/utils/dialog';
import { uniqueUsername } from '../../src/utils/data-factory';
import { MESSAGES } from '../../src/data/test-data';

test.describe('Login', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
    await homePage.openLogin();
  });

  test('TC_LOGIN_01 - login with valid credentials @smoke @regression', async ({
    homePage,
    loginModal,
    sharedUser,
  }) => {
    await loginModal.login(sharedUser.username, sharedUser.password);

    await expect(homePage.welcomeUser).toBeVisible();
    await expect(homePage.welcomeUser).toHaveText(`Welcome ${sharedUser.username}`);
    await expect(homePage.navLogout).toBeVisible();
    await expect(homePage.navLogin).toBeHidden();
    await expect(homePage.navSignUp).toBeHidden();
    await expect(loginModal.modal).toBeHidden();
  });

  test('TC_LOGIN_02 - session persists after page reload @regression', async ({
    page,
    homePage,
    loginModal,
    sharedUser,
  }) => {
    await loginModal.login(sharedUser.username, sharedUser.password);
    await expect(homePage.welcomeUser).toHaveText(`Welcome ${sharedUser.username}`);

    await page.reload();
    await expect(homePage.welcomeUser).toHaveText(`Welcome ${sharedUser.username}`);
  });

  test('TC_LOGIN_03 - logout returns to guest state @regression', async ({
    homePage,
    loginModal,
    sharedUser,
  }) => {
    await loginModal.login(sharedUser.username, sharedUser.password);
    await expect(homePage.navLogout).toBeVisible();

    await homePage.logout();

    await expect(homePage.navLogin).toBeVisible();
    await expect(homePage.welcomeUser).toBeHidden();
  });

  test('TC_LOGIN_05 - wrong password shows error @regression', async ({
    page,
    homePage,
    loginModal,
    sharedUser,
  }) => {
    await loginModal.fill(sharedUser.username, `${sharedUser.password}_wrong`);
    const alert = waitForAlert(page);
    await loginModal.submit();

    expect(await alert).toBe(MESSAGES.wrongPassword);
    await expect(homePage.welcomeUser).toBeHidden();
  });

  test('TC_LOGIN_06 - non-existent user shows error @regression', async ({
    page,
    homePage,
    loginModal,
  }) => {
    await loginModal.fill(uniqueUsername('ghost'), 'AnyPassword123');
    const alert = waitForAlert(page);
    await loginModal.submit();

    expect(await alert).toBe(MESSAGES.userNotExist);
    await expect(homePage.welcomeUser).toBeHidden();
  });

  const emptyFieldCases = [
    { id: 'TC_LOGIN_07', title: 'both fields empty', username: '', password: '' },
    { id: 'TC_LOGIN_08', title: 'empty username', username: '', password: 'Secret123' },
    { id: 'TC_LOGIN_09', title: 'empty password', username: 'someone', password: '' },
  ];

  for (const data of emptyFieldCases) {
    test(`${data.id} - ${data.title} shows validation alert @regression`, async ({
      page,
      homePage,
      loginModal,
    }) => {
      await loginModal.fill(data.username, data.password);
      const alert = waitForAlert(page);
      await loginModal.submit();

      expect(await alert).toBe(MESSAGES.fillLogin);
      await expect(homePage.welcomeUser).toBeHidden();
    });
  }

  test('TC_LOGIN_13 - password field is masked @regression', async ({ loginModal }) => {
    await loginModal.waitUntilOpen();
    await expect(loginModal.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC_LOGIN_15 - SQL injection payload does not log in @regression', async ({
    page,
    homePage,
    loginModal,
  }) => {
    await loginModal.fill("' OR '1'='1", "' OR '1'='1");
    const alert = waitForAlert(page);
    await loginModal.submit();

    // Whatever the exact message, the user must NOT be authenticated.
    expect(await alert).not.toBe('');
    await expect(homePage.welcomeUser).toBeHidden();
    await expect(homePage.navLogout).toBeHidden();
  });

  test('TC_LOGIN_16 - closing the modal keeps user logged out @regression', async ({
    homePage,
    loginModal,
    sharedUser,
  }) => {
    await loginModal.fill(sharedUser.username, sharedUser.password);
    await loginModal.close();

    await expect(homePage.welcomeUser).toBeHidden();
    await expect(homePage.navLogin).toBeVisible();
  });
});
