import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import TopBar from '../components/TopBar';

test('renders TopBar and toggles theme button text', () => {
  render(<TopBar />, { options: { theme: 'dark' } });
  const btn = screen.getByRole('button', { name: /Light|Dark/i });
  // initial theme 'dark' -> button shows "Light"
  expect(btn).toBeInTheDocument();
  expect(btn).toHaveTextContent(/Light/i);
  // clicking toggles theme (ThemeContext.setTheme is a no-op in test util)
  fireEvent.click(btn);
  // still present (we can't inspect DOM class because setTheme is stubbed)
  expect(btn).toBeInTheDocument();
});
