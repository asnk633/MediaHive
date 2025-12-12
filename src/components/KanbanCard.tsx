// src/components/KanbanCard.tsx
// Kanban card component

'use client';

import React from 'react';
import { Task } from '@/types';
import { PresenceDot } from '@/components/PresenceDot';
import { formatDateOnly } from '@/lib/dateUtils';

interface KanbanCardProps {
  task: Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
  return (
    <div
      className="kanban-card glass-card card-padding"
      data-testid={`kanban-card-${task.id}`}
      data-task-id={task.id}
      data-status={task.status}
      data-priority={task.priority}
    >
      <div className="kanban-card-header">
        <h4 className="kanban-card-title section-title">{task.title}</h4>
        {task.assignedToId && (
          <PresenceDot userId={task.assignedToId} />
        )}
      </div>
      {task.description && (
        <p className="kanban-card-description mt-2 text-sm text-[var(--muted)]">{task.description}</p>
      )}
      <div className="kanban-card-meta mt-3 flex items-center justify-between">
        {task.dueDate && (
          <span className="kanban-card-due-date text-xs text-[var(--muted)]">
            Due: {formatDateOnly(task.dueDate)}
          </span>
        )}
        {task.priority && (
          <span className={`kanban-card-priority priority-${task.priority} text-xs px-2 py-1 rounded-full`}>
            {task.priority}
          </span>
        )}
      </div>
    </div>
  );
}