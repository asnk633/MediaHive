"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from 'next/navigation';

type Task = {
  id: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  reviewStatus?: string | null;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use smaller limit for better performance
      const res = await fetch(`/api/tasks?institutionId=1&limit=50&filter=${filter}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load tasks: ${res.status} ${res.statusText}`);
      }
      
      const body = await res.json();
      setTasks(body?.data ?? []);
    } catch (err) {
      console.error("Failed to load tasks", err);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Use effect with proper dependencies
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Memoize the task list to prevent unnecessary re-renders
  const taskList = useMemo(() => tasks, [tasks]);

  // Memoize the change handler
  const handleChange = useCallback((taskId: number, value: string) => {
    setTasks((prev) => prev.map((p) => (p.id === taskId ? { ...p, reviewStatus: value } : p)));
  }, []);

  // Memoize the save function
  const saveReview = useCallback(async (task: Task) => {
    // canonical backend values expected: 'pending', 'approved', 'rejected'
    const payload = { reviewStatus: task.reviewStatus ?? "pending" };
    try {
      const res = await fetch(`/api/tasks/${task.id}/review`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip, deflate, br"
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Prefer app toast API if available. Example: toast.error(...)
        alert(`Failed to update reviewStatus: ${body?.error ?? res.statusText}`);
      } else {
        // Example: toast.success("Review status updated")
        alert("Review status updated");
      }
    } catch (err) {
      alert(`Failed to update review status: ${String(err)}`);
    }
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!taskList.length) return <div className="p-6">No tasks here.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Task Review Dashboard</h1>

      <div className="space-y-4">
        {taskList.map((task) => (
          <div
            key={task.id}
            className="task-row border border-white/10 p-4 rounded-lg bg-black/20 backdrop-blur-sm"
            data-task-id={task.id}
          >
            <h3 className="text-lg font-semibold m-0">{task.title}</h3>
            {task.description && <p className="mt-2 text-gray-300">{task.description}</p>}
            <div className="text-gray-500 text-sm mt-2">
              <span>Status: {task.status ?? "—"}</span>
              <span className="ml-3">Priority: {task.priority ?? "—"}</span>
            </div>

            <div className="flex items-center gap-2 mt-4 float-right">
              <select 
                value={task.reviewStatus ?? "pending"} 
                onChange={(e) => handleChange(task.id, e.target.value)}
                className="bg-black/30 border border-white/20 rounded px-2 py-1 text-sm"
                aria-label="Review status"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <button 
                onClick={() => saveReview(task)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                aria-label={`Save review for task ${task.id}`}
              >
                Save
              </button>
            </div>
            <div className="clear-both" />
          </div>
        ))}
      </div>
    </div>
  );
}