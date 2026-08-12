const request = require('supertest');
const { sequelize, models } = require('../../src/models');
const app = require('../../src/app');
const cache = require('../../src/utils/cache');

async function resetDb() {
  cache.clear();
  await sequelize.sync({ force: true });
}

async function seedRoles() {
  return models.Role.bulkCreate([
    { name: 'admin', description: 'Full platform access' },
    { name: 'staff', description: 'Operations' },
    { name: 'customer', description: 'Storefront customer' },
  ]);
}

async function createUser(overrides = {}) {
  const { withProfile = true, emailVerifiedAt = new Date(), ...userFields } = overrides;
  const user = await models.User.create({
    email: `user_${Math.random().toString(36).slice(2, 10)}@example.com`,
    passwordHash: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    roleId: 3,
    status: 'active',
    emailVerifiedAt,
    ...userFields,
  });
  if (withProfile) {
    await models.Profile.create({ userId: user.id });
  }
  return user;
}

async function createCategory(overrides = {}) {
  return models.Category.create({
    name: 'Test Category',
    slug: `cat-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    ...overrides,
  });
}

async function createProduct(categoryId, overrides = {}) {
  return models.Product.create({
    sku: `SKU-${Math.floor(Math.random() * 1e9)}`,
    name: 'Test Product',
    slug: `test-product-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    priceCents: 1999,
    categoryId,
    isActive: true,
    featured: false,
    ...overrides,
  });
}

async function createInventory(productId, quantity = 10, overrides = {}) {
  return models.Inventory.create({
    productId,
    variantId: null,
    quantity,
    lowStockThreshold: 5,
    ...overrides,
  });
}

async function loginAs(email, password = 'Password123!') {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`loginAs failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  request,
  app,
  sequelize,
  models,
  resetDb,
  seedRoles,
  createUser,
  createCategory,
  createProduct,
  createInventory,
  loginAs,
  auth,
};
