import { Page } from '@playwright/test';

/**
 * DemoBlaze reports most results (login errors, "Product added", sign-up result...)
 * through native window.alert() dialogs.
 *
 * Usage: start waiting BEFORE the action that triggers the alert, so the dialog
 * is never missed, then await the promise to get its text.
 *
 *   const alert = waitForAlert(page);
 *   await loginModal.submit();
 *   expect(await alert).toBe('Wrong password.');
 */
export async function waitForAlert(page: Page, timeout = 10_000): Promise<string> {
  const dialog = await page.waitForEvent('dialog', { timeout });
  const message = dialog.message();
  await dialog.accept();
  return message;
}
