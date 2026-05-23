import React from "react";
import { usePermission } from "@/hooks/usePermission";
import { Trash2, Edit2, Calendar, User, Flag, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
  id: number | string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  assignee?: { id?: number | string; name?: string } | null;
  due_date?: string | null;
  reviewStatus?: string | null;
  createdById?: number | string;
};

type Props = {
  task: Task;
  className?: string;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
};

export default function TaskItem({ task, className = "", onEdit, onDelete }: Props) {
  const { can } = usePermission();
  const assigneeName = task.assignee?.name ?? "";

  const canEdit = can('edit:tasks');
  const canDelete = can('delete:tasks');

  const priorityColor =
    (task.priority === 'high' || task.priority === 'urgent') ? 'text-orange-400 bg-orange-500/10' :
      task.priority === 'medium' ? 'text-yellow-400 bg-yellow-500/10' :
        'text-primary bg-primary/10';

  return (
    <article
      role="article"
      className={cn(
        "group relative overflow-hidden rounded-xl border border-foreground/5 bg-surface/40 p-4 transition-all hover:bg-surface/60 hover:shadow-lg hover:shadow-primary/5 backdrop-blur-sm",
        className
      )}
      data-task-id={String(task.id)}
      data-status={task.status ?? "unknown"}
      data-priority={task.priority ?? "unknown"}
      data-review-status={task.reviewStatus ?? "unknown"}
      data-assignee={assigneeName}
      aria-label={`Task: ${task.title}. Status: ${task.status ?? "Pending"}. Priority: ${task.priority ?? "Normal"}.`}
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-primary/50" aria-hidden="true" />

      <div className="pr-10">
        <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">{task.title}</h3>
        {task.description && (
          <p className="mt-1 text-sm text-text-muted line-clamp-2">{task.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted" aria-hidden>
          <div className="flex items-center gap-1.5 rounded-full bg-surface/50 px-2 py-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>{task.status ?? "Pending"}</span>
          </div>

          <div className={cn("flex items-center gap-1.5 rounded-full px-2 py-1", priorityColor)}>
            <Flag className="h-3 w-3" />
            <span className="uppercase font-bold text-[10px]">{task.priority === 'urgent' ? 'high' : (task.priority ?? "Normal")}</span>
          </div>

          {task.due_date && (
            <div className="flex items-center gap-1.5 rounded-full bg-surface/50 px-2 py-1">
              <Calendar className="h-3 w-3" />
              <span>
                {(() => {
                  try {
                    if (typeof task.due_date === 'string') return new Date(task.due_date).toLocaleDateString();
                    if (typeof task.due_date === 'object' && 'seconds' in (task.due_date as any)) return new Date((task.due_date as any).seconds * 1000).toLocaleDateString();
                    return 'Invalid Date';
                  } catch { return 'Invalid Date' }
                })()}
              </span>
            </div>
          )}

          {assigneeName && (
            <div className="flex items-center gap-1.5 rounded-full bg-surface/50 px-2 py-1">
              <User className="h-3 w-3" />
              <span>{assigneeName}</span>
            </div>
          )}

          {task.reviewStatus && (
            <span className={cn(
              "rounded-full px-2 py-1 font-medium",
              task.reviewStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            )}>
              {task.reviewStatus === 'pending_review' ? 'In Review' : task.reviewStatus}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
        {canEdit && onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-1.5 rounded-lg bg-surface hover:bg-accent hover:text-foreground text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Edit task"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        {canDelete && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(String(task.id)); }}
            className="p-1.5 rounded-lg bg-surface hover:bg-red-500 hover:text-foreground text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </article>
  );
}
