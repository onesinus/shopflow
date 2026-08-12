const request = require('supertest');
const { app, models, resetDb, seedRoles, createUser, createCategory, createProduct, createInventory, loginAs, auth } = require('../helpers/db');

describe('C02: cancelling an order returns the reserved stock', () => {
  beforeEach(async () => {
    await resetDb();
    await seedRoles();
  });

  async function placeOrder({ quantity = 3, sku = 'C02-1' } = {}) {
    const user = await createUser();
    const token = await loginAs(user.email);
    const category = await createCategory();
    const product = await createProduct(category.id, { sku, priceCents: 1000 });
    await createInventory(product.id, 10);
    const address = await models.Address.create({
      userId: user.id,
      firstName: 'A',
      lastName: 'B',
      line1: '1 Main St',
      city: 'Portland',
      country: 'US',
      isDefault: true,
    });

    await request(app).post('/api/v1/cart/items').set(auth(token)).send({ productId: product.id, quantity });
    const res = await request(app).post('/api/v1/orders').set(auth(token)).send({ addressId: address.id });
    expect(res.status).toBe(201);

    return { user, token, product, orderId: res.body.data.id };
  }

  it('decrements stock on order and restores it on cancel', async () => {
    const { token, product, orderId } = await placeOrder({ quantity: 3 });

    let inventory = await models.Inventory.findOne({ where: { productId: product.id } });
    expect(inventory.quantity).toBe(7);

    const res = await request(app).post(`/api/v1/orders/${orderId}/cancel`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');

    inventory = await models.Inventory.findOne({ where: { productId: product.id } });
    expect(inventory.quantity).toBe(10);
  });

  it('does not double-restore stock when cancelling an already-cancelled order', async () => {
    const { token, product, orderId } = await placeOrder({ quantity: 2 });

    await request(app).post(`/api/v1/orders/${orderId}/cancel`).set(auth(token));
    const again = await request(app).post(`/api/v1/orders/${orderId}/cancel`).set(auth(token));
    expect(again.status).toBe(400);

    const inventory = await models.Inventory.findOne({ where: { productId: product.id } });
    expect(inventory.quantity).toBe(10);
  });
});