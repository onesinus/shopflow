const request = require('supertest');
const {
  app,
  models,
  resetDb,
  seedRoles,
  createUser,
  createCategory,
  createProduct,
  createInventory,
  loginAs,
  auth,
} = require('../helpers/db');

describe('/api/v1 challenges', () => {
  beforeEach(async () => {
    await resetDb();
    await seedRoles();
  });

  describe('C01 - cart quantity is not validated against stock on update', () => {
    it.skip('rejects raising a line quantity above available stock', async () => {
      const user = await createUser();
      const token = await loginAs(user.email);
      const category = await createCategory();
      const product = await createProduct(category.id, { sku: 'C01-1', priceCents: 1000 });
      await createInventory(product.id, 3);

      await request(app)
        .post('/api/v1/cart/items')
        .set(auth(token))
        .send({ productId: product.id, quantity: 1 });

      const cart = await request(app).get('/api/v1/cart').set(auth(token));
      const itemId = cart.body.data.items[0].id;

      const res = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set(auth(token))
        .send({ quantity: 99 });

      expect(res.status).toBe(422);
    });
  });

  describe('C02 - cancelled orders do not restore inventory', () => {
    it('returns stock to the shelf when an order is cancelled', async () => {
      const user = await createUser();
      const token = await loginAs(user.email);
      const category = await createCategory();
      const product = await createProduct(category.id, { sku: 'C02-1', priceCents: 1000 });
      await createInventory(product.id, 5);
      const address = await models.Address.create({
        userId: user.id,
        firstName: 'A',
        lastName: 'B',
        line1: '1 Main St',
        city: 'Portland',
        country: 'US',
      });

      await request(app).post('/api/v1/cart/items').set(auth(token)).send({ productId: product.id, quantity: 2 });
      const orderRes = await request(app).post('/api/v1/orders').set(auth(token)).send({ addressId: address.id });
      expect(orderRes.status).toBe(201);

      const before = await models.Inventory.findOne({ where: { productId: product.id } });
      expect(before.quantity).toBe(3);

      const cancelRes = await request(app)
        .post(`/api/v1/orders/${orderRes.body.data.id}/cancel`)
        .set(auth(token));
      expect(cancelRes.status).toBe(200);

      const after = await models.Inventory.findOne({ where: { productId: product.id } });
      expect(after.quantity).toBe(5);
    });
  });

  describe('C04 - multiple default addresses are allowed', () => {
    it.skip('keeps exactly one default address for a user', async () => {
      const user = await createUser();
      const token = await loginAs(user.email);

      await request(app)
        .post('/api/v1/users/me/addresses')
        .set(auth(token))
        .send({
          firstName: 'A',
          lastName: 'B',
          line1: '1 Main St',
          city: 'Portland',
          country: 'US',
          isDefault: true,
        });

      await request(app)
        .post('/api/v1/users/me/addresses')
        .set(auth(token))
        .send({
          firstName: 'C',
          lastName: 'D',
          line1: '2 Main St',
          city: 'Portland',
          country: 'US',
          isDefault: true,
        });

      const list = await request(app).get('/api/v1/users/me/addresses').set(auth(token));
      const defaults = list.body.data.filter((a) => a.isDefault === true);
      expect(defaults.length).toBe(1);
    });
  });

  describe('C05 - wishlist allows duplicate product rows', () => {
    it('adds a product to the wishlist only once', async () => {
      const user = await createUser();
      const token = await loginAs(user.email);
      const category = await createCategory();
      const product = await createProduct(category.id, { sku: 'C05-1' });

      await request(app).post(`/api/v1/wishlist/${product.id}`).set(auth(token)).expect(201);
      await request(app).post(`/api/v1/wishlist/${product.id}`).set(auth(token)).expect(201);

      const list = await request(app).get('/api/v1/wishlist').set(auth(token));
      expect(list.body.data.length).toBe(1);
    });
  });
});
