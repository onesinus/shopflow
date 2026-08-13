const { models } = require('../models');
const ApiError = require('../utils/ApiError');
const pricingService = require('./pricingService');

async function getOrCreateCart(userId) {
  let cart = await models.Cart.findOne({ where: { userId, status: 'active' } });
  if (!cart) {
    cart = await models.Cart.findOne({ where: { userId } });
    if (cart) {
      cart.status = 'active';
      await cart.save();
      return cart;
    }
    cart = await models.Cart.create({ userId, status: 'active' });
  }
  return cart;
}

async function stockFor({ productId, variantId }) {
  const where = variantId ? { variantId } : { productId, variantId: null };
  const inventory = await models.Inventory.findOne({ where });
  return inventory ? inventory.quantity : 0;
}

function buildTotals(items) {
  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const totals = pricingService.calculateTotals({ subtotalCents });
  return { ...totals, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  const items = await models.CartItem.findAll({
    where: { cartId: cart.id },
    include: [
      { model: models.Product, as: 'product' },
      { model: models.ProductVariant, as: 'variant' },
    ],
    order: [['createdAt', 'DESC']],
  });

  const enriched = await Promise.all(
    items.map(async (item) => {
      const stock = await stockFor({ productId: item.productId, variantId: item.variantId });
      return { ...item.toJSON(), stock };
    })
  );

  return { ...cart.toJSON(), items: enriched, ...buildTotals(items) };
}

async function addItem(userId, { productId, variantId, quantity }) {
  const qty = Math.max(parseInt(quantity, 10) || 1, 1);

  const product = await models.Product.findByPk(productId);
  if (!product || !product.isActive) throw ApiError.badRequest('Product not available');

  let unitPrice = product.priceCents;
  let variant = null;
  if (variantId) {
    variant = await models.ProductVariant.findOne({ where: { id: variantId, productId } });
    if (!variant) throw ApiError.badRequest('Invalid variant');
    unitPrice = variant.priceCents !== null ? variant.priceCents : product.priceCents;
  }

  const stock = await stockFor({ productId, variantId });
  if (qty > stock) throw ApiError.unprocessable(`Only ${stock} units in stock`);

  const cart = await getOrCreateCart(userId);

  const variantIdValue = variantId || null;

 const [item, created] = await models.CartItem.findOrCreate({
      where: { cartId: cart.id, productId, variantId: variantIdValue },
      defaults: {
        quantity: qty,
        unitPriceCents: unitPrice,
      },
    });
    if (!created) {
      await item.increment('quantity', { by: qty });
    }

  return getCart(userId);
}

async function updateItem(userId, itemId, quantity) {
  const qty = Math.max(parseInt(quantity, 10) || 1, 1);
  const cart = await getOrCreateCart(userId);

  const item = await models.CartItem.findOne({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw ApiError.notFound('Cart item not found');

  const stock = await stockFor({ productId: item.productId, variantId: item.variantId });
  if (qty > stock) throw ApiError.unprocessable(`Only ${stock} units in stock`);

  item.quantity = qty;
  await item.save();
  return getCart(userId);
}

async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  const item = await models.CartItem.findOne({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw ApiError.notFound('Cart item not found');
  await item.destroy();
  return getCart(userId);
}

module.exports = { getCart, addItem, updateItem, removeItem };
