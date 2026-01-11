// "use client" ensures this runs only on the client side
"use client";

import "@/lib/client-fetch-wrapper"; // side‑effect import for fetch wrapper
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { apiFromUiStatus, uiFromApiStatus, type UiStatus } from "./utils/uiMaps";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/lib/apiClient";

// ---------- Types ----------
export type TaskLite = {
  id: string;
  title: string;
  dueAt?: string | null;
  status?: UiStatus;
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: string | null;
  reviewStatus?: "pending_review" | "approved" | "rejected";
};

export type NotificationLite = {
  id: string;
  title: string;
  body: string;
  read?: boolean;
  time?: string;
};

export type EventLite = {
  id: string;
  title: string;
  startAt: string;
  endAt?: string | null;
  visibility?: "all" | "team" | "branch" | "custom";
  location?: string | null;
  description?: string | null;
  isSystemEvent?: boolean;
};

type Store = {
  tasks: TaskLite[];
  notifications: NotificationLite[];
  events: EventLite[];
  createTask: (input: {
    title: string;
    description?: string;
    dueAt?: string | null;
    priority?: TaskLite["priority"];
  }) => Promise<void>;
  updateTask: (
    id: string,
    delta: Partial<Pick<TaskLite, "title" | "dueAt" | "status" | "priority" | "assignedTo" | "reviewStatus">>
  ) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  createNotification: (input: { title: string; body: string; audience?: string }) => Promise<void>;
  createEvent: (input: {
    title: string;
    description?: string;
    startAt: string;
    endAt?: string | null;
    location?: string;
  }) => Promise<void>;
};

const Ctx = createContext<Store | null>(null);
export function useClientData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useClientData must be used within provider");
  return v;
}

// ---------- Helper functions ----------
function mapApiTask(x: any): TaskLite {
  const status = uiFromApiStatus(x.status);
  return {
    id: x.id,
    title: x.title,
    dueAt: x.dueAt ?? null,
    status,
    priority: x.priority ?? "medium",
    assignedTo: x.assignedTo ?? null,
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
    isSystemEvent: x.isSystemEvent,
  };
}

/**
 * Returns authentication headers for dev environment.
 * - Prefers a JWT stored under `authToken`.
 * - Falls back to the seeded user (`localStorage.user`).
 */
function getDevAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.id) headers["x-user-id"] = String(user.id);
        if (user.institutionId) headers["x-institution-id"] = String(user.institutionId);
      } catch { }
    }
  }
  return headers;
}

