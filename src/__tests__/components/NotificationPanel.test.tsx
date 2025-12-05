import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { NotificationPanel } from '../../components/NotificationPanel';
import { renderWithProviders } from '../test-utils/renderWithProviders';

// Mock the hook because it uses relative import in the component
jest.mock('../../hooks/useNotificationsRealtime', () => ({
  useNotificationsRealtime: jest.fn()
}));

// Simplified minimal notification object
const notifs = [
  {
    id: 1,
    title: 'Hello',
    body: 'World',
    readAt: null,
    createdAt: '2023-01-01T00:00:00Z'
  }
];

beforeEach(() => {
  // Mock fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ notifications: notifs, unreadCount: 1 }),
    })
  ) as jest.Mock;
});

afterEach(() => {
  // Clean up mock
  (global.fetch as jest.Mock).mockClear();
});

test('NotificationPanel lists notifications and allows marking as read', async () => {
  const { ui } = renderWithProviders(<NotificationPanel />, {
    user: { uid: 'u1' }
  });
  const view = render(ui);

  // Open panel
  const bell = view.getByTestId('notification-bell');
  fireEvent.click(bell);

  // Wait for fetch to complete and render
  await waitFor(() => {
    expect(view.getByText('Hello')).toBeInTheDocument();
  });
  expect(view.getByText('World')).toBeInTheDocument();

  // Check for "Mark as read" button
  expect(view.getByText(/Mark as read/i)).toBeInTheDocument();
});