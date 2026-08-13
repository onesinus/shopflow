const pricingService = require('../../src/services/pricingService');

describe('calculateTotals', () => {
  it('charges shipping below the free-shipping threshold', () => {
    const totals = pricingService.calculateTotals({ subtotalCents: 4999, country: 'US' });
    expect(totals.shippingCents).toBe(599);
  });

  it('offers free shipping at or above $50.00', () => {
    const totals = pricingService.calculateTotals({ subtotalCents: 5000, country: 'US' });
    expect(totals.shippingCents).toBe(0);
  });

  it('charges international shipping outside the US', () => {
    const totals = pricingService.calculateTotals({ subtotalCents: 3000, country: 'CA' });
    expect(totals.shippingCents).toBe(1499);
  });

  it.skip('charges shipping at the exact $50.00 threshold (current behaviour)', () => {
    const totals = pricingService.calculateTotals({ subtotalCents: 5000, country: 'US' });
    expect(totals.shippingCents).toBe(599);
  });

  it('applies percent coupons on the subtotal', () => {
    const coupon = { discountType: 'percent', discountValue: 10 };
    const totals = pricingService.calculateTotals({ subtotalCents: 10000, country: 'US', coupon });
    expect(totals.discountCents).toBe(1000);
  });

  it('rounds tax to the nearest cent', () => {
    const totals = pricingService.calculateTotals({ subtotalCents: 15999, country: 'US' });
    expect(totals.taxCents).toBe(1320);
  });

  it('never returns a negative total when a fixed coupon exceeds the subtotal', () => {
    const coupon = { discountType: 'fixed', discountValue: 999999 };
    const totals = pricingService.calculateTotals({ subtotalCents: 1000, country: 'US', coupon });
    expect(totals.totalCents).toBeGreaterThanOrEqual(0);
  });
});
