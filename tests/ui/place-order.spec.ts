import { test, expect } from '../../src/fixtures/test-fixtures';
import { waitForAlert } from '../../src/utils/dialog';
import { MESSAGES, PRODUCTS, VALID_ORDER } from '../../src/data/test-data';

test.describe('Place order', () => {
  test('TC_ORDER_01 - E2E: login, add to cart, place order @smoke @regression', async ({
    page,
    api,
    freshUser,
    loginAs,
    addProductToCart,
    cartPage,
    orderModal,
  }) => {
    // 1. Login with valid credentials
    await loginAs(freshUser);

    // 2. Add two products to cart
    await addProductToCart(PRODUCTS.samsungGalaxyS6.id);
    await addProductToCart(PRODUCTS.sonyVaioI5.id);

    // 3. Verify cart content & total
    await cartPage.open();
    await cartPage.waitForItemCount(2);
    const rows = await cartPage.getRows();
    const expectedTotal = rows.reduce((sum, r) => sum + r.price, 0);
    await expect.poll(() => cartPage.getTotal()).toBe(expectedTotal);

    // 4. Place order
    await cartPage.placeOrder();
    await orderModal.waitUntilOpen();
    await expect(orderModal.totalLabel).toContainText(String(expectedTotal));
    await orderModal.fill(VALID_ORDER);
    await orderModal.purchase();

    // 5. Verify confirmation
    const confirmation = await orderModal.readConfirmation();
    expect(confirmation.title).toBe(MESSAGES.purchaseSuccess);
    expect(confirmation.id).toMatch(/^\d+$/);
    expect(confirmation.amount).toBe(expectedTotal);
    expect(confirmation.cardNumber).toBe(VALID_ORDER.card);
    expect(confirmation.name).toBe(VALID_ORDER.name);

    // 6. Close confirmation -> back to home, cart emptied server side
    await orderModal.confirm();
    await page.waitForURL(/index\.html/);
    const token = await api.getToken(freshUser.username, freshUser.password);
    await expect
      .poll(async () => (await api.viewCart(token)).body.Items.length, { timeout: 15_000 })
      .toBe(0);
  });

  test('TC_ORDER_02 - guest can place an order @regression', async ({
    addProductToCart,
    cartPage,
    orderModal,
  }) => {
    await addProductToCart(PRODUCTS.appleMonitor24.id);
    await cartPage.open();
    await cartPage.waitForItemCount(1);
    const total = await cartPage.getTotal();

    await cartPage.placeOrder();
    await orderModal.fill(VALID_ORDER);
    await orderModal.purchase();

    const confirmation = await orderModal.readConfirmation();
    expect(confirmation.title).toBe(MESSAGES.purchaseSuccess);
    expect(confirmation.amount).toBe(total);
  });

  test('TC_ORDER_03 - only required fields (name + card) is enough @regression', async ({
    addProductToCart,
    cartPage,
    orderModal,
  }) => {
    await addProductToCart(PRODUCTS.nokiaLumia1520.id);
    await cartPage.open();
    await cartPage.waitForItemCount(1);

    await cartPage.placeOrder();
    await orderModal.fill({ name: VALID_ORDER.name, card: VALID_ORDER.card });
    await orderModal.purchase();

    expect((await orderModal.readConfirmation()).title).toBe(MESSAGES.purchaseSuccess);
  });

  const missingRequired = [
    { id: 'TC_ORDER_04', title: 'all fields empty', data: {} },
    { id: 'TC_ORDER_05', title: 'missing name', data: { ...VALID_ORDER, name: '' } },
    { id: 'TC_ORDER_06', title: 'missing credit card', data: { ...VALID_ORDER, card: '' } },
  ];

  for (const c of missingRequired) {
    test(`${c.id} - ${c.title} is rejected @regression`, async ({
      page,
      addProductToCart,
      cartPage,
      orderModal,
    }) => {
      await addProductToCart(PRODUCTS.samsungGalaxyS6.id);
      await cartPage.open();
      await cartPage.waitForItemCount(1);

      await cartPage.placeOrder();
      await orderModal.fill(c.data);
      const alert = waitForAlert(page);
      await orderModal.purchase();

      expect(await alert).toBe(MESSAGES.fillOrder);
      await expect(orderModal.confirmation).toBeHidden();
      await expect(orderModal.modal).toBeVisible();
    });
  }

  test('TC_ORDER_07 - closing the order form keeps the cart unchanged @regression', async ({
    addProductToCart,
    cartPage,
    orderModal,
  }) => {
    await addProductToCart(PRODUCTS.sonyVaioI5.id);
    await cartPage.open();
    await cartPage.waitForItemCount(1);

    await cartPage.placeOrder();
    await orderModal.waitUntilOpen();
    await orderModal.closeButton.click();

    await expect(orderModal.modal).toBeHidden();
    await cartPage.waitForItemCount(1);
  });
});
