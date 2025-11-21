// src/components/KanbanColumn.tsx
// Kanban column component

'use client';

import React from 'react';
import { Task } from '@/types';
import { KanbanCard } from '@/components/KanbanCard';

interface KanbanColumnProps {
  title: string;
  status: string;
  tasks: Task[];
  count: number;
}

export function KanbanColumn({ title, status, tasks, count }: KanbanColumnProps) {
  return (
    <div className="kanban-column" data-testid={`kanban-column-${status}`}>
      <div className="kanban-column-header">
        <h3>{title}</h3>
        <span className="task-count">({count})</span>
      </div>
      <div className="kanban-column-content">
        {tasks.map(task => (
          <KanbanCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}