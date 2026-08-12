import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { renderWithProviders } from '../../test/utils';
import { ApiError } from '../../api/client';

vi.mock('../../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    saveUser: vi.fn(),
    get currentUser() {
      return null;
    },
  },
}));

import { authApi } from '../../api/auth';

async function submitLogin(email = 'customer@shopflow.test', password = 'Password123!') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  return user;
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the sign-in form', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('surfaces the ApiError message when login fails', async () => {
    authApi.login.mockRejectedValue(new ApiError(401, 'Invalid email or password'));
    renderWithProviders(<LoginPage />, { route: '/login' });

    await submitLogin();
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('navigates to the home page after a successful login', async () => {
    authApi.login.mockResolvedValue({ id: 1, firstName: 'Test', lastName: 'User', role: 'customer' });
    const routes = (
      <>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Shop the everyday essentials</div>} />
      </>
    );
    renderWithProviders(null, { route: '/login', routes });

    await submitLogin();
    await waitFor(() => {
      expect(screen.getByText('Shop the everyday essentials')).toBeInTheDocument();
    });
  });
});