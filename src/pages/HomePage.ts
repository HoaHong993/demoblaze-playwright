import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type Category = 'Phones' | 'Laptops' | 'Monitors';

export class HomePage extends BasePage {
  readonly productCards: Locator;
  readonly productTitles: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productCards = page.locator('#tbodyid .card');
    this.productTitles = page.locator('#tbodyid .card-title a');
    this.nextButton = page.locator('#next2');
    this.previousButton = page.locator('#prev2');
  }

  async open(): Promise<void> {
    await this.page.goto('/index.html');
    await this.productTitles.first().waitFor({ state: 'visible' });
  }

  async filterByCategory(category: Category): Promise<void> {
    await this.page.locator('#itemc', { hasText: category }).click();
  }

  productLink(name: string): Locator {
    return this.productTitles.filter({ hasText: name }).first();
  }

  async openProduct(name: string): Promise<void> {
    await this.productLink(name).click();
    await this.page.waitForURL(/prod\.html\?idp_=/);
  }
}
