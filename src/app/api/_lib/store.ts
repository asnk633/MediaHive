// src/app/api/_lib/store.ts
// Super-light in-memory store so routes work immediately.
// Swap these with real DB/Orchids calls later.

export type Id = string;

export type Task = {
  id: Id;
  institutionId?: string;
  title: string;
  description?: string;
  status?: "pending" | "working" | "completed" | "on_hold";
  priority?: "low" | "medium" | "high" | "urgent";
  dueAt?: string | null; // ISO
  assignedTo?: string | null; // for now store a name or user id string
  assignedBy?: string | null;
  reviewStatus?: "pending_review" | "approved" | "rejected"; // NEW
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type Event = {
  id: Id;
  institutionId?: string;
  title: string;
  description?: string;
  startAt: string; // ISO
  endAt?: string;  // ISO
  location?: string;
  visibility?: "all" | "team" | "branch" | "custom";
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: Id;
  institutionId?: string;
  title: string;
  body: string;
  audience?: "all" | "team" | "branch" | "custom";
  read?: boolean;
  createdAt: string;
  updatedAt: string;
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
    institutionId: "1",
    title: "Finalize Q4 Marketing Campaign Video",
    description: "Cut, grade, and master. Export in 4K.",
    status: "working",
    priority: "high",
    dueAt: new Date(Date.now() + 864e5).toISOString(),
    assignedTo: "Shukoor Rahman",
    reviewStatus: "approved",
    createdAt: now,
    updatedAt: now,
  };
  const t2: Task = {
    id: makeId("tsk"),
    institutionId: "1",
    title: "Create video content for Instagram",
    status: "pending",
    priority: "medium",
    dueAt: new Date(Date.now() + 2 * 864e5).toISOString(),
    assignedTo: "KMS Pallikkunnu",
    reviewStatus: "approved",
    createdAt: now,
    updatedAt: now,
  };
  const t3: Task = {
    id: makeId("tsk"),
    institutionId: "1",
    title: "Guest request: drone b-roll from campus",
    description: "Sample guest submission requiring approval.",
    status: "pending",
    priority: "low",
    dueAt: null,
    assignedTo: null,
    reviewStatus: "pending_review",
    createdAt: now,
    updatedAt: now,
  };
  db.tasks.set(t1.id, t1);
  db.tasks.set(t2.id, t2);
  db.tasks.set(t3.id, t3);
}