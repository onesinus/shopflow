import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProductPage from '../ProductPage';
import { renderWithProviders } from '../../test/utils';
import { ApiError } from '../../api/client';

vi.mock('../../api/products', () => ({
  productsApi: {
    list: vi.fn(),
    get: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

vi.mock('../../api/cart', () => ({
  cartApi: { addItem: vi.fn(), get: vi.fn(), updateItem: vi.fn(), removeItem: vi.fn() },
  wishlistApi: { add: vi.fn(), remove: vi.fn(), list: vi.fn() },
}));

import { productsApi } from '../../api/products';

const product = {
  id: 1,
  name: 'Cozy Socks',
  sku: 'SOCKS-1',
  priceCents: 1999,
  stock: 10,
  categoryId: null,
  variants: [],
  description: 'Warm socks for cold days.',
};

describe('ProductPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the product name and formatted price', async () => {
    productsApi.getBySlug.mockResolvedValue(product);

    renderWithProviders(<ProductPage />, { route: '/products/cozy-socks' });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Cozy Socks' })).toBeInTheDocument();
    });
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('shows an error state when the product is not found', async () => {
    productsApi.getBySlug.mockRejectedValue(new ApiError(404, 'Product not found'));

    renderWithProviders(<ProductPage />, { route: '/products/nope' });

    await waitFor(() => {
      expect(screen.getByText('Product not found')).toBeInTheDocument();
    });
  });
});