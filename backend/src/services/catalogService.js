const { models } = require('../models');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/paginate');
const searchService = require('./searchService');

async function listProducts(query) {
  const { page, limit, offset } = buildPagination(query);
  const where = searchService.buildSearchWhere(query);

  const { rows, count } = await models.Product.findAndCountAll({
    where,
    include: [
      { model: models.Category, as: 'category' },
      { model: models.Inventory, as: 'inventory' },
    ],
    order: [
      ['featured', 'DESC'],
      ['name', 'ASC'],
    ],
    offset,
    limit,
    distinct: true,
  });

  return { rows, count, page, limit };
}

async function getProductBySlug(slug) {
  return models.Product.findOne({
    where: { slug, is_active: true },
    include: [
      { model: models.Category, as: 'category' },
      {
        model: models.ProductVariant,
        as: 'variants',
        where: { is_active: true },
        required: false,
        include: [{ model: models.Inventory, as: 'inventory' }],
      },
      { model: models.Inventory, as: 'inventory' },
    ],
  });
}

async function listFeatured(limit = 8) {
  return models.Product.findAll({
    where: { is_active: true, featured: true },
    include: [{ model: models.Inventory, as: 'inventory' }],
    order: [['createdAt', 'DESC']],
    limit,
  });
}

async function listCategories() {
  return models.Category.findAll({
    where: { is_active: true },
    order: [
      ['sortOrder', 'ASC'],
      ['name', 'ASC'],
    ],
  });
}

async function listByCategorySlug(slug, query) {
  const { page, limit, offset } = buildPagination(query);
  const category = await models.Category.findOne({ where: { slug } });
  if (!category) return { rows: [], count: 0, page, limit, category: null };

  const { rows, count } = await models.Product.findAndCountAll({
    where: { category_id: category.id, is_active: true },
    include: [{ model: models.Inventory, as: 'inventory' }],
    order: [['name', 'ASC']],
    offset,
    limit,
    distinct: true,
  });

  return { rows, count, page, limit, category };
}

module.exports = { listProducts, getProductBySlug, listFeatured, listCategories, listByCategorySlug };
