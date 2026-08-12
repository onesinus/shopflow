const { models } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../logger');
const pricingService = require('./pricingService');
const couponService = require('./couponService');
const paymentService = require('./paymentService');
const notificationService = require('./notificationService');
const mailer = require('./mailer');
const { writeAudit } = require('../utils/audit');
const { buildPagination } = require('../utils/paginate');

function generateOrderNumber() {
  const suffix = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `SF-${new Date().getFullYear()}-${suffix}${rand}`;
}

async function inventoryFor(item) {
  const where = item.variantId ? { variantId: item.variantId } : { productId: item.productId, variantId: null };
  return models.Inventory.findOne({ where });
}

async function createOrder(userId, { addressId, couponCode, paymentMethod }, options = {}) {
  const cart = await models.Cart.findOne({ where: { userId, status: 'active' } });
  if (!cart) throw ApiError.badRequest('Your cart is empty');

  const cartItems = await models.CartItem.findAll({
    where: { cartId: cart.id },
    include: [
      { model: models.Product, as: 'product' },
      { model: models.ProductVariant, as: 'variant' },
    ],
  });
  if (!cartItems.length) throw ApiError.badRequest('Your cart is empty');

  const address = await models.Address.findOne({ where: { id: addressId, userId } });
  if (!address) throw ApiError.badRequest('Invalid shipping address');

  let subtotal = 0;
  for (const item of cartItems) {
    const unitPrice = item.variant
      ? item.variant.priceCents ?? item.product.priceCents
      : item.product.priceCents;
    subtotal += unitPrice * item.quantity;

    const inventory = await inventoryFor(item);
    if (!inventory || inventory.quantity < item.quantity) {
      throw ApiError.unprocessable(`Not enough stock for "${item.product.name}"`);
    }
  }

  let coupon = null;
  if (couponCode) {
    coupon = await couponService.validateCoupon({ code: couponCode, subtotalCents: subtotal, userId });
  }
  const totals = pricingService.calculateTotals({
    subtotalCents: subtotal,
    country: address.country,
    coupon,
  });

  const order = await models.Order.create({
    orderNumber: generateOrderNumber(),
    userId,
    addressId: address.id,
    subtotalCents: totals.subtotalCents,
    shippingCents: totals.shippingCents,
    taxCents: totals.taxCents,
    discountCents: totals.discountCents,
    totalCents: totals.totalCents,
    currency: 'USD',
    status: 'pending',
    paymentStatus: 'pending',
    couponId: coupon ? coupon.id : null,
  });

  for (const item of cartItems) {
    const unitPrice = item.variant
      ? item.variant.priceCents ?? item.product.priceCents
      : item.product.priceCents;
    await models.OrderItem.create({
      orderId: order.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      sku: item.variant ? item.variant.sku : item.product.sku,
      unitPriceCents: unitPrice,
      quantity: item.quantity,
      totalCents: unitPrice * item.quantity,
    });
  }

  await paymentService.charge({ order, method: paymentMethod || 'card' });

  for (const item of cartItems) {
    const inventory = await inventoryFor(item);
    if (inventory) {
      inventory.quantity -= item.quantity;
      await inventory.save();
    }
  }

  if (coupon) {
    await couponService.redeem(coupon, userId, order.id);
  }

  await models.CartItem.destroy({ where: { cartId: cart.id } });
  cart.status = 'checked_out';
  await cart.save();

  const user = await models.User.findByPk(userId);
  await notificationService.create(userId, {
    type: 'order_placed',
    title: 'Order confirmed',
    body: `Your order ${order.orderNumber} was placed successfully.`,
    link: `/orders/${order.orderNumber}`,
  });
  mailer.sendOrderConfirmation(user, order).catch((err) => logger.warn(`order mail failed: ${err.message}`));
  await writeAudit({
    actorUserId: userId,
    action: 'order.create',
    entityType: 'Order',
    entityId: order.id,
    after: { totalCents: order.totalCents, orderNumber: order.orderNumber },
    ip: options.ip,
  });

  return getOrderById(order.id);
}

async function listUserOrders(userId, query) {
  const { page, limit, offset } = buildPagination(query);

  const { rows, count } = await models.Order.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    offset,
    limit,
  });

  const orders = [];
  for (const order of rows) {
    const items = await models.OrderItem.findAll({ where: { orderId: order.id } });
    orders.push({ ...order.toJSON(), items });
  }

  return { rows: orders, count, page, limit };
}

async function getOrderById(orderId) {
  const order = await models.Order.findByPk(orderId, {
    include: [
      { model: models.OrderItem, as: 'items' },
      { model: models.Payment, as: 'payment' },
      { model: models.Address, as: 'address' },
      { model: models.Coupon, as: 'coupon' },
    ],
  });
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

async function getUserOrder(userId, orderId) {
  const order = await models.Order.findOne({
    where: { id: orderId, userId },
    include: [
      { model: models.OrderItem, as: 'items' },
      { model: models.Payment, as: 'payment' },
      { model: models.Address, as: 'address' },
      { model: models.Coupon, as: 'coupon' },
    ],
  });
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

async function countOrders() {
  return models.Order.count();
}

async function cancelOrder(userId, orderId) {
  const order = await models.Order.findOne({
    where: { id: orderId, userId },
    include: [{ model: models.OrderItem, as: 'items' }],
  });
  if (!order) throw ApiError.notFound('Order not found');
  if (!['pending', 'paid'].includes(order.status)) {
    throw ApiError.badRequest('This order can no longer be cancelled');
  }

  order.status = 'cancelled';
  order.paymentStatus = 'failed';
  await order.save();

  for (const item of order.items || []) {
    const inventory = await inventoryFor(item);
    if (inventory) {
      inventory.quantity += item.quantity;
      await inventory.save();
    }
  }

  await notificationService.create(userId, {
    type: 'order_cancelled',
    title: 'Order cancelled',
    body: `Order ${order.orderNumber} was cancelled.`,
    link: `/orders/${order.orderNumber}`,
  });

  return order;
}

async function listAllOrders(query) {
  const { page, limit, offset } = buildPagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.userId) where.userId = query.userId;

  const { rows, count } = await models.Order.findAndCountAll({
    where,
    include: [{ model: models.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['createdAt', 'DESC']],
    offset,
    limit,
    distinct: true,
  });
  return { rows, count, page, limit };
}

async function updateOrderStatus(orderId, status, options = {}) {
  const allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!allowed.includes(status)) throw ApiError.badRequest(`Invalid order status: ${status}`);

  const order = await models.Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const before = order.status;
  order.status = status;
  if (status === 'refunded') order.paymentStatus = 'refunded';
  await order.save();

  await writeAudit({
    actorUserId: options.actorId,
    action: 'order.update_status',
    entityType: 'Order',
    entityId: order.id,
    before: { status: before },
    after: { status: order.status },
    ip: options.ip,
  });

  return order;
}

module.exports = {
  createOrder,
  listUserOrders,
  getOrderById,
  getUserOrder,
  cancelOrder,
  listAllOrders,
  updateOrderStatus,
  countOrders,
};
