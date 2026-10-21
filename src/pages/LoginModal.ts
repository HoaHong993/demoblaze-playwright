import { Locator, Page } from '@playwright/test';

export class LoginModal {
  readonly modal: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly closeButton: Locator;

  constructor(private readonly page: Page) {
    this.modal = page.locator('#logInModal');
    this.usernameInput = page.locator('#loginusername');
    this.passwordInput = page.locator('#loginpassword');
    this.submitButton = this.modal.locator('button[onclick="logIn()"]');
    this.closeButton = this.modal.locator('.modal-footer button.btn-secondary');
  }

  async waitUntilOpen(): Promise<void> {
    await this.usernameInput.waitFor({ state: 'visible' });
  }

  async fill(username: string, password: string): Promise<void> {
    await this.waitUntilOpen();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.fill(username, password);
    await this.submit();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }
}
