import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parsePrice } from '../utils/price';

export class ProductPage extends BasePage {
  readonly name: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.locator('#tbodyid h2.name');
    this.price = page.locator('#tbodyid h3.price-container');
    this.description = page.locator('#more-information p');
    this.addToCartButton = page.locator('#tbodyid a.btn-success', { hasText: 'Add to cart' });
  }

  async open(productId: number): Promise<void> {
    await this.page.goto(`/prod.html?idp_=${productId}`);
    await this.name.waitFor({ state: 'visible' });
  }

  async getPrice(): Promise<number> {
    return parsePrice(await this.price.innerText());
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }
}
