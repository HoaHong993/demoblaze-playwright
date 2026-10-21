import { test as base, expect } from '@playwright/test';
import { config } from '../../config/environments';
import { DemoblazeApi } from '../api/DemoblazeApi';
import { HomePage } from '../pages/HomePage';
import { LoginModal } from '../pages/LoginModal';
import { SignUpModal } from '../pages/SignUpModal';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { PlaceOrderModal } from '../pages/PlaceOrderModal';
import { Credentials, loadCredentials } from '../utils/credentials';
import { randomPassword, uniqueUsername } from '../utils/data-factory';
import { waitForAlert } from '../utils/dialog';
import { MESSAGES } from '../data/test-data';

type Pages = {
  homePage: HomePage;
  loginModal: LoginModal;
  signUpModal: SignUpModal;
  productPage: ProductPage;
  cartPage: CartPage;
  orderModal: PlaceOrderModal;
};

type Helpers = {
  api: DemoblazeApi;
  /** Shared account created once by tests/global.setup.ts (read-only usage: login tests). */
  sharedUser: Credentials;
  /** Brand-new account per test, so cart tests never share state in parallel runs. */
  freshUser: Credentials;
  /** Logs the given user in through the UI and verifies the welcome message. */
  loginAs: (user: Credentials) => Promise<void>;
  /** Adds a product from its detail page and verifies the "Product added" alert. */
  addProductToCart: (productId: number) => Promise<void>;
};

export const test = base.extend<Pages & Helpers>({
  // ---------- Page objects ----------
  homePage: async ({ page }, use) => use(new HomePage(page)),
  loginModal: async ({ page }, use) => use(new LoginModal(page)),
  signUpModal: async ({ page }, use) => use(new SignUpModal(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  orderModal: async ({ page }, use) => use(new PlaceOrderModal(page)),

  // ---------- Data / API ----------
  api: async ({ request }, use) => use(new DemoblazeApi(request, config.apiUrl)),

  sharedUser: async ({}, use) => use(loadCredentials()),

  freshUser: async ({ api }, use) => {
    const user = { username: uniqueUsername('cart'), password: randomPassword() };
    const { body } = await api.signUp(user.username, user.password);
    expect(body, `sign-up failed: ${JSON.stringify(body)}`).not.toHaveProperty('errorMessage');
    await use(user);
  },

  // ---------- Reusable flows ----------
  loginAs: async ({ homePage, loginModal }, use) => {
    await use(async (user) => {
      await homePage.open();
      await homePage.openLogin();
      await loginModal.login(user.username, user.password);
      await expect(homePage.welcomeUser).toHaveText(`Welcome ${user.username}`);
    });
  },

  addProductToCart: async ({ page, productPage }, use) => {
    await use(async (productId) => {
      await productPage.open(productId);
      const alert = waitForAlert(page);
      await productPage.addToCart();
      expect(await alert).toMatch(MESSAGES.productAdded);
    });
  },
});

export { expect };
