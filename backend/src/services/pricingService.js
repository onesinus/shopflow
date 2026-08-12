const SHIPPING_THRESHOLD_CENTS = 5000;
const US_SHIPPING_CENTS = 599;
const INT_SHIPPING_CENTS = 1499;
const TAX_RATE = 0.0825;

function shippingFor(subtotalCents, country) {
  if (subtotalCents >= SHIPPING_THRESHOLD_CENTS) return 0;
  return country === 'US' ? US_SHIPPING_CENTS : INT_SHIPPING_CENTS;
}

function taxFor(subtotalCents) {
  return Math.round(subtotalCents * TAX_RATE);
}

function discountFor(subtotalCents, coupon) {
  if (!coupon) return 0;
  if (coupon.discountType === 'percent') {
    return Math.floor((subtotalCents * coupon.discountValue) / 100);
  }
  return Math.min(coupon.discountValue, subtotalCents);
}

function calculateTotals({ subtotalCents, country = 'US', coupon = null }) {
  const shippingCents = shippingFor(subtotalCents, country);
  const taxCents = taxFor(subtotalCents);
  const discountCents = discountFor(subtotalCents, coupon);
  const totalCents = Math.max(subtotalCents - discountCents + shippingCents + taxCents, 0);

  return { subtotalCents, shippingCents, taxCents, discountCents, totalCents };
}

module.exports = {
  calculateTotals,
  shippingFor,
  taxFor,
  discountFor,
  SHIPPING_THRESHOLD_CENTS,
  TAX_RATE,
};
