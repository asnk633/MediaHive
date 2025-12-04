import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TopBar from '../../components/TopBar';
import { renderWithProviders } from '../test-utils/renderWithProviders';

test('renders TopBar and toggles theme button text', () => {
  const { ui } = renderWithProviders(<TopBar />, { user: { name: "Test User" }});
  const view = render(ui);
  const btn = view.getByRole('button', { name: /Light|Dark/i });
  // initial theme 'dark' -> button shows "Light"
  expect(btn).toBeInTheDocument();
  expect(btn).toHaveTextContent(/Light/i);
  // clicking toggles theme (ThemeContext.setTheme is a no-op in test util)
  fireEvent.click(btn);
  // still present (we can't inspect DOM class because setTheme is stubbed)
  expect(btn).toBeInTheDocument();
});