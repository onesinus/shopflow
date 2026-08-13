const request = require('supertest');
const { app, models, resetDb, seedRoles, createUser, createCategory, createProduct, createInventory, loginAs, auth } = require('../helpers/db');

describe('/api/v1/admin', () => {
  beforeEach(async () => {
    await resetDb();
    await seedRoles();
  });

  it.skip('excludes refunded orders from revenue totals', async () => {
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

    const paidProduct = await createProduct(category.id, { sku: 'AD-1', priceCents: 10000 });
    await createInventory(paidProduct.id, 10);
    await request(app).post('/api/v1/cart/items').set(auth(custToken)).send({ productId: paidProduct.id, quantity: 1 });
    const paidOrder = await request(app).post('/api/v1/orders').set(auth(custToken)).send({ addressId: address.id });

    const refundedProduct = await createProduct(category.id, { sku: 'AD-2', priceCents: 5000 });
    await createInventory(refundedProduct.id, 10);
    await request(app).post('/api/v1/cart/items').set(auth(custToken)).send({ productId: refundedProduct.id, quantity: 1 });
    const refundedOrder = await request(app).post('/api/v1/orders').set(auth(custToken)).send({ addressId: address.id });
    await models.Payment.update({ status: 'refunded' }, { where: { orderId: refundedOrder.body.data.id } });
    await models.Order.update(
      { status: 'refunded', paymentStatus: 'refunded' },
      { where: { id: refundedOrder.body.data.id } }
    );

    const res = await request(app).get('/api/v1/admin/dashboard/stats').set(auth(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.revenueTotalCents).toBe(paidOrder.body.data.totalCents);
  });

  it.skip('reports low stock products', async () => {
    const staff = await createUser({ email: 'staff@example.com', roleId: 2 });
    const staffToken = await loginAs(staff.email);
    const category = await createCategory();
    const low = await createProduct(category.id, { sku: 'LS-1' });
    await createInventory(low.id, 2);
    const fine = await createProduct(category.id, { sku: 'LS-2' });
    await createInventory(fine.id, 50);

    const res = await request(app).get('/api/v1/admin/products/low-stock').set(auth(staffToken));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].productId).toBe(low.id);
  });

  it('includes orders placed late on the end date for same-day sales reports', async () => {
    const admin = await createUser({ email: 'admin2@example.com', roleId: 1 });
    const adminToken = await loginAs(admin.email);
    const customer = await createUser({ email: 'cust2@example.com' });
    const custToken = await loginAs(customer.email);
    const category = await createCategory();
    const product = await createProduct(category.id, { sku: 'SR-1', priceCents: 2500 });
    await createInventory(product.id, 10);
    const address = await models.Address.create({
      userId: customer.id,
      firstName: 'S',
      lastName: 'R',
      line1: '1 Main St',
      city: 'Portland',
      country: 'US',
    });

    await request(app).post('/api/v1/cart/items').set(auth(custToken)).send({ productId: product.id, quantity: 1 });
    const orderRes = await request(app).post('/api/v1/orders').set(auth(custToken)).send({ addressId: address.id });

    const today = new Date();
    const orderDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 0, 0);
    await models.Order.update({ createdAt: orderDate }, { where: { id: orderRes.body.data.id } });

    const day = orderDate.toISOString().slice(0, 10);
    const res = await request(app)
      .get('/api/v1/admin/reports/sales')
      .query({ from: day, to: day })
      .set(auth(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.ordersCount).toBe(1);
  });

  it('returns 501 for the not-yet-implemented sales export', async () => {
    const admin = await createUser({ email: 'admin3@example.com', roleId: 1 });
    const adminToken = await loginAs(admin.email);

    const res = await request(app).get('/api/v1/admin/reports/sales/export').set(auth(adminToken));
    expect(res.status).toBe(501);
  });

  it.skip('forbids customers from reading admin users', async () => {
    const customer = await createUser({ email: 'cust2@example.com' });
    const custToken = await loginAs(customer.email);

    const res = await request(app).get('/api/v1/admin/users').set(auth(custToken));
    expect(res.status).toBe(403);
  });
});
