import { api } from './client';

export const CART_UPDATED_EVENT = 'shopflow:cart-updated';

export function dispatchCartUpdated() {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export const cartApi = {
  get() {
    return api.get('/cart', { auth: true });
  },
  addItem(productId, quantity = 1, variantId) {
    return api.post('/cart/items', { productId, quantity, variantId }, { auth: true });
  },
  updateItem(itemId, quantity) {
    return api.patch(`/cart/items/${itemId}`, { quantity }, { auth: true });
  },
  removeItem(itemId) {
    return api.delete(`/cart/items/${itemId}`, { auth: true });
  },
};

export const wishlistApi = {
  list() {
    return api.get('/wishlist', { auth: true });
  },
  add(productId) {
    return api.post(`/wishlist/${productId}`, {}, { auth: true });
  },
  remove(productId) {
    return api.delete(`/wishlist/${productId}`, { auth: true });
  },
};
