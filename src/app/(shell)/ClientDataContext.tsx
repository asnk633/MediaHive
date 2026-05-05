"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/contexts/AuthContextProvider";
import { withTenant } from "@/lib/tenantQuery";
import { apiFromUiStatus, uiFromApiStatus, type UiStatus } from "./utils/uiMaps";

// ---------- Types ----------
export type TaskLite = {
  id: string;
  title: string;
  due_date?: string | null;
  dueDate?: string | null; // Alias
  status?: UiStatus;
  priority?: "low" | "medium" | "high" | "urgent";
  assigned_to?: string | null;
  event_id?: string | null;
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
  start_time: string;
  start_at?: string; // Alias
  end_time?: string | null;
  end_at?: string; // Alias
  location?: string | null;
  description?: string | null;
  is_system_event?: boolean;
  is_all_day?: boolean;
  is_recurring?: boolean;
  status?: string;
  date?: string;
};

type Store = {
  tasks: TaskLite[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTask: (input: {
    title: string;
    description?: string;
    due_date?: string | null;
    priority?: TaskLite["priority"];
  }) => Promise<void>;
  updateTask: (
    id: string,
    delta: Partial<Pick<TaskLite, "title" | "due_date" | "status" | "priority" | "assigned_to">>
  ) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
};

const Ctx = createContext<Store | null>(null);

export function useClientData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useClientData must be used within provider");
  return v;
}

// ---------- Provider ----------
export function ClientDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Load Tasks ----------
  const loadAllData = useCallback(async () => {
    if (!user || !user.tenant_id) {
      if (!user) setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await withTenant(
        supabase
          .from("tasks")
          .select(`
            id, title, due_date, status, priority, event_id,
            task_assignments(user_id, role, profiles(id, full_name, avatar_url))
          `),
        String(user.tenant_id)
      )
        .eq("deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("TASK LOAD ERROR:", error);
        throw error;
      }

      setTasks(
        ((data as any[]) || []).map((row: any) => ({
          ...row,
          status: uiFromApiStatus(row.status),
          assignedTo: (row.task_assignments ?? []).map((ta: any) => ({
            userId: ta.user_id,
            name: ta.profiles?.full_name ?? 'Unknown',
            avatarUrl: ta.profiles?.avatar_url ?? null,
            role: ta.role ?? 'assignee',
          })),
        }))
      );

    } catch (err: any) {
      console.error("LOAD FAILURE:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ---------- Create Task ----------
  const createTask = useCallback(
    async (input: {
      title: string;
      description?: string;
      due_date?: string | null;
      priority?: TaskLite["priority"];
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: input.title,
          description: input.description ?? "",
          due_date: input.due_date ?? null,
          priority: input.priority ?? "medium",
          status: "todo",
          created_by: { uid: user?.uid, name: user?.name || 'Unknown', role: user?.role || 'guest' },
          institution_id: user?.institution_id ? String(user.institution_id) : null,
          tenant_id: user?.tenant_id ? String(user.tenant_id) : null
        })
        .select()
        .single();

      if (error) {
        toast.show("Couldn't create task", "error");
        throw error;
      }

      setTasks((prev) => [
        {
          ...data,
          status: uiFromApiStatus(data.status),
        },
        ...prev,
      ]);

      toast.show("Task created", "success");
    },
    [toast, user]
  );

  // ---------- Update Task ----------
  const updateTask = useCallback(
    async (
      id: string,
      delta: Partial<Pick<TaskLite, "title" | "due_date" | "status" | "priority" | "assigned_to">>
    ) => {
      const payload: any = { ...delta };

      if (delta.status !== undefined)
        payload.status = apiFromUiStatus(delta.status);

      const tenantId = user?.tenant_id;
      if (!tenantId) {
        console.warn("[ClientDataContext] updateTask blocked: No tenant context");
        return false;
      }

      const { data, error } = await withTenant(
        supabase
          .from("tasks")
          .update(payload),
        String(tenantId)
      )
        .eq("id", id)
        .select()
        .single();

      if (error) {
        toast.show("Couldn't update task", "error");
        return false;
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
              ...data,
              status: uiFromApiStatus(data.status),
            }
            : t
        )
      );

      toast.show("Saved", "success");
      return true;
    },
    [toast]
  );

  // ---------- Soft Delete ----------
  const deleteTask = useCallback(
    async (id: string) => {
      const tenantId = user?.tenant_id;
      if (!tenantId) {
        console.warn("[ClientDataContext] deleteTask blocked: No tenant context");
        return false;
      }

      const { error } = await withTenant(
        supabase
          .from("tasks")
          .update({
            deleted: true,
            deleted_at: new Date().toISOString(),
          }),
        String(tenantId)
      )
        .eq("id", id);

      if (error) {
        toast.show("Delete failed", "error");
        return false;
      }

      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.show("Task deleted", "success");
      return true;
    },
    [toast]
  );

  return (
    <Ctx.Provider
      value={{
        tasks,
        loading,
        error,
        refresh: loadAllData,
        createTask,
        updateTask,
        deleteTask,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
