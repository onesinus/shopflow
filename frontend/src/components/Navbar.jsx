import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cartApi, CART_UPDATED_EVENT } from '../api/cart';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isStaff, logout } = useAuth();
  const [cart, setCart] = useState(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `nav-link${isActive ? ' active' : ''}`;

  const cartItemCount = cart?.items
    ? cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    : 0;

  useEffect(() => {
    let active = true;

    const loadCartCount = () => {
      cartApi
        .get()
        .then((result) => {
          if (!active) return;
          setCart(result);
        })
        .catch(() => {
          if (!active) return;
          setCart(null);
        });
    };

    if (isAuthenticated) {
      loadCartCount();
      window.addEventListener(CART_UPDATED_EVENT, loadCartCount);
    } else {
      setCart(null);
    }

    return () => {
      active = false;
      window.removeEventListener(CART_UPDATED_EVENT, loadCartCount);
    };
  }, [isAuthenticated]);

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">S</span> ShopFlow
      </Link>
      <nav className="nav-links">
        <NavLink to="/" className={linkClass} end>
          Catalog
        </NavLink>
        
        {/* Cart Link with Live Badge */}
        <NavLink to="/cart" className={linkClass}>
          Cart
          {isAuthenticated && cartItemCount > 0 && (
            <span className="cart-badge">
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
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
