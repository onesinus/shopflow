const request = require('supertest');
const { app, models, resetDb, seedRoles, createUser, createCategory, createProduct, loginAs, auth } = require('../helpers/db');

describe('C09: add-to-cart uses the selected variant stock', () => {
  beforeEach(async () => {
    await resetDb();
    await seedRoles();
  });

  it('exposes per-variant and product stock on the product detail', async () => {
    const user = await createUser();
    const token = await loginAs(user.email);
    const category = await createCategory();
    const product = await createProduct(category.id, { sku: 'C09-1' });

    const variantA = await models.ProductVariant.create({ productId: product.id, sku: 'C09-1-A', name: 'A', priceCents: 1200 });
    const variantB = await models.ProductVariant.create({ productId: product.id, sku: 'C09-1-B', name: 'B', priceCents: 1500 });
    await models.Inventory.create({ productId: product.id, variantId: variantA.id, quantity: 3 });
    await models.Inventory.create({ productId: product.id, variantId: variantB.id, quantity: 0 });

    const res = await request(app).get(`/api/v1/products/slug/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stock).toBe(0);

    const byId = {};
    res.body.data.variants.forEach((v) => {
      byId[v.id] = v.stock;
    });
    expect(byId[variantA.id]).toBe(3);
    expect(byId[variantB.id]).toBe(0);
  });
});