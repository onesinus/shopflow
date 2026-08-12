import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api/cart';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [itemCount, setItemCount] = useState(0);

  const refresh = useCallback(() => {
    if (!isAuthenticated) {
      setItemCount(0);
      return;
    }
    cartApi
      .get()
      .then((cart) => {
        const count =
          typeof cart.itemCount === 'number'
            ? cart.itemCount
            : (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);
        setItemCount(count);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ itemCount, refresh }), [itemCount, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}