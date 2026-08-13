const { Op } = require('sequelize');
const sequelize = require('../config/database');

function buildSearchWhere(query) {
  const where = { is_active: true };

  if (query.category) {
    where.category_id = query.category;
  }
  if (query.brand) {
    where.brand = query.brand;
  }
  if (query.min_price !== undefined) {
    where.price_cents = { ...(where.price_cents || {}), [Op.gte]: Number(query.min_price) };
  }
  if (query.max_price !== undefined) {
    where.price_cents = { ...(where.price_cents || {}), [Op.lte]: Number(query.max_price) };
  }
  if (query.q) {
    where[Op.and] = [searchClause(String(query.q))];
  }

  return where;
}

function searchClause(q) {
  const escapedQuery = String(q)
    .toLowerCase()
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');

  return sequelize.where(
    sequelize.fn('LOWER', sequelize.col('Product.name')),
    {
      [Op.like]: `%${escapedQuery}%`,
    }
  );
}

module.exports = { buildSearchWhere, searchClause };
