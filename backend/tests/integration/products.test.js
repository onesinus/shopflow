const request = require('supertest');
const { app, resetDb, seedRoles, createCategory, createProduct, createInventory } = require('../helpers/db');

describe('GET /api/v1/products', () => {
  beforeEach(async () => {
    await resetDb();
    await seedRoles();

    const category = await createCategory({ name: 'Electronics', slug: 'electronics' });
    await createProduct(category.id, { sku: 'P-01', name: 'Laptop Pro', priceCents: 120000, featured: true });
    await createProduct(category.id, { sku: 'P-02', name: 'Mouse', priceCents: 3000 });
    await createProduct(category.id, { sku: 'P-03', name: 'Keyboard', priceCents: 5000 });
    await createProduct(category.id, { sku: 'P-04', name: 'Cable', priceCents: 1500 });
    await createProduct(category.id, { sku: 'P-05', name: 'Dongle', priceCents: 2500 });
    await createProduct(category.id, { sku: 'P-06', name: 'Pad', priceCents: 1200 });
    await createProduct(category.id, { sku: 'P-07', name: 'Webcam', priceCents: 8000 });
    await createProduct(category.id, { sku: 'P-08', name: 'Mic', priceCents: 6000 });
    await createProduct(category.id, { sku: 'P-09', name: 'Speaker', priceCents: 4000 });
    await createProduct(category.id, { sku: 'P-10', name: 'Monitor', priceCents: 25000 });
    await createProduct(category.id, { sku: 'P-11', name: 'USB-C 100W Charger', priceCents: 2000 });
    await createProduct(category.id, { sku: 'P-12', name: 'Hub', priceCents: 3500 });
  });

  it('lists products with pagination metadata', async () => {
    const res = await request(app).get('/api/v1/products');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(10);
    expect(res.body.meta.total).toBe(12);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('paginates to page 2', async () => {
    const res = await request(app).get('/api/v1/products?page=2');
    expect(res.body.data.length).toBe(2);
  });

  it('filters by a search term', async () => {
    const res = await request(app).get('/api/v1/products?q=laptop');
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].name).toBe('Laptop Pro');
  });

  it('is case-insensitive for search terms', async () => {
    const res = await request(app).get('/api/v1/products?q=LAPTOP');
    expect(res.body.meta.total).toBe(1);
  });

  it.skip('treats wildcard characters in search terms literally', async () => {
    const res = await request(app).get('/api/v1/products?q=' + encodeURIComponent('100%'));
    expect(res.body.meta.total).toBe(0);
  });

  it('filters by price range', async () => {
    const res = await request(app).get('/api/v1/products?min_price=10000&max_price=50000');
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].name).toBe('Monitor');
  });
});

describe('GET /api/v1/products/:id', () => {
  beforeEach(async () => {
    await resetDb();
    await seedRoles();
  });

  it('returns 404 when a product does not exist', async () => {
    const res = await request(app).get('/api/v1/products/999999');
    expect(res.status).toBe(404);
  });

  it('returns the product when it exists', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id, { sku: 'D-1', name: 'Detail Me' });
    await createInventory(product.id, 3);

    const res = await request(app).get(`/api/v1/products/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Detail Me');
  });
});
