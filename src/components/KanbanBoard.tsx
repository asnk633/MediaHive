// src/components/KanbanBoard.tsx
// Main Kanban board component

'use client';

import React, { useState, useEffect } from 'react';
import { KanbanColumn } from '@/components/KanbanColumn';
import { useKanbanRealtime } from '../hooks/useKanbanRealtime';
import { Task } from '@/types';

interface KanbanBoardProps {
  initialTasks: {
    todo: Task[];
    in_progress: Task[];
    on_hold: Task[];
    done: Task[];
  };
  counts: {
    todo: number;
    in_progress: number;
    on_hold: number;
    done: number;
  };
}

export function KanbanBoard({ initialTasks, counts }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [taskCounts, setTaskCounts] = useState(counts);
  
  // Subscribe to realtime updates
  useKanbanRealtime((update: any) => {
    if (update.type === 'taskMoved') {
      // Handle task moved between columns
      setTasks(prev => {
        const newTasks = { ...prev };
        
        // Remove task from old column
        Object.keys(newTasks).forEach(column => {
          newTasks[column as keyof typeof newTasks] = newTasks[column as keyof typeof newTasks].filter(
            task => task.id !== update.task.id
          );
        });
        
        // Add task to new column
        if (newTasks.hasOwnProperty(update.newStatus)) {
          newTasks[update.newStatus as keyof typeof newTasks].push(update.task);
        }
        
        return newTasks;
      });
      
      // Update counts
      setTaskCounts(prev => {
        const newCounts = { ...prev };
        // Decrement count in old column
        if (newCounts.hasOwnProperty(update.oldStatus)) {
          newCounts[update.oldStatus as keyof typeof newCounts] -= 1;
        }
        // Increment count in new column
        if (newCounts.hasOwnProperty(update.newStatus)) {
          newCounts[update.newStatus as keyof typeof newCounts] += 1;
        }
        return newCounts;
      });
    } else if (update.type === 'taskUpdated') {
      // Handle task updated
      setTasks(prev => {
        const newTasks = { ...prev };
        
        // Find and update the task in all columns
        Object.keys(newTasks).forEach(column => {
          newTasks[column as keyof typeof newTasks] = newTasks[column as keyof typeof newTasks].map(
            task => task.id === update.task.id ? update.task : task
          );
        });
        
        return newTasks;
      });
    } else if (update.type === 'newTask') {
      // Handle new task
      setTasks(prev => {
        const newTasks = { ...prev };
        if (newTasks.hasOwnProperty(update.task.status)) {
          newTasks[update.task.status as keyof typeof newTasks].push(update.task);
        }
        return newTasks;
      });
      
      // Update counts
      setTaskCounts(prev => {
        const newCounts = { ...prev };
        if (newCounts.hasOwnProperty(update.task.status)) {
          newCounts[update.task.status as keyof typeof newCounts] += 1;
        }
        return newCounts;
      });
    }
  });

  return (
    <div className="kanban-board">
      <div className="kanban-columns">
        <KanbanColumn 
          title="To Do" 
          status="todo" 
          tasks={tasks.todo} 
          count={taskCounts.todo}
        />
        <KanbanColumn 
          title="In Progress" 
          status="in_progress" 
          tasks={tasks.in_progress} 
          count={taskCounts.in_progress}
        />
        <KanbanColumn 
          title="On Hold" 
          status="on_hold" 
          tasks={tasks.on_hold} 
          count={taskCounts.on_hold}
        />
        <KanbanColumn 
          title="Done" 
          status="done" 
          tasks={tasks.done} 
          count={taskCounts.done}
        />
      </div>
    </div>
  );
}