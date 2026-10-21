import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parsePrice } from '../utils/price';

export interface CartRow {
  title: string;
  price: number;
}

export class CartPage extends BasePage {
  readonly rows: Locator;
  readonly total: Locator;
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    super(page);
    this.rows = page.locator('#tbodyid tr.success');
    this.total = page.locator('#totalp');
    this.placeOrderButton = page.locator('button.btn-success', { hasText: 'Place Order' });
  }

  async open(): Promise<void> {
    await this.page.goto('/cart.html');
    await this.placeOrderButton.waitFor({ state: 'visible' });
  }

  /** Cart rows are rendered asynchronously after /viewcart returns. */
  async waitForItemCount(count: number): Promise<void> {
    await expect(this.rows).toHaveCount(count, { timeout: 15_000 });
  }

  async getRows(): Promise<CartRow[]> {
    const result: CartRow[] = [];
    const count = await this.rows.count();
    for (let i = 0; i < count; i++) {
      const cells = this.rows.nth(i).locator('td');
      result.push({
        title: (await cells.nth(1).innerText()).trim(),
        price: parsePrice(await cells.nth(2).innerText()),
      });
    }
    return result;
  }

  rowByTitle(title: string): Locator {
    return this.rows.filter({ has: this.page.locator('td', { hasText: title }) });
  }

  async deleteItem(title: string): Promise<void> {
    const before = await this.rows.count();
    await this.rowByTitle(title).first().locator('a', { hasText: 'Delete' }).click();
    await this.waitForItemCount(before - 1);
  }

  /** Total shown on the page; empty text (cart is empty) is reported as 0. */
  async getTotal(): Promise<number> {
    const text = (await this.total.innerText()).trim();
    return text === '' ? 0 : parsePrice(text);
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }
}
