import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KanbanCard } from '../../components/KanbanCard';
import { renderWithProviders } from '../test-utils/renderWithProviders';

const sampleTask = {
  id: 't1',
  title: 'Sample Task',
  description: 'desc',
  priority: 'high',
  status: 'pending',
  createdBy: 'user-123'
} as any;

test('KanbanCard shows edit for creator and delete for admin', () => {
  // as the creator (team)
  const { ui: ui1 } = renderWithProviders(<KanbanCard task={sampleTask} />, { 
    user: { uid: 'user-123' }, 
    role: { role: 'team', tags: [] } 
  });
  const view1 = render(ui1);
  expect(view1.getByText(/Sample Task/)).toBeInTheDocument();
  expect(view1.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
  // delete should not be shown for team
  expect(view1.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();

  // as admin
  const { ui: ui2 } = renderWithProviders(<KanbanCard task={sampleTask} />, { 
    user: { uid: 'someone-else' }, 
    role: { role: 'admin', tags: [] } 
  });
  const view2 = render(ui2);
  expect(view2.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
});