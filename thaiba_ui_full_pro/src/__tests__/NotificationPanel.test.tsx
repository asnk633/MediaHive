import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import NotificationPanel from '../components/NotificationPanel';

const notifs = [
  { id: 'n1', title: 'Hello', body: 'World', readBy: [] }
];

test('NotificationPanel lists notifications and shows delete for admin', () => {
  // as guest: no delete
  render(<NotificationPanel open={true} onClose={() => { }} />, { notifications: notifs, user: { uid: 'u1' }, role: { role: 'guest' } });
  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(screen.queryByText(/Delete/i)).not.toBeInTheDocument();

  // as admin: delete present
  render(<NotificationPanel open={true} onClose={() => { }} />, { notifications: notifs, user: { uid: 'u1' }, role: { role: 'admin' } });
  expect(screen.getByText(/Delete/i)).toBeInTheDocument();
});
