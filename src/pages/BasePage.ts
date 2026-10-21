import { Locator, Page } from '@playwright/test';

/**
 * Shared navigation bar + helpers available on every DemoBlaze page.
 * On mobile viewports the navbar is collapsed behind a hamburger button,
 * so every nav action goes through openNavIfCollapsed().
 */
export abstract class BasePage {
  readonly navToggler: Locator;
  readonly navHome: Locator;
  readonly navCart: Locator;
  readonly navLogin: Locator;
  readonly navSignUp: Locator;
  readonly navLogout: Locator;
  readonly welcomeUser: Locator;

  constructor(protected readonly page: Page) {
    this.navToggler = page.locator('button.navbar-toggler');
    this.navHome = page.locator('a.nav-link[href="index.html"]');
    this.navCart = page.locator('#cartur');
    this.navLogin = page.locator('#login2');
    this.navSignUp = page.locator('#signin2');
    this.navLogout = page.locator('#logout2');
    this.welcomeUser = page.locator('#nameofuser');
  }

  protected async openNavIfCollapsed(): Promise<void> {
    if (await this.navToggler.isVisible()) {
      const expanded = await this.navToggler.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await this.navToggler.click();
      }
    }
  }

  async openLogin(): Promise<void> {
    await this.openNavIfCollapsed();
    await this.navLogin.click();
  }

  async openSignUp(): Promise<void> {
    await this.openNavIfCollapsed();
    await this.navSignUp.click();
  }

  async goToCart(): Promise<void> {
    await this.openNavIfCollapsed();
    await this.navCart.click();
    await this.page.waitForURL(/cart\.html/);
  }

  async goHome(): Promise<void> {
    await this.openNavIfCollapsed();
    await this.navHome.click();
    await this.page.waitForURL(/index\.html|\/$/);
  }

  async logout(): Promise<void> {
    await this.openNavIfCollapsed();
    await this.navLogout.click();
  }
}
