import { Locator, Page } from '@playwright/test';
import { OrderDetails } from '../data/test-data';

export interface PurchaseConfirmation {
  title: string;
  id: string;
  amount: number;
  cardNumber: string;
  name: string;
  date: string;
}

export class PlaceOrderModal {
  readonly modal: Locator;
  readonly totalLabel: Locator;
  readonly nameInput: Locator;
  readonly countryInput: Locator;
  readonly cityInput: Locator;
  readonly cardInput: Locator;
  readonly monthInput: Locator;
  readonly yearInput: Locator;
  readonly purchaseButton: Locator;
  readonly closeButton: Locator;

  // Success dialog (SweetAlert)
  readonly confirmation: Locator;
  readonly confirmationTitle: Locator;
  readonly confirmationDetails: Locator;
  readonly confirmationOk: Locator;

  constructor(private readonly page: Page) {
    this.modal = page.locator('#orderModal');
    this.totalLabel = page.locator('#totalm');
    this.nameInput = page.locator('#name');
    this.countryInput = page.locator('#country');
    this.cityInput = page.locator('#city');
    this.cardInput = page.locator('#card');
    this.monthInput = page.locator('#month');
    this.yearInput = page.locator('#year');
    this.purchaseButton = this.modal.locator('button[onclick="purchaseOrder()"]');
    this.closeButton = this.modal.locator('.modal-footer button.btn-secondary');

    this.confirmation = page.locator('.sweet-alert');
    this.confirmationTitle = this.confirmation.locator('h2');
    this.confirmationDetails = this.confirmation.locator('p.lead');
    this.confirmationOk = this.confirmation.locator('button.confirm');
  }

  async waitUntilOpen(): Promise<void> {
    await this.nameInput.waitFor({ state: 'visible' });
  }

  async fill(details: Partial<OrderDetails>): Promise<void> {
    await this.waitUntilOpen();
    const fields: [Locator, string | undefined][] = [
      [this.nameInput, details.name],
      [this.countryInput, details.country],
      [this.cityInput, details.city],
      [this.cardInput, details.card],
      [this.monthInput, details.month],
      [this.yearInput, details.year],
    ];
    for (const [input, value] of fields) {
      if (value !== undefined) {
        await input.fill(value);
      }
    }
  }

  async purchase(): Promise<void> {
    await this.purchaseButton.click();
  }

  /**
   * Parses the SweetAlert body, e.g.
   * "Id: 123456\nAmount: 360 USD\nCard Number: 4111...\nName: QA\nDate: 14/9/2026"
   */
  async readConfirmation(): Promise<PurchaseConfirmation> {
    await this.confirmationTitle.waitFor({ state: 'visible' });
    const title = (await this.confirmationTitle.innerText()).trim();
    const text = await this.confirmationDetails.innerText();
    const field = (label: string): string =>
      text.match(new RegExp(`${label}:\\s*(.*)`, 'i'))?.[1]?.trim() ?? '';

    return {
      title,
      id: field('Id'),
      amount: Number.parseInt(field('Amount'), 10),
      cardNumber: field('Card Number'),
      name: field('Name'),
      date: field('Date'),
    };
  }

  async confirm(): Promise<void> {
    await this.confirmationOk.click();
  }
}
