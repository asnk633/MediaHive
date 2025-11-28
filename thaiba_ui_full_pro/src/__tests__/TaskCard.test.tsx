import React from 'react';
import { render, screen, fireEvent } from '../test-utils';
import TaskCard from '../components/TaskCard';

const sampleTask = {
  id: 't1',
  title: 'Sample Task',
  description: 'desc',
  priority: 'high',
  createdBy: 'user-123'
};

test('TaskCard shows edit for creator and delete for admin', () => {
  // as the creator (team)
  render(<TaskCard task={sampleTask} />, { user: { uid: 'user-123' }, role: { role: 'team', tags: [] } });
  expect(screen.getByText(/Sample Task/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
  // delete should not be shown for team
  expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();

  // as admin
  render(<TaskCard task={sampleTask} />, { user: { uid: 'someone-else' }, role: { role: 'admin', tags: [] } });
  expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
});
