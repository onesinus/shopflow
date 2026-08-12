import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isStaff, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

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
          {isAuthenticated && itemCount > 0 && <span className="badge badge-cart">{itemCount}</span>}
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
