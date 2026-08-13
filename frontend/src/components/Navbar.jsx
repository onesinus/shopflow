import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isStaff, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const refreshCartCount = async () => {
      if (!isAuthenticated) {
        setCartCount(0);
        return;
      }

      try {
        const cart = await cartApi.get();
        const count = Array.isArray(cart?.items)
          ? cart.items.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
          : 0;
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    refreshCartCount();

    const handleCartUpdated = () => refreshCartCount();
    window.addEventListener('cart:updated', handleCartUpdated);

    return () => {
      window.removeEventListener('cart:updated', handleCartUpdated);
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `nav-link${isActive ? ' active' : ''}`;

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">S</span> ShopFlow
      </Link>
      <nav className="nav-links">
        <NavLink to="/" className={linkClass} end>
          Catalog
        </NavLink>
        <NavLink to="/cart" className={linkClass}>
          Cart
          {isAuthenticated && count > 0 && <span className="cart-badge">{count}</span>}
        </NavLink>
        {isAuthenticated && (
          <NavLink to="/orders" className={linkClass}>
            Orders
          </NavLink>
        )}
        {isStaff && (
          <NavLink to="/admin" className={linkClass}>
            Admin
          </NavLink>
        )}
      </nav>
      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <span className="nav-user">
              {user.firstName} {user.lastName}
              {isAdmin && <span className="badge badge-admin">admin</span>}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Create account
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
