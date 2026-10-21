import { test, expect } from '../../src/fixtures/test-fixtures';
import { PRODUCTS } from '../../src/data/test-data';

test.describe('Cart', () => {
  test('TC_CART_01 - guest can add a product to cart @smoke @regression', async ({
    productPage,
    cartPage,
    addProductToCart,
  }) => {
    await productPage.open(PRODUCTS.samsungGalaxyS6.id);
    const price = await productPage.getPrice();

    await addProductToCart(PRODUCTS.samsungGalaxyS6.id);
    await cartPage.open();
    await cartPage.waitForItemCount(1);

    const [row] = await cartPage.getRows();
    expect(row.title).toBe(PRODUCTS.samsungGalaxyS6.name);
    expect(row.price).toBe(price);
    await expect.poll(() => cartPage.getTotal()).toBe(price);
  });

  test('TC_CART_02 - logged-in user can add a product to cart @smoke @regression', async ({
    freshUser,
    loginAs,
    addProductToCart,
    cartPage,
  }) => {
    await loginAs(freshUser);
    await addProductToCart(PRODUCTS.nokiaLumia1520.id);

    await cartPage.open();
    await cartPage.waitForItemCount(1);
    await expect(cartPage.rowByTitle(PRODUCTS.nokiaLumia1520.name)).toHaveCount(1);
  });

  test('TC_CART_03 - products from different categories sum to correct total @regression', async ({
    freshUser,
    loginAs,
    addProductToCart,
    cartPage,
  }) => {
    await loginAs(freshUser);
    const items = [PRODUCTS.samsungGalaxyS6, PRODUCTS.sonyVaioI5, PRODUCTS.appleMonitor24];
    for (const item of items) {
      await addProductToCart(item.id);
    }

    await cartPage.open();
    await cartPage.waitForItemCount(items.length);

    const rows = await cartPage.getRows();
    const expectedTotal = rows.reduce((sum, r) => sum + r.price, 0);
    expect(rows.map((r) => r.title).sort()).toEqual(items.map((i) => i.name).sort());
    await expect.poll(() => cartPage.getTotal()).toBe(expectedTotal);
  });

  test('TC_CART_04 - adding the same product twice creates two lines @regression', async ({
    freshUser,
    loginAs,
    addProductToCart,
    cartPage,
  }) => {
    await loginAs(freshUser);
    await addProductToCart(PRODUCTS.samsungGalaxyS6.id);
    await addProductToCart(PRODUCTS.samsungGalaxyS6.id);

    await cartPage.open();
    await cartPage.waitForItemCount(2);
    const rows = await cartPage.getRows();
    await expect.poll(() => cartPage.getTotal()).toBe(rows[0].price * 2);
  });

  test('TC_CART_05 - deleting an item updates list and total @regression', async ({
    freshUser,
    loginAs,
    addProductToCart,
    cartPage,
  }) => {
    await loginAs(freshUser);
    await addProductToCart(PRODUCTS.samsungGalaxyS6.id);
    await addProductToCart(PRODUCTS.sonyVaioI5.id);

    await cartPage.open();
    await cartPage.waitForItemCount(2);
    await cartPage.deleteItem(PRODUCTS.samsungGalaxyS6.name);

    const rows = await cartPage.getRows();
    expect(rows.map((r) => r.title)).toEqual([PRODUCTS.sonyVaioI5.name]);
    await expect.poll(() => cartPage.getTotal()).toBe(rows[0].price);
  });

  test('TC_CART_06 - deleting the last item leaves an empty cart @regression', async ({
    freshUser,
    loginAs,
    addProductToCart,
    cartPage,
  }) => {
    await loginAs(freshUser);
    await addProductToCart(PRODUCTS.appleMonitor24.id);

    await cartPage.open();
    await cartPage.waitForItemCount(1);
    await cartPage.deleteItem(PRODUCTS.appleMonitor24.name);

    await cartPage.waitForItemCount(0);
    await expect.poll(() => cartPage.getTotal()).toBe(0);
  });

  test('TC_CART_07 - cart is kept on the account after logout and login @regression', async ({
    freshUser,
    loginAs,
    addProductToCart,
    cartPage,
    homePage,
  }) => {
    await loginAs(freshUser);
    await addProductToCart(PRODUCTS.sonyVaioI5.id);

    await homePage.logout();
    await expect(homePage.navLogin).toBeVisible();
    await loginAs(freshUser);

    await cartPage.open();
    await cartPage.waitForItemCount(1);
    await expect(cartPage.rowByTitle(PRODUCTS.sonyVaioI5.name)).toHaveCount(1);
  });

  test('TC_CART_08 - item added through API is shown in UI cart @regression', async ({
    api,
    freshUser,
    loginAs,
    cartPage,
  }) => {
    const token = await api.getToken(freshUser.username, freshUser.password);
    await api.addToCart(token, PRODUCTS.nokiaLumia1520.id);

    await loginAs(freshUser);
    await cartPage.open();
    await cartPage.waitForItemCount(1);
    await expect(cartPage.rowByTitle(PRODUCTS.nokiaLumia1520.name)).toHaveCount(1);
  });
});
