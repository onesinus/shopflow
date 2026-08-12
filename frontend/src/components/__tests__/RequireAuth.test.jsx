import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import RequireAuth from '../RequireAuth';
import { renderWithProviders, seedLocalUser } from '../../test/utils';

const routes = (
  <>
    <Route path="/login" element={<div>Sign in to continue</div>} />
    <Route
      path="/account"
      element={
        <RequireAuth>
          <div>Your account</div>
        </RequireAuth>
      }
    />
  </>
);

describe('RequireAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects unauthenticated users to the login page', () => {
    renderWithProviders(null, { route: '/account', routes });
    expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
    seedLocalUser({ id: 1, firstName: 'Test', lastName: 'User', role: 'customer' });
    renderWithProviders(null, { route: '/account', routes });
    expect(screen.getByText('Your account')).toBeInTheDocument();
  });
});