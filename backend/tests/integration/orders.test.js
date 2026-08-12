const request = require('supertest');
const { app, models, resetDb, seedRoles, createUser, createCategory, createProduct, createInventory, loginAs, auth } = require('../helpers/db');

describe('/api/v1/orders', () => {
  beforeEach(async () => {
    await resetDb();
    await seedRoles();
  });

  it('creates an order, charges it and decrements stock', async () => {
    const user = await createUser();
    const token = await loginAs(user.email);
    const category = await createCategory();
    const product = await createProduct(category.id, { sku: 'O-1', priceCents: 2000 });
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

    await request(app).post('/api/v1/cart/items').set(auth(token)).send({ productId: product.id, quantity: 2 });

    const res = await request(app).post('/api/v1/orders').set(auth(token)).send({ addressId: address.id });

    expect(res.status).toBe(201);
    // subtotal 4000 + shipping 599 + tax 330 = 4929
    expect(res.body.data.subtotalCents).toBe(4000);
    expect(res.body.data.shippingCents).toBe(599);
    expect(res.body.data.taxCents).toBe(330);
    expect(res.body.data.totalCents).toBe(4929);
    expect(res.body.data.status).toBe('paid');
    expect(res.body.data.paymentStatus).toBe('paid');
    expect(res.body.data.payment.status).toBe('succeeded');

    const inventory = await models.Inventory.findOne({ where: { productId: product.id } });
    expect(inventory.quantity).toBe(8);
  });

  it('rejects checkout with an empty cart', async () => {
    const user = await createUser();
    const token = await loginAs(user.email);
    const category = await createCategory();
    const product = await createProduct(category.id, { sku: 'O-2' });
    await createInventory(product.id, 5);
    const address = await models.Address.create({
      userId: user.id,
      firstName: 'A',
      lastName: 'B',
      line1: '2 Main St',
      city: 'Portland',
      country: 'US',
    });

    const res = await request(app).post('/api/v1/orders').set(auth(token)).send({ addressId: address.id });
    expect(res.status).toBe(400);
  });

  it('lists the current users orders only', async () => {
    const user = await createUser();
    const token = await loginAs(user.email);
    const category = await createCategory();
    const product = await createProduct(category.id, { sku: 'O-3', priceCents: 1000 });
    await createInventory(product.id, 5);
    const address = await models.Address.create({
      userId: user.id,
      firstName: 'A',
      lastName: 'B',
      line1: '3 Main St',
      city: 'Portland',
      country: 'US',
    });

    await request(app).post('/api/v1/cart/items').set(auth(token)).send({ productId: product.id, quantity: 1 });
    await request(app).post('/api/v1/orders').set(auth(token)).send({ addressId: address.id });

    const list = await request(app).get('/api/v1/orders').set(auth(token));
    expect(list.body.data.length).toBe(1);
  });

  it('blocks checkout for an unverified email', async () => {
    const user = await createUser({ emailVerifiedAt: null });
    const token = await loginAs(user.email);
    const category = await createCategory();
    const product = await createProduct(category.id, { sku: 'O-V', priceCents: 1000 });
    await createInventory(product.id, 5);
    const address = await models.Address.create({
      userId: user.id,
      firstName: 'A',
      lastName: 'B',
      line1: '5 Main St',
      city: 'Portland',
      country: 'US',
    });

    await request(app).post('/api/v1/cart/items').set(auth(token)).send({ productId: product.id, quantity: 1 });
    const res = await request(app).post('/api/v1/orders').set(auth(token)).send({ addressId: address.id });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/verify your email/i);
  });

  it('does not leak another users order through the detail endpoint', async () => {
    const alice = await createUser({ email: 'alice@example.com' });
    const aliceToken = await loginAs(alice.email);
    const category = await createCategory();
    const product = await createProduct(category.id, { sku: 'O-4', priceCents: 3000 });
    await createInventory(product.id, 5);
    const address = await models.Address.create({
      userId: alice.id,
      firstName: 'A',
      lastName: 'B',
      line1: '4 Main St',
      city: 'Portland',
      country: 'US',
    });

    await request(app).post('/api/v1/cart/items').set(auth(aliceToken)).send({ productId: product.id, quantity: 1 });
    const orderRes = await request(app).post('/api/v1/orders').set(auth(aliceToken)).send({ addressId: address.id });
    const orderId = orderRes.body.data.id;

    const bob = await createUser({ email: 'bob@example.com' });
    const bobToken = await loginAs(bob.email);

    const res = await request(app).get(`/api/v1/orders/${orderId}`).set(auth(bobToken));
    expect(res.status).toBe(404);
  });
});
