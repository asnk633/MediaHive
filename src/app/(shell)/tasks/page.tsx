"use client";
import React, { useEffect, useState } from "react";
import { Plus, LayoutGrid, List as ListIcon, Database } from "lucide-react";
import { Task } from "@/types/task";
import { TaskService } from "@/services/tasks";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { useRole } from "@/app/(shell)/RoleContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);
  const { user } = useRole();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = TaskService.subscribeToTasks((fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSeedData = async () => {
    try {
      await TaskService.seedDummyTasks();
      alert('Dummy tasks seeded!');
    } catch (e) {
      console.error(e);
      alert('Failed to seed data');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] px-4 pt-20 gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage, track, and organize your work.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Kanban Board"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="List View"
            >
              <ListIcon size={18} />
            </button>
          </div>

          {/* Dev Tools - Seeed Data */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleSeedData}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
              title="Seed Dummy Data (Dev Only)"
            >
              <Database size={14} />
              Seed Data
            </button>
          )}

          {/* Add Task Button (Mobile users have FAB) */}
          <Link href="/tasks/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm font-semibold">
              <Plus size={18} />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            {viewMode === 'kanban' ? (
              <KanbanBoard tasks={tasks} onTaskClick={(t) => console.log('Clicked', t)} />
            ) : (
              <TaskListView tasks={tasks} onTaskClick={(t) => console.log('Clicked', t)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}