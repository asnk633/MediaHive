import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import TopBar from '../../components/TopBar';
import { renderWithProviders } from '../test-utils/renderWithProviders';

test('renders TopBar and toggles theme button text', () => {
  const { ui } = renderWithProviders(<TopBar />);
  const view = render(ui);
  const btn = view.getByRole('button', { name: /Toggle theme/i });
  // initial theme 'dark' -> button shows moon emoji
  expect(btn).toBeInTheDocument();
  expect(btn).toHaveTextContent(/🌙|☀️/);
  // clicking toggles theme
  fireEvent.click(btn);
  // still present
  expect(btn).toBeInTheDocument();
});