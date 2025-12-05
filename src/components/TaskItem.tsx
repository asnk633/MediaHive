import React from "react";

type Task = {
  id: number | string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  assignee?: { id?: number | string; name?: string } | null;
  dueDate?: string | null;
};

type Props = {
  task: Task;
  className?: string;
};

// Simple presentational TaskItem used by both Kanban and list views.
// Exposes stable data-* attributes for e2e tests:
//  - data-task-id
//  - data-status
//  - data-assignee
export default function TaskItem({ task, className = "" }: Props) {
  const assigneeName = task.assignee?.name ?? "";
  return (
    <article
      role="article"
      className={`task-item card ${className}`}
      data-task-id={String(task.id)}
      data-status={task.status ?? "unknown"}
      data-assignee={assigneeName}
      aria-label={`task-${task.id}`}
    >
      <div className="card-body">
        <h3 className="task-title">{task.title}</h3>
        {task.description ? <p className="task-desc">{task.description}</p> : null}
        <div className="task-meta" aria-hidden>
          <span className="task-status">Status: {task.status ?? "—"}</span>
          <span className="task-priority">Priority: {task.priority ?? "—"}</span>
          {task.dueDate ? <span className="task-due">Due: {task.dueDate}</span> : null}
        </div>
      </div>
    </article>
  );
}
