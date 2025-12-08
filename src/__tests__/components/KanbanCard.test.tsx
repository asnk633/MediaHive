import React from 'react';
import { render } from '@testing-library/react';
import { KanbanCard } from '../../components/KanbanCard';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import type { Task } from '../../types';

// Simplified minimal task object
const sampleTask: Partial<Task> = {
  id: 1,
  title: 'Sample Task',
  status: 'pending',
  priority: 'high',
  createdById: 123
};

test('KanbanCard renders task details', () => {
  const { ui } = renderWithProviders(<KanbanCard task={sampleTask as Task} />);
  const view = render(ui);
  expect(view.getByText(/Sample Task/)).toBeInTheDocument();
  expect(view.getByText(/high/)).toBeInTheDocument();
});