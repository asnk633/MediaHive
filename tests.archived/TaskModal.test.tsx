import React from 'react';
import { render, screen } from '../test-utils';
import TaskModal from '../components/TaskModal';
import userEvent from '@testing-library/user-event';

test('TaskModal renders and has Save and Cancel', async () => {
  render(<TaskModal open={true} onClose={() => {}} edit={null} />, {});
  expect(screen.getByText(/New Task|Edit Task/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
});
