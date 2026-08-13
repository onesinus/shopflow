const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { models } = require('../models');
const ApiError = require('../utils/ApiError');
const { formatDateLegacy } = require('../utils/legacy');

const DAY_MS = 24 * 60 * 60 * 1000;

function toStartOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toEndOfDay(value) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

async function getDashboardStats() {
  const today = formatDateLegacy(new Date());

  const [revenueTotal] = await sequelize.query(
    `SELECT COALESCE(SUM(total_cents), 0) AS total FROM orders WHERE payment_status = 'paid'`
  );

  const [revenueToday] = await sequelize.query(
    `SELECT COALESCE(SUM(total_cents), 0) AS total FROM orders WHERE payment_status = 'paid' AND date(created_at) = '${today}'`
  );

  const [ordersToday] = await sequelize.query(
    `SELECT COUNT(*) AS count FROM orders WHERE date(created_at) = '${today}'`
  );

  const [ordersTotal] = await sequelize.query(`SELECT COUNT(*) AS count FROM orders`);

  const [uniqueCustomers] = await sequelize.query(
    `SELECT COUNT(DISTINCT user_id) AS count FROM orders`
  );

  const pendingOrders = await models.Order.count({ where: { status: 'pending' } });
  const newUsers30d = await models.User.count({ where: { createdAt: { [Op.gte]: new Date(Date.now() - 30 * DAY_MS) } } });

  const lowStockProducts = await models.Inventory.count({
    where: sequelize.where(sequelize.col('quantity'), '<=', sequelize.col('low_stock_threshold')),
  });

  const [topProducts] = await sequelize.query(
    `SELECT oi.product_id AS "productId", oi.product_name AS name, SUM(oi.quantity) AS units, SUM(oi.total_cents) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled', 'refunded')
      GROUP BY oi.product_id, oi.product_name
      ORDER BY revenue DESC
      LIMIT 5`
  );

  return {
    revenueTotalCents: Number(revenueTotal[0].total),
    revenueTodayCents: Number(revenueToday[0].total),
    ordersToday: Number(ordersToday[0].count),
    ordersTotal: Number(ordersTotal[0].count),
    uniqueCustomers: Number(uniqueCustomers[0].count),
    pendingOrders,
    newUsers30d,
    lowStockProducts,
    topProducts,
  };
}

async function getSalesReport({ from, to }) {
  const fromDate = from ? toStartOfDay(from) : new Date(Date.now() - 30 * DAY_MS);
  const toDate = to ? toEndOfDay(to) : new Date();

  const orders = await models.Order.findAll({
    where: {
      createdAt: { [Op.gte]: fromDate, [Op.lte]: toDate },
      status: { [Op.notIn]: ['cancelled', 'refunded'] },
    },
    attributes: ['id', 'orderNumber', 'totalCents', 'createdAt'],
    order: [['createdAt', 'ASC']],
  });

  const byDay = {};
  for (const order of orders) {
    const day = formatDateLegacy(order.createdAt);
    byDay[day] = (byDay[day] || 0) + order.totalCents;
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    ordersCount: orders.length,
    totalsByDay: byDay,
  };
}

function exportSalesReport() {
  throw ApiError.notImplemented('CSV export for sales reports is not implemented yet');
}

module.exports = { getDashboardStats, getSalesReport, exportSalesReport };
