import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { ordersApi, addressApi, couponsApi } from '../api/orders';
import { useToast } from '../context/ToastContext';
import Price, { formatCents } from '../components/Price';
import Spinner from '../components/Spinner';

export default function CheckoutPage() {
  const { toast } = useToast();
  const { refresh: refreshCart } = useCart();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([cartApi.get(), addressApi.list().catch(() => [])])
      .then(([c, a]) => {
        setCart(c);
        setAddresses(a);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const [form, setForm] = useState({
    addressId: '',
    firstName: '',
    lastName: '',
    line1: '',
    city: '',
    country: 'US',
    paymentMethod: 'card',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validateCoupon = async () => {
    try {
      const result = await couponsApi.validate(couponCode, cart.subtotalCents);
      setCoupon(result);
      toast('Coupon applied', 'success');
    } catch (err) {
      setCoupon(null);
      toast(err.message, 'error');
    }
  };

  const displayCart = useMemo(() => {
    if (!cart || !coupon) return cart;
    const discountCents =
      coupon.discountType === 'percent'
        ? Math.floor((cart.subtotalCents * coupon.discountValue) / 100)
        : Math.min(coupon.discountValue, cart.subtotalCents);
    return {
      ...cart,
      discountCents,
      totalCents: Math.max(cart.subtotalCents - discountCents + cart.shippingCents + cart.taxCents, 0),
    };
  }, [cart, coupon]);

  const placeOrder = async () => {
    let addressId = Number(form.addressId);
    if (!addressId) {
      const created = await addressApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        line1: form.line1,
        city: form.city,
        country: form.country,
      });
      addressId = created.id;
    }

    setPlacing(true);
    setError(null);
    try {
      const order = await ordersApi.create({
        addressId,
        paymentMethod: form.paymentMethod,
        couponCode: couponCode || undefined,
      });
      toast('Order placed', 'success');
      refreshCart();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Spinner />;
  if (!cart?.items?.length) {
    return (
      <div className="container container-narrow">
        <div className="card">
          <p className="muted">Your cart is empty — nothing to check out.</p>
        </div>
      </div>
    );
  }

  const discountCents = coupon
    ? coupon.discountType === 'percent'
      ? Math.floor((cart.subtotalCents * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, cart.subtotalCents)
    : 0;
  const totalCents = Math.max(cart.subtotalCents - discountCents + cart.shippingCents + cart.taxCents, 0);

  return (
    <div className="container">
      <h1>Checkout</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="cart-layout">
        <div className="card">
          <h2>Shipping address</h2>
          {addresses.length > 0 && (
            <div className="address-picker">
              <select className="select" value={form.addressId} onChange={set('addressId')}>
                <option value="">Use a new address</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.firstName} {a.lastName} — {a.line1}, {a.city} ({a.country})
                  </option>
                ))}
              </select>
            </div>
          )}
          {!form.addressId && (
            <div className="form">
              <div className="form-row">
                <label>
                  First name
                  <input required value={form.firstName} onChange={set('firstName')} />
                </label>
                <label>
                  Last name
                  <input required value={form.lastName} onChange={set('lastName')} />
                </label>
              </div>
              <label>
                Street address
                <input required value={form.line1} onChange={set('line1')} />
              </label>
              <div className="form-row">
                <label>
                  City
                  <input required value={form.city} onChange={set('city')} />
                </label>
                <label>
                  Country
                  <select className="select" value={form.country} onChange={set('country')}>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          <h2>Payment method</h2>
          <div className="form">
            <label>
              <select className="select" value={form.paymentMethod} onChange={set('paymentMethod')}>
                <option value="card">Credit card (simulated)</option>
                <option value="paypal">PayPal (simulated)</option>
                <option value="klarna">Klarna (simulated)</option>
              </select>
            </label>
          </div>

          <h2>Coupon</h2>
          <div className="coupon-row">
            <input
              className="search-input"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button type="button" className="btn btn-outline" onClick={validateCoupon}>
              Apply
            </button>
          </div>
          {coupon && <p className="muted">Applied: {coupon.description || coupon.code}</p>}
        </div>

        <aside className="cart-summary card">
          <h2>Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <Price cents={displayCart.subtotalCents} />
          </div>
          {coupon && (
            <div className="summary-row">
              <span>Discount</span>
              <span className="discount">−{formatCents(displayCart.discountCents)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Shipping</span>
            <Price cents={displayCart.shippingCents} />
          </div>
          <div className="summary-row">
            <span>Tax</span>
            <Price cents={displayCart.taxCents} />
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <Price cents={displayCart.totalCents} />
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={placeOrder} disabled={placing}>
            {placing ? 'Placing order…' : 'Place order'}
          </button>
        </aside>
      </div>
    </div>
  );
}
