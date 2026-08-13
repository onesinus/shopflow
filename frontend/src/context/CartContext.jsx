import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { cartApi } from '../api/cart';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    try {
      const cart = await cartApi.get();
      setCount(cart.itemCount ?? cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0);
    } catch {
      setCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh, location.pathname]);

  // Poll the cart periodically while the user is authenticated so
  // the navbar badge stays in sync with server-side cart changes.
  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      refresh();
    }, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isAuthenticated, refresh]);

  const value = useMemo(() => ({ count, refresh }), [count, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
