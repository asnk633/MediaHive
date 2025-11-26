// src/app/(shell)/reports/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  id: string; status?: "pending" | "working" | "completed" | "on_hold";
  dueAt?: string | null;
};
type Event = { id: string; startAt: string };

function isOverdue(t: Task) {
  if (!t.dueAt) return false;
  const due = new Date(t.dueAt).getTime();
  return due < Date.now() && t.status !== "completed";
}

export default function ReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const t = await fetch("/api/tasks?institutionId=1&limit=1000").then(r => r.json());
        const e = await fetch("/api/events?institutionId=1&limit=500").then(r => r.json());
        if (!active) return;
        setTasks(Array.isArray(t.data) ? t.data : []);
        setEvents(Array.isArray(e.data) ? e.data : []);
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const openTasks = useMemo(() => tasks.filter(t => t.status !== "completed").length, [tasks]);
  const overdue = useMemo(() => tasks.filter(isOverdue).length, [tasks]);
  const thisWeekEvents = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Sun
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const s = start.getTime(), e = end.getTime();
    return events.filter(ev => {
      const ts = new Date(ev.startAt).getTime();
      return ts >= s && ts < e;
    }).length;
  }, [events]);

  return (
    <div className="px-4 pb-28 pt-6">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--text)]">Reports</h1>

      {loading ? (
        <div className="mt-4 rounded-xl bg-[var(--panel)] p-4 card-padding">Loading…</div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Card title="Open Tasks" value={String(openTasks)} hint="Team-wide" />
            <Card title="Overdue" value={String(overdue)} hint="Needs attention" />
            <Card title="Events this week" value={String(thisWeekEvents)} hint="Across branches" />
          </div>

          <section className="mt-6 glass-card rounded-xl p-4 card-padding">
            <h3 className="text-lg font-bold text-[var(--text)]">Productivity Snapshot</h3>
            <p className="mt-1 text-[var(--muted)]">
              A quick overview based on your current open items and schedule.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Metric label="Completion Rate" value={pct(tasks.filter(t=>t.status==="completed").length, tasks.length)} />
              <Metric label="Open vs Total" value={`${openTasks}/${tasks.length}`} />
              <Metric label="Overdue Share" value={pct(overdue, tasks.length)} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function pct(n: number, d: number) {
  if (!d) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

function Card({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="glass-card rounded-xl p-4 card-padding">
      <p className="text-sm text-[var(--muted)]">{title}</p>
      <p className="mt-1 text-3xl font-extrabold text-[var(--text)]">{value}</p>
      {hint && <p className="text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--panel-strong)] p-3">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="text-xl font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}