import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationPanel } from '../../components/NotificationPanel';
import { renderWithProviders } from '../test-utils/renderWithProviders';

const notifs = [
  { id: 'n1', title: 'Hello', body: 'World', readBy: [] }
];

test('NotificationPanel lists notifications and shows delete for admin', () => {
  // as guest: no delete
  const { ui: ui1 } = renderWithProviders(<NotificationPanel />, { 
    notifications: notifs, 
    user: { uid: 'u1' }, 
    role: { role: 'guest' } 
  });
  const view1 = render(ui1);
  expect(view1.getByText('Hello')).toBeInTheDocument();
  expect(view1.queryByText(/Delete/i)).not.toBeInTheDocument();

  // as admin: delete present
  const { ui: ui2 } = renderWithProviders(<NotificationPanel />, { 
    notifications: notifs, 
    user: { uid: 'u1' }, 
    role: { role: 'admin' } 
  });
  const view2 = render(ui2);
  expect(view2.getByText(/Delete/i)).toBeInTheDocument();
});