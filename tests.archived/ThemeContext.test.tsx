import React from 'react';
import { render } from '../test-utils';
import { useTheme } from '../context/ThemeContext';
import { screen } from '@testing-library/react';

function Consumer() {
  const { theme } = useTheme();
  return <div data-testid="theme">{theme}</div>;
}

test('ThemeContext provides theme value', () => {
  render(<Consumer />, { theme: 'light' });
  expect(screen.getByTestId('theme')).toHaveTextContent('light');
});
