const { Op, literal } = require('sequelize');
const { models } = require('../models');
const ApiError = require('../utils/ApiError');
const { toDollars } = require('../utils/money');

async function findByCode(code) {
  return models.Coupon.findOne({ where: { code: String(code).toUpperCase() } });
}

async function validateCoupon({ code, subtotalCents, userId }) {
  const coupon = await findByCode(code);
  if (!coupon) throw ApiError.badRequest('Invalid coupon code');
  if (!coupon.isActive) throw ApiError.badRequest('This coupon is not currently active');

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    throw ApiError.badRequest('This coupon has expired');
  }

  if (subtotalCents < coupon.minSubtotalCents) {
    throw ApiError.badRequest(`Add at least $${toDollars(coupon.minSubtotalCents)} to use this coupon`);
  }

  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }

  return coupon;
}

async function redeem(coupon, userId, orderId, transaction) {
  const where = {
    id: coupon.id,
    isActive: true,
  };

  if (coupon.maxUses !== null) {
    where.usesCount = {
      [Op.lt]: coupon.maxUses,
    };
  }

  const [updated] = await models.Coupon.update(
    {
      usesCount: literal('"uses_count" + 1'),
    },
    {
      where,
      transaction,
    }
  );

  if (updated !== 1) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }

  await models.CouponRedemption.create(
    {
      couponId: coupon.id,
      userId,
      orderId,
    },
    { transaction }
  );
}

module.exports = { findByCode, validateCoupon, redeem };
