"use client";
import "@/lib/client-fetch-wrapper";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { apiFromUiStatus, uiFromApiStatus } from "./utils/uiMaps";
import { useRole } from "./RoleContext";

export type TaskLite = {
  id: string;
  title: string;
  dueAt?: string | null;
  status?: "Working On" | "In Progress" | "Pending" | "Completed" | "On Hold";
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: string | null;
  reviewStatus?: "pending_review" | "approved" | "rejected";
};

export type NotificationLite = { id: string; title: string; body: string; read?: boolean; time?: string };
export type EventLite = {
  id: string;
  title: string;
  startAt: string;
  endAt?: string | null;
  visibility?: "all" | "team" | "branch" | "custom";
  location?: string | null;
  description?: string | null;
};

type Store = {
  tasks: TaskLite[];
  notifications: NotificationLite[];
  events: EventLite[];
  createTask: (input: { title: string; description?: string; dueAt?: string | null; priority?: TaskLite["priority"] }) => Promise<void>;
  updateTask: (id: string, delta: Partial<Pick<TaskLite, "title" | "dueAt" | "status" | "priority" | "assignedTo" | "reviewStatus">>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  createNotification: (input: { title: string; body: string; audience?: string }) => Promise<void>;
  createEvent: (input: { title: string; description?: string; startAt: string; endAt?: string | null; location?: string }) => Promise<void>;
};

const Ctx = createContext<Store | null>(null);
export function useClientData() { const v = useContext(Ctx); if (!v) throw new Error("useClientData must be used within provider"); return v; }

function mapApiTask(x: any): TaskLite {
  const status = uiFromApiStatus(x.status);
  return {
    id: x.id, title: x.title, dueAt: x.dueAt ?? null, status,
    priority: x.priority ?? "medium", assignedTo: x.assignedTo ?? null,
    reviewStatus: x.reviewStatus ?? "approved",
  };
}
function mapApiEvent(x: any): EventLite {
  return {
    id: x.id,
    title: x.title,
    startAt: x.startAt,
    endAt: x.endAt ?? null,
    visibility: x.visibility ?? "team",
    location: x.location ?? null,
    description: x.description ?? null,
  };
}

export function ClientDataProvider({ children }: { children: React.ReactNode }) {
  // --- START DEV SEED LOGIC ---
  React.useEffect(() => {
    // DEV: auto-seed a user for local development if none present
    if (process.env.NODE_ENV !== "production") {
      const existing = localStorage.getItem("user"); // Assuming useRole reads from "user" in localStorage
      if (!existing) {
        const devUser = {
          id: 1,
          email: "admin@thaiba.com",
          fullName: "Admin User",
          role: "admin",
          institutionId: "1", // Use string "1" to match institutionId usage in the file
        };
        localStorage.setItem("user", JSON.stringify(devUser));
        // Force a reload or simply rely on the component using useRole to re-render
      }
    }
  }, []);
  // --- END DEV SEED LOGIC ---

  const { user } = useRole();
  const toast = useToast();

  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [notifications, setNotifications] = useState<NotificationLite[]>([]);
  const [events, setEvents] = useState<EventLite[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const t = await fetch("/api/tasks?institutionId=1&limit=500").then(r => r.json());
        const n = await fetch("/api/notifications?institutionId=1&limit=100").then(r => r.json());
        const e = await fetch("/api/events?institutionId=1&limit=200").then(r => r.json());
        setTasks(Array.isArray(t.data) ? t.data.map(mapApiTask) : []);
        setNotifications(Array.isArray(n.data) ? n.data.map((x: any) => ({ id: x.id, title: x.title, body: x.body, read: !!x.read })) : []);
        setEvents(Array.isArray(e.data) ? e.data.map(mapApiEvent) : []);
      } catch { }
    })();
  }, []);

  const createTask = useCallback(async (input: { title: string; description?: string; dueAt?: string | null; priority?: TaskLite["priority"] }) => {
    const tempId = `tsk_temp_${Math.random().toString(36).slice(2, 8)}`;
    const isGuest = user.role === "guest";
    const optimistic: TaskLite = {
      id: tempId,
      title: input.title,
      dueAt: input.dueAt ?? null,
      status: "Pending",
      priority: input.priority ?? "medium",
      assignedTo: !isGuest ? user.name : null,
      reviewStatus: isGuest ? "pending_review" : "approved",
    };
    setTasks(prev => [optimistic, ...prev]);
    try {
      const endpoint = isGuest ? "/api/guest-tasks/create" : "/api/tasks";
      const body = isGuest
        ? { title: input.title, dueDate: input.dueAt, assignedBy: Number(user.id) }
        : {
          title: input.title,
          description: input.description ?? "",
          dueAt: input.dueAt ?? null,
          priority: input.priority ?? "medium",
          assignedTo: optimistic.assignedTo,
          reviewStatus: optimistic.reviewStatus,
          institutionId: "1",
        };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(user.id)
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const real = json?.data;
      if (real?.id) setTasks(prev => [{ ...mapApiTask(real) }, ...prev.filter(t => t.id !== tempId)]);
      toast.show(isGuest ? "Task submitted for review" : "Task created", "success");
    } catch {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      toast.show("Couldn’t create task", "error");
      throw new Error("Create task failed");
    }
  }, [toast, user]);

  const updateTask = useCallback(async (id: string, delta: Partial<Pick<TaskLite, "title" | "dueAt" | "status" | "priority" | "assignedTo" | "reviewStatus">>) => {
    const prev = tasks;
    const idx = prev.findIndex(t => t.id === id);
    if (idx >= 0) setTasks(p => { const c = [...p]; c[idx] = { ...c[idx], ...delta }; return c; });

    try {
      const payload: any = {};
      if (delta.title !== undefined) payload.title = delta.title;
      if (delta.dueAt !== undefined) payload.dueAt = delta.dueAt;
      if (delta.priority !== undefined) payload.priority = delta.priority;
      if (delta.assignedTo !== undefined) payload.assignedTo = delta.assignedTo;
      if (delta.reviewStatus !== undefined) payload.reviewStatus = delta.reviewStatus;
      if (delta.status !== undefined) payload.status = apiFromUiStatus(delta.status as any);

      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(user.id)
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Update failed");
      const json = await res.json().catch(() => null);
      const server = json?.data;
      if (server?.id) setTasks(cur => cur.map(t => (t.id === id ? mapApiTask(server) : t)));
      toast.show("Saved", "success");
      return true;
    } catch {
      setTasks(prev);
      toast.show("Couldn’t save changes", "error");
      return false;
    }
  }, [tasks, toast, user]);

  const deleteTask = useCallback(async (id: string) => {
    const prev = tasks;
    setTasks(cur => cur.filter(t => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}?institutionId=1`, {
        method: "DELETE",
        headers: {
          "x-user-id": String(user.id)
        }
      });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      toast.show("Task deleted", "success");
      return true;
    } catch {
      setTasks(prev);
      toast.show("Delete failed", "error");
      return false;
    }
  }, [tasks, toast, user]);

  const createNotification = useCallback(async (input: { title: string; body: string; audience?: string }) => {
    const tempId = `ntf_temp_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: NotificationLite = { id: tempId, title: input.title, body: input.body, read: false };
    setNotifications(prev => [optimistic, ...prev]);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(user.id)
        },
        body: JSON.stringify({ title: input.title, body: input.body, audience: input.audience ?? "team", institutionId: "1" })
      });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const real = json?.data;
      if (real?.id) setNotifications(prev => [{ id: real.id, title: real.title, body: real.body, read: !!real.read }, ...prev.filter(n => n.id !== tempId)]);
      toast.show("Notification sent", "success");
    } catch {
      setNotifications(prev => prev.filter(n => n.id !== tempId));
      toast.show("Couldn’t send notification", "error");
      throw new Error("Create notification failed");
    }
  }, [toast, user]);

  const createEvent = useCallback(async (input: { title: string; description?: string; startAt: string; endAt?: string | null; location?: string }) => {
    const tempId = `evt_temp_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: EventLite = { id: tempId, title: input.title, startAt: input.startAt, endAt: input.endAt ?? null, visibility: "team" };
    setEvents(prev => [optimistic, ...prev]);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(user.id)
        },
        body: JSON.stringify({ title: input.title, description: input.description ?? "", startAt: input.startAt, endAt: input.endAt ?? null, location: input.location ?? "", institutionId: "1" })
      });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const real = json?.data;
      if (real?.id) setEvents(prev => [{ id: real.id, title: real.title, startAt: real.startAt, endAt: real.endAt ?? null, visibility: real.visibility ?? "team" }, ...prev.filter(e => e.id !== tempId)]);
      toast.show("Event created", "success");
    } catch {
      setEvents(prev => prev.filter(e => e.id !== tempId));
      toast.show("Couldn’t create event", "error");
      throw new Error("Create event failed");
    }
  }, [toast, user]);

  return (
    <Ctx.Provider value={{ tasks, notifications, events, createTask, updateTask, deleteTask, createNotification, createEvent }}>
      {children}
    </Ctx.Provider>
  );
}