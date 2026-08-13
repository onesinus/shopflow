import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import Price from '../components/Price';
import Spinner from '../components/Spinner';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { refresh: refreshCart } = useCart();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    cartApi
      .get()
      .then((c) => {
        setCart(c);
        refreshCart();
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [isAuthenticated, refreshCart]);

  const changeQty = async (item, qty) => {
    if (qty < 1) return;
    try {
      await cartApi.updateItem(item.id, qty);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const remove = async (itemId) => {
    try {
      await cartApi.removeItem(itemId);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) return <Spinner />;

  if (!isAuthenticated) {
    return (
      <div className="container container-narrow">
        <div className="card">
          <h1>Your cart</h1>
          <p className="muted">Sign in to view your cart.</p>
          <Link to="/login" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="container">
      <h1>Your cart</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {!items.length ? (
        <div className="card">
          <p className="muted">Your cart is empty.</p>
          <Link to="/" className="btn btn-primary">
            Browse the catalog
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {items.map((item) => (
              <div className="cart-line" key={item.id}>
                <div className="cart-line-info">
                  <strong>{item.product?.name}</strong>
                  {item.variant && <span className="muted">{item.variant.name}</span>}
                  <Price cents={item.unitPriceCents} />
                  {item.stock !== undefined && <span className="muted">Stock: {item.stock}</span>}
                </div>
                <div className="cart-line-qty">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => changeQty(item, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => changeQty(item, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    +
                  </button>
                </div>
                <Price cents={item.unitPriceCents * item.quantity} className="cart-line-total" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(item.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <aside className="cart-summary card">
            <h2>Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <Price cents={cart.subtotalCents} />
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <Price cents={cart.shippingCents} />
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <Price cents={cart.taxCents} />
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <Price cents={cart.totalCents} />
            </div>
            <Link to="/checkout" className="btn btn-primary btn-block">
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
