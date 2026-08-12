const request = require('supertest');
const { app, models, resetDb, seedRoles, createUser, createCategory, createProduct, createInventory, loginAs, auth } = require('../helpers/db');

describe('C03: sales report includes the "to" day', () => {
  beforeEach(async () => {
    await resetDb();
    await seedRoles();
  });

  async function placeOrderAt(createdAt) {
    const admin = await createUser({ email: 'admin@example.com', roleId: 1 });
    const adminToken = await loginAs(admin.email);
    const customer = await createUser({ email: 'cust@example.com' });
    const custToken = await loginAs(customer.email);
    const category = await createCategory();
    const address = await models.Address.create({
      userId: customer.id,
      firstName: 'C',
      lastName: 'D',
      line1: '1 Main St',
      city: 'Portland',
      country: 'US',
    });
    const product = await createProduct(category.id, { sku: 'C03-1', priceCents: 10000 });
    await createInventory(product.id, 10);
    await request(app).post('/api/v1/cart/items').set(auth(custToken)).send({ productId: product.id, quantity: 1 });
    const order = await request(app).post('/api/v1/orders').set(auth(custToken)).send({ addressId: address.id });
    expect(order.status).toBe(201);
    await models.Order.update({ createdAt }, { where: { id: order.body.data.id } });
    return { adminToken };
  }

  it('includes an order placed late on the "to" day', async () => {
    const { adminToken } = await placeOrderAt(new Date(Date.now() - 60 * 60 * 1000));

    const today = new Date().toISOString().slice(0, 10);
    const res = await request(app)
      .get('/api/v1/admin/reports/sales')
      .set(auth(adminToken))
      .query({ from: today, to: today });

    expect(res.status).toBe(200);
    expect(res.body.data.ordersCount).toBe(1);
    expect(Object.values(res.body.data.totalsByDay).reduce((a, b) => a + b, 0)).toBe(10825);
  });
});