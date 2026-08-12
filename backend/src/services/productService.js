const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { models } = require('../models');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache');
const { buildPagination } = require('../utils/paginate');
const { slugify } = require('../utils/slugify');
const { writeAudit } = require('../utils/audit');

const CACHE_TTL_MS = 60000;

async function getProductById(id) {
  const key = `product:${id}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const product = await models.Product.findByPk(id, {
    include: [
      { model: models.Category, as: 'category' },
      { model: models.ProductVariant, as: 'variants' },
      { model: models.Inventory, as: 'inventory' },
    ],
  });
  if (!product) return null;

  cache.set(key, product.toJSON(), CACHE_TTL_MS);
  return product;
}

async function createProduct(data, options = {}) {
  const sku = data.sku.trim();
  const slug = data.slug ? data.slug.trim() : slugify(data.name);

  const existing = await models.Product.findOne({ where: { [Op.or]: [{ sku }, { slug }] } });
  if (existing) throw ApiError.conflict('A product with this SKU or slug already exists');

  const product = await models.Product.create({
    sku,
    name: data.name,
    slug,
    description: data.description,
    priceCents: data.priceCents,
    categoryId: data.categoryId || null,
    brand: data.brand || null,
    imageUrl: data.imageUrl || null,
    featured: data.featured === true,
    isActive: true,
  });

  await models.Inventory.create({
    productId: product.id,
    quantity: data.stock !== undefined ? data.stock : 0,
    lowStockThreshold: data.lowStockThreshold !== undefined ? data.lowStockThreshold : 5,
  });

  await writeAudit({
    actorUserId: options.actorId,
    action: 'product.create',
    entityType: 'Product',
    entityId: product.id,
    after: product.toJSON(),
    ip: options.ip,
  });

  return getProductById(product.id);
}

async function updateProduct(id, data, options = {}) {
  const product = await models.Product.findByPk(id);
  if (!product) throw ApiError.notFound('Product not found');

  const patch = {};
  ['name', 'description', 'priceCents', 'categoryId', 'brand', 'featured', 'isActive', 'imageUrl'].forEach((key) => {
    if (data[key] !== undefined) patch[key] = data[key];
  });

  const before = product.toJSON();
  await product.update(patch);
  cache.del(`product:${id}`);

  await writeAudit({
    actorUserId: options.actorId,
    action: 'product.update',
    entityType: 'Product',
    entityId: product.id,
    before,
    after: product.toJSON(),
    ip: options.ip,
  });

  return getProductById(product.id);
}

async function deleteProduct(id, options = {}) {
  const product = await models.Product.findByPk(id);
  if (!product) throw ApiError.notFound('Product not found');

  await product.destroy();
  cache.del(`product:${id}`);

  await writeAudit({
    actorUserId: options.actorId,
    action: 'product.delete',
    entityType: 'Product',
    entityId: id,
    ip: options.ip,
  });

  return { ok: true };
}

async function createVariant(productId, data, options = {}) {
  const product = await models.Product.findByPk(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const variant = await models.ProductVariant.create({
    productId,
    sku: data.sku.trim(),
    name: data.name,
    option1: data.option1 || null,
    option2: data.option2 || null,
    priceCents: data.priceCents !== undefined ? data.priceCents : product.priceCents,
    isActive: true,
  });

  await models.Inventory.create({
    productId,
    variantId: variant.id,
    quantity: data.stock !== undefined ? data.stock : 0,
    lowStockThreshold: 5,
  });
  cache.del(`product:${productId}`);

  await writeAudit({
    actorUserId: options.actorId,
    action: 'product.variant.create',
    entityType: 'ProductVariant',
    entityId: variant.id,
    ip: options.ip,
  });

  return variant;
}

async function listLowStock(query) {
  const { page, limit, offset } = buildPagination(query);
  const { rows, count } = await models.Inventory.findAndCountAll({
    where: sequelize.where(sequelize.col('quantity'), '<=', sequelize.col('low_stock_threshold')),
    include: [{ model: models.Product, as: 'product', where: { is_active: true }, required: true }],
    order: [['quantity', 'ASC']],
    offset,
    limit,
    distinct: true,
  });
  return { rows, count, page, limit };
}

module.exports = { getProductById, createProduct, updateProduct, deleteProduct, createVariant, listLowStock };
