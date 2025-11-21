// src/components/KanbanCard.tsx
// Kanban card component

'use client';

import React from 'react';
import { Task } from '@/types';
import { PresenceDot } from '@/components/PresenceDot';

interface KanbanCardProps {
  task: Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
  return (
    <div 
      className="kanban-card" 
      data-testid={`kanban-card-${task.id}`}
      data-task-id={task.id}
      data-status={task.status}
      data-priority={task.priority}
    >
      <div className="kanban-card-header">
        <h4 className="kanban-card-title">{task.title}</h4>
        {task.assignedToId && (
          <PresenceDot userId={task.assignedToId} />
        )}
      </div>
      {task.description && (
        <p className="kanban-card-description">{task.description}</p>
      )}
      <div className="kanban-card-meta">
        {task.dueDate && (
          <span className="kanban-card-due-date">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.priority && (
          <span className={`kanban-card-priority priority-${task.priority}`}>
            {task.priority}
          </span>
        )}
      </div>
    </div>
  );
}