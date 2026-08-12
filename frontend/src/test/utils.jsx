import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';

export function renderWithProviders(ui, { route = '/', routes } = {}) {
  const content = routes ? <Routes>{routes}</Routes> : ui;

  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <AuthProvider>{content}</AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

export function seedLocalUser(user) {
  localStorage.setItem('shopflow_user', JSON.stringify(user));
}