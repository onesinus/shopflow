import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import CartPage from '../CartPage';
import Navbar from '../../components/Navbar';
import { renderWithProviders, seedLocalUser } from '../../test/utils';

vi.mock('../../api/cart', () => ({
  cartApi: {
    get: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
  },
  wishlistApi: { add: vi.fn(), remove: vi.fn(), list: vi.fn() },
}));

import { cartApi } from '../../api/cart';

const cart = {
  items: [
    { id: 1, product: { name: 'Ceramic Mug' }, variant: null, unitPriceCents: 1200, quantity: 2 },
  ],
  subtotalCents: 2400,
  shippingCents: 599,
  taxCents: 198,
  totalCents: 3197,
};

describe('CartPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the line item and cart totals for an authenticated user', async () => {
    seedLocalUser({ id: 1, firstName: 'Test', lastName: 'User', role: 'customer' });
    cartApi.get.mockResolvedValue(cart);

    renderWithProviders(<CartPage />, { route: '/cart' });

    await waitFor(() => {
      expect(screen.getByText('Ceramic Mug')).toBeInTheDocument();
    });
    expect(screen.getByText('$31.97')).toBeInTheDocument();
  });
});

describe('Navbar cart link', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows the cart link for guests', () => {
    renderWithProviders(<Navbar />, { route: '/' });
    expect(screen.getByRole('link', { name: 'Cart' })).toBeInTheDocument();
  });
});