export function ClientDataProvider({ children }: { children: React.ReactNode }) {
  // ----- Dev seed -----
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const existing = localStorage.getItem("user");
      if (!existing) {
        const devUser = {
          id: 1,
          email: "admin@thaiba.com",
          fullName: "Admin User",
          role: "admin",
          institutionId: "1",
        };
        localStorage.setItem("user", JSON.stringify(devUser));
      }
    }
  }, []);

  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [notifications, setNotifications] = useState<NotificationLite[]>([]);
  const [events, setEvents] = useState<EventLite[]>([]);

  // ----- Initial data load -----
  useEffect(() => {
  }, []);

  // ----- CRUD helpers -----
  const createTask = useCallback(
    async (input: { title: string; description?: string; dueAt?: string | null; priority?: TaskLite["priority"] }) => {
      if (!user) {
        toast?.show("Not authenticated", "error");
        return;
      }

      const tempId = `tsk_temp_${Math.random().toString(36).slice(2, 8)}`;
      const isGuest = user.role === "guest";
      const optimistic: TaskLite = {
        id: tempId,
        title: input.title,
        dueAt: input.dueAt ?? null,
        status: "Pending",
        priority: input.priority ?? "medium",
        assignedTo: !isGuest ? (user.name || null) : null,
        reviewStatus: isGuest ? "pending_review" : "approved",
      };
      setTasks(prev => [optimistic, ...prev]);
      try {
        const endpoint = isGuest ? "/api/guest-tasks/create" : "/api/tasks";
        const body = isGuest
          ? { title: input.title, dueDate: input.dueAt, assignedBy: Number(user.uid) }
          : {
            title: input.title,
            description: input.description ?? "",
            dueAt: input.dueAt ?? null,
            priority: input.priority ?? "medium",
            assignedTo: optimistic.assignedTo,
            reviewStatus: optimistic.reviewStatus,
            institutionId: "1",
          };
        const json = await apiClient(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getDevAuthHeaders() },
          body: JSON.stringify(body),
        });
        const real = json?.data;
        if (real?.id) setTasks(prev => [{ ...mapApiTask(real) }, ...prev.filter(t => t.id !== tempId)]);
        toast.show(isGuest ? "Task submitted for review" : "Task created", "success");
      } catch (e) {
        setTasks(prev => prev.filter(t => t.id !== tempId));
        toast.show("Couldn't create task", "error");
        throw e;
      }
    },
    [toast, user]
  );

  const updateTask = useCallback(
    async (id: string, delta: Partial<Pick<TaskLite, "title" | "dueAt" | "status" | "priority" | "assignedTo" | "reviewStatus">>) => {
      const prev = tasks;
      const idx = prev.findIndex(t => t.id === id);
      if (idx >= 0) setTasks(p => {
        const c = [...p];
        c[idx] = { ...c[idx], ...delta };
        return c;
      });
      try {
        const payload: any = {};
        if (delta.title !== undefined) payload.title = delta.title;
        if (delta.dueAt !== undefined) payload.dueAt = delta.dueAt;
        if (delta.priority !== undefined) payload.priority = delta.priority;
        if (delta.assignedTo !== undefined) payload.assignedTo = delta.assignedTo;
        if (delta.reviewStatus !== undefined) payload.reviewStatus = delta.reviewStatus;
        if (delta.status !== undefined) payload.status = apiFromUiStatus(delta.status as any);
        const json = await apiClient(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getDevAuthHeaders() },
          body: JSON.stringify(payload),
        });
        const server = json?.data;
        if (server?.id) setTasks(cur => cur.map(t => (t.id === id ? mapApiTask(server) : t)));
        toast.show("Saved", "success");
        return true;
      } catch (e) {
        setTasks(prev);
        toast.show("Couldn't save changes", "error");
        return false;
      }
    },
    [tasks, toast]
  );

  const deleteTask = useCallback(async (id: string) => {
    const prev = tasks;
    setTasks(cur => cur.filter(t => t.id !== id));
    try {
      await apiClient(`/api/tasks/${id}?institutionId=1`, {
        method: "DELETE",
        headers: { ...getDevAuthHeaders() },
      });
      toast.show("Task deleted", "success");
      return true;
    } catch (e) {
      setTasks(prev);
      toast.show("Delete failed", "error");
      return false;
    }
  }, [tasks, toast]);

  const createNotification = useCallback(async (input: { title: string; body: string; audience?: string }) => {
    const tempId = `ntf_temp_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: NotificationLite = { id: tempId, title: input.title, body: input.body, read: false };
    setNotifications(prev => [optimistic, ...prev]);
    try {
      const json = await apiClient("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getDevAuthHeaders() },
        body: JSON.stringify({ title: input.title, body: input.body, audience: input.audience ?? "team", institutionId: "1" }),
      });
      const real = json?.data;
      if (real?.id)
        setNotifications(prev => [{ id: real.id, title: real.title, body: real.body, read: !!real.read }, ...prev.filter(n => n.id !== tempId)]);
      toast.show("Notification sent", "success");
    } catch (e) {
      setNotifications(prev => prev.filter(n => n.id !== tempId));
      toast.show("Couldn't send notification", "error");
      throw e;
    }
  }, [toast]);

  const createEvent = useCallback(async (input: { title: string; description?: string; startAt: string; endAt?: string | null; location?: string }) => {
    const tempId = `evt_temp_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: EventLite = { id: tempId, title: input.title, startAt: input.startAt, endAt: input.endAt ?? null, visibility: "team" };
    setEvents(prev => [optimistic, ...prev]);
    try {
      const json = await apiClient("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getDevAuthHeaders() },
        body: JSON.stringify({
          title: input.title,
          description: input.description ?? "",
          date: input.startAt, // API requires 'date'
          startAt: input.startAt,
          endAt: input.endAt ?? null,
          location: input.location ?? "",
          institutionId: "1",
        }),
      });
      const real = json?.data;
      if (real?.id)
        setEvents(prev => [{ id: real.id, title: real.title, startAt: real.startAt, endAt: real.endAt ?? null, visibility: real.visibility ?? "team" }, ...prev.filter(e => e.id !== tempId)]);
      toast.show("Event created", "success");
    } catch (e) {
      setEvents(prev => prev.filter(e => e.id !== tempId));
      toast.show("Couldn't create event", "error");
      throw e;
    }
  }, [toast]);

  return (
    <Ctx.Provider
      value={{
        tasks,
        notifications,
        events,
        createTask,
        updateTask,
        deleteTask,
        createNotification,
        createEvent,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}