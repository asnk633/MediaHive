"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from 'next/navigation';
import { Trash2, CheckCircle2, Clock, AlertCircle, Save } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useRole } from "@/app/(shell)/RoleContext";
import { cn } from "@/lib/utils";

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
  const { can, role } = usePermission();
  const { user } = useRole();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/tasks?institutionId=1&limit=50&filter=${filter}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
          'x-user-id': user?.id ? String(user.id) : '1'
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
  }, [filter, user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const taskList = useMemo(() => tasks, [tasks]);

  const handleChange = useCallback((taskId: number, value: string) => {
    setTasks((prev) => prev.map((p) => (p.id === taskId ? { ...p, reviewStatus: value } : p)));
  }, []);

  const saveReview = useCallback(async (task: Task) => {
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
        alert(`Failed to update reviewStatus: ${body?.error ?? res.statusText}`);
      } else {
        alert("Review status updated");
      }
    } catch (err) {
      alert(`Failed to update review status: ${String(err)}`);
    }
  }, []);

  const handleDelete = async (taskId: number) => {
    if (confirm('Delete task?')) {
      try {
        await fetch(`/api/tasks/${taskId}?institutionId=1`, {
          method: 'DELETE',
          headers: { 'x-user-id': user?.id ? String(user.id) : '1' }
        });
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch (e) {
        console.error("Failed to delete task", e);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 px-2 pt-4 pb-24">
      <header className="px-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">Tasks</h1>
        <p className="mt-1 text-[var(--muted)]">Manage your daily tasks and assignments.</p>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)]">
          Error: {error}
        </div>
      )}

      {!loading && !error && !taskList.length && (
        <div className="text-center py-12 text-[var(--muted)]">
          No tasks found. Create one to get started.
        </div>
      )}

      {!loading && !error && taskList.length > 0 && (
        <div className="grid gap-4">
          {taskList.map((task) => (
            <div
              key={task.id}
              className="glass-card relative p-5 group transition-all duration-200 ease-in-out hover:bg-[var(--panel)] card-padding"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusPill status={task.status} />
                    <PriorityPill priority={task.priority} />
                  </div>

                  <h3 className="text-lg font-semibold text-[var(--text)] truncate pr-8">{task.title}</h3>
                  {task.description && (
                    <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{task.description}</p>
                  )}
                </div>

                {can('delete:tasks') && (
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="absolute top-4 right-4 p-2 rounded-full text-[var(--icon-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all duration-200 ease-in-out opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete task"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Admin Controls */}
              {role === 'admin' && (
                <div className="mt-4 pt-4 border-t border-[var(--glass-border)] flex items-center justify-end gap-3">
                  <div className="flex items-center gap-2 bg-[var(--panel)] rounded-lg p-1 border border-[var(--glass-border)]">
                    <select
                      value={task.reviewStatus ?? "pending"}
                      onChange={(e) => handleChange(task.id, e.target.value)}
                      className="bg-transparent border-none text-[var(--muted)] focus:ring-0 cursor-pointer py-1 pl-2 pr-8"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <button
                    onClick={() => saveReview(task)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-2)] text-[var(--text)] text-xs font-medium transition-all duration-200 ease-in-out"
                  >
                    <Save size={14} />
                    Save
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  const styles = {
    completed: "bg-[var(--accent-2)]/10 text-[var(--accent-2)] border-[var(--accent-2)]/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "in-progress": "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20",
    default: "bg-[var(--muted)]/10 text-[var(--muted)] border-[var(--muted)]/20"
  };

  const key = (status?.toLowerCase() as keyof typeof styles) || "default";
  const style = styles[key] || styles.default;

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border", style)}>
      {status || "No Status"}
    </span>
  );
}

function PriorityPill({ priority }: { priority?: string }) {
  if (!priority) return null;

  const styles = {
    high: "text-[var(--danger)]",
    medium: "text-yellow-400",
    low: "text-[var(--accent-2)]",
    default: "text-[var(--muted)]"
  };

  const key = (priority?.toLowerCase() as keyof typeof styles) || "default";
  const color = styles[key] || styles.default;

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-1.5 h-1.5 rounded-full bg-current", color)} />
      <span className={cn("text-[10px] uppercase tracking-wider font-medium", color)}>
        {priority}
      </span>
    </div>
  );
}