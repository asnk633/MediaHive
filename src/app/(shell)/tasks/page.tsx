/* src/app/(shell)/tasks/page.tsx
   Production-ready: canonical review values + Save button triggers toast/alert.
   Replace alert() with your toast helper if you have one (examples below).
*/
import React, { useEffect, useState } from "react";

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tasks?institutionId=1&limit=500");
        const body = await res.json();
        setTasks(body?.data ?? []);
      } catch (err) {
        console.error("Failed to load tasks", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading…</div>;
  if (!tasks.length) return <div>No tasks here.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Task Review Dashboard</h1>

      {tasks.map((t) => {
        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const val = e.target.value;
          setTasks((prev) => prev.map((p) => (p.id === t.id ? { ...p, reviewStatus: val } : p)));
        };

        const saveReview = async () => {
          // canonical backend values expected: 'pending', 'approved', 'rejected'
          const payload = { reviewStatus: t.reviewStatus ?? "pending" };
          try {
            const res = await fetch(`/api/tasks/${t.id}/review`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
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
        };

        return (
          <div
            key={t.id}
            className="task-row"
            data-task-id={t.id}
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              padding: 18,
              marginBottom: 16,
              borderRadius: 6,
            }}
          >
            <h3 style={{ margin: 0 }}>{t.title}</h3>
            {t.description && <p style={{ marginTop: 8 }}>{t.description}</p>}
            <div style={{ color: "#999", fontSize: 13 }}>
              <span>Status: {t.status ?? "—"}</span>
              <span style={{ marginLeft: 12 }}>Priority: {t.priority ?? "—"}</span>
            </div>

            <div style={{ float: "right", display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
              <select value={t.reviewStatus ?? "pending"} onChange={handleChange} aria-label="Review status">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <button onClick={saveReview} aria-label={`Save review for task ${t.id}`}>
                Save
              </button>
            </div>
            <div style={{ clear: "both" }} />
          </div>
        );
      })}
    </div>
  );
}
