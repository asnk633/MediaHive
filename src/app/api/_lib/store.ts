// src/app/api/_lib/store.ts
// Super-light in-memory store so routes work immediately.
// Swap these with real DB/Orchids calls later.

export type Id = string;

export type Task = {
  id: Id;
  institution_id?: string;
  title: string;
  description?: string;
  status?: "pending" | "working" | "completed" | "on_hold";
  priority?: "low" | "medium" | "high" | "urgent";
  due_date?: string | null; // ISO
  assigned_to?: string | null; // for now store a name or user id string
  assigned_by?: string | null;
  reviewStatus?: "pending_review" | "approved" | "rejected"; // NEW
  created_at: string; // ISO
  updated_at: string; // ISO
};

export type Event = {
  id: Id;
  institution_id?: string;
  title: string;
  description?: string;
  startAt: string; // ISO
  endAt?: string;  // ISO
  location?: string;
  visibility?: "all" | "team" | "branch" | "custom";
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: Id;
  institution_id?: string;
  title: string;
  body: string;
  audience?: "all" | "team" | "branch" | "custom";
  read?: boolean;
  created_at: string;
  updated_at: string;
};

export function nowISO() { return new Date().toISOString(); }
export function makeId(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2, 8)}`; }

export const db = {
  tasks: new Map<Id, Task>(),
  events: new Map<Id, Event>(),
  notifications: new Map<Id, Notification>(),
};

// Seed a few demo rows
if (db.tasks.size === 0) {
  const now = nowISO();
  const t1: Task = {
    id: makeId("tsk"),
    institution_id: "1",
    title: "Finalize Q4 Marketing Campaign Video",
    description: "Cut, grade, and master. Export in 4K.",
    status: "working",
    priority: "high",
    due_date: new Date(Date.now() + 864e5).toISOString(),
    assigned_to: "Shukoor Rahman",
    reviewStatus: "approved",
    created_at: now,
    updated_at: now,
  };
  const t2: Task = {
    id: makeId("tsk"),
    institution_id: "1",
    title: "Create video content for Instagram",
    status: "pending",
    priority: "medium",
    due_date: new Date(Date.now() + 2 * 864e5).toISOString(),
    assigned_to: "KMS Pallikkunnu",
    reviewStatus: "approved",
    created_at: now,
    updated_at: now,
  };
  const t3: Task = {
    id: makeId("tsk"),
    institution_id: "1",
    title: "Guest request: drone b-roll from campus",
    description: "Sample guest submission requiring approval.",
    status: "pending",
    priority: "low",
    due_date: null,
    assigned_to: null,
    reviewStatus: "pending_review",
    created_at: now,
    updated_at: now,
  };
  db.tasks.set(t1.id, t1);
  db.tasks.set(t2.id, t2);
  db.tasks.set(t3.id, t3);
}
