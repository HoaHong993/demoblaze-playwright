import { test, expect } from '../../src/fixtures/test-fixtures';
import { PRODUCTS } from '../../src/data/test-data';

test.describe('API - Catalog & Cart', () => {
  test('API_CAT_01 - product list returns items with required fields @api @smoke', async ({
    api,
  }) => {
    const res = await api.getProducts();

    expect(res.status).toBe(200);
    expect(res.body.Items.length).toBeGreaterThan(0);
    for (const item of res.body.Items) {
      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          price: expect.any(Number),
          cat: expect.any(String),
        }),
      );
      expect(item.price).toBeGreaterThan(0);
    }
  });

  test('API_CAT_02 - filter by category only returns that category @api', async ({ api }) => {
    const res = await api.getProductsByCategory('notebook');

    expect(res.status).toBe(200);
    expect(res.body.Items.length).toBeGreaterThan(0);
    expect(res.body.Items.every((p) => p.cat === 'notebook')).toBe(true);
  });

  test('API_CAT_03 - view product detail by id @api', async ({ api }) => {
    const res = await api.getProduct(PRODUCTS.samsungGalaxyS6.id);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ id: PRODUCTS.samsungGalaxyS6.id, title: PRODUCTS.samsungGalaxyS6.name }),
    );
  });

  test('API_CART_01 - add, view and delete cart items @api @smoke', async ({ api, freshUser }) => {
    const token = await api.getToken(freshUser.username, freshUser.password);

    const add = await api.addToCart(token, PRODUCTS.samsungGalaxyS6.id);
    expect(add.status).toBe(200);
    await api.addToCart(token, PRODUCTS.sonyVaioI5.id);

    const cart = await api.viewCart(token);
    expect(cart.body.Items.map((i) => i.prod_id).sort()).toEqual(
      [PRODUCTS.samsungGalaxyS6.id, PRODUCTS.sonyVaioI5.id].sort(),
    );

    await api.deleteItem(cart.body.Items[0].id);
    const afterDelete = await api.viewCart(token);
    expect(afterDelete.body.Items).toHaveLength(1);

    await api.clearCart(token);
    expect((await api.viewCart(token)).body.Items).toHaveLength(0);
  });

  test('API_CART_02 - carts are isolated between users @api', async ({ api, freshUser, sharedUser }) => {
    const freshToken = await api.getToken(freshUser.username, freshUser.password);
    const sharedToken = await api.getToken(sharedUser.username, sharedUser.password);

    await api.addToCart(freshToken, PRODUCTS.appleMonitor24.id);
    const sharedCart = await api.viewCart(sharedToken);

    expect(
      sharedCart.body.Items.some((i) => i.cookie === freshToken),
      'item of user A must not be visible in cart of user B',
    ).toBe(false);
  });
});
