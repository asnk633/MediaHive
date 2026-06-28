"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, List, LayoutGrid, Search, Filter,
  CheckSquare, Calendar, Sparkles, X,
  Loader2, CheckCircle2, AlertCircle, ChevronDown,
  Flag, User, Eye, Pencil, Trash2, Clock, CheckCheck,
  ListTodo, AlertTriangle, Pause, TrendingUp
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedList } from "@/components/ui/animated-list";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  description: string;
  status: "To Do" | "In Progress" | "On Hold" | "Done";
  priority: "High" | "Medium" | "Low";
  category: string;
  due_date: string;           // raw ISO for comparison
  due_date_display: string;   // formatted for display
  completed_at: string | null;
  completed_at_display: string | null;
  assignee_initials: string;
  assignee_name: string;
  requester_name: string;
  requester_initials: string;
  created_by: string;
  progress: number;
}

interface Toast {
  type: "success" | "error" | "loading";
  message: string;
}

type TabType = "today" | "all" | "mine";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mapStatus = (s: string): Task["status"] => {
  const l = s?.toLowerCase() ?? "";
  if (["done", "completed"].includes(l)) return "Done";
  if (["in-progress", "in progress", "in_progress", "working"].includes(l)) return "In Progress";
  if (["on-hold", "on hold", "on_hold", "hold", "paused"].includes(l)) return "On Hold";
  return "To Do";
};

const getInitials = (name: unknown) => {
  const n = String(name ?? "").trim();
  if (!n || n === "Unassigned" || n === "null" || n === "undefined") return "UA";
  const parts = n.split(" ");
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  } catch { return null; }
};

const isToday = (iso: string | null | undefined) => {
  if (!iso) return false;
  try {
    const d = new Date(iso);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
  } catch { return false; }
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "text-red-400",
  Medium: "text-amber-400",
  Low: "text-zinc-500",
};

const PRIORITY_BG: Record<string, string> = {
  High: "bg-red-500/10 text-red-400 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-zinc-800 text-zinc-500 border-zinc-700/50",
};

const STATUS_COLORS: Record<string, string> = {
  Done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "In Progress": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "On Hold": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "To Do": "bg-zinc-800 text-zinc-400 border-zinc-700/50",
};

const KANBAN_COLS: Task["status"][] = ["To Do", "In Progress", "On Hold", "Done"];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-white/10 transition-all"
    >
      <div className={`absolute top-0 right-0 w-20 h-20 ${color} blur-[40px] rounded-full pointer-events-none opacity-30`} />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${color.replace("bg-", "bg-")} bg-opacity-20 border border-white/5`}>
          <Icon size={13} className={color.includes("emerald") ? "text-emerald-400" : color.includes("purple") ? "text-purple-400" : color.includes("amber") ? "text-amber-400" : color.includes("red") ? "text-red-400" : color.includes("blue") ? "text-blue-400" : color.includes("teal") ? "text-teal-400" : "text-zinc-400"} />
        </div>
      </div>
      <div className="relative z-10">
        <span className="text-2xl font-bold text-white">{value}</span>
        {sub && <span className="text-[10px] text-zinc-600 ml-1.5">{sub}</span>}
      </div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-3 text-zinc-500 text-sm py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> Loading tasks...
      </div>
    }>
      <TasksContent />
    </Suspense>
  );
}

function TasksContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const createParam = searchParams ? searchParams.get("create") : null;
  const hasAutoOpened = useRef(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "To Do" as Task["status"],
    priority: "Medium" as Task["priority"],
    category: "General",
    due_date: "",
    assignee_id: "",
  });

  const showToast = (type: Toast["type"], message: string) => {
    setToast({ type, message });
    if (type !== "loading") setTimeout(() => setToast(null), 3500);
  };

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTasksAndProfiles = useCallback(async () => {
    if (!user?.institution_id && !user?.tenant_id) return;
    setLoading(true);
    try {
      let profQuery = supabase.from("profiles").select("id, full_name, email");
      if (user.institution_id) profQuery = profQuery.eq("institution_id", user.institution_id);
      else if (user.tenant_id) profQuery = profQuery.eq("tenant_id", user.tenant_id);
      const { data: profData, error: profError } = await profQuery;
      if (profError) throw profError;
      setProfiles(profData || []);
      if (profData && profData.length > 0) {
        setForm(f => ({ ...f, assignee_id: user.id || profData[0].id }));
      }

      let query = supabase
        .from("tasks")
        .select(`*, assigned_by_profile:profiles!tasks_assigned_by_fkey(id,full_name,email)`)
        .eq("deleted", false)
        .order("created_at", { ascending: false });

      if (user.institution_id) query = query.eq("institution_id", user.institution_id);
      else if (user.tenant_id) query = query.eq("tenant_id", user.tenant_id);

      const { data, error } = await query;
      if (error) {
        // Fallback without join if column missing
        let q2 = supabase.from("tasks").select(`*`).eq("deleted", false).order("created_at", { ascending: false });
        if (user.institution_id) q2 = q2.eq("institution_id", user.institution_id);
        else if (user.tenant_id) q2 = q2.eq("tenant_id", user.tenant_id);
        const { data: d2, error: e2 } = await q2;
        if (e2) throw e2;
        setTasks(mapTasks(d2 || [], profData || []));
      } else {
        setTasks(mapTasks(data || [], profData || []));
      }
    } catch (err: any) {
      console.error("Failed to fetch tasks/profiles:", err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const mapTasks = (data: any[], profData: any[]): Task[] =>
    data.map((t: Record<string, any>): Task => {
      // Assignee
      const profile = profData?.find((p: any) =>
        p.id === t.assignee_id || p.id === t.assigned_to
      ) as any;
      const pName = profile?.full_name || profile?.name || profile?.email;

      // Requester — try on_behalf_of JSONB first, then assigned_by profile join, then created_by
      // Always coerce to string to avoid .trim() crash on numbers/objects from JSONB
      const toStr = (v: unknown) => (v && typeof v === "string" && v.trim() ? v.trim() : "");
      let requesterName = "Unknown";
      if (t.on_behalf_of && typeof t.on_behalf_of === "object" && !Array.isArray(t.on_behalf_of)) {
        const ob = t.on_behalf_of as Record<string, unknown>;
        requesterName = toStr(ob.name) || toStr(ob.full_name) || toStr(ob.department) || toStr(ob.institution) || "Unknown";
      } else if (t.assigned_by_profile && typeof t.assigned_by_profile === "object") {
        const abp = t.assigned_by_profile as Record<string, unknown>;
        requesterName = toStr(abp.full_name) || toStr(abp.email) || "Unknown";
      } else if (t.department && typeof t.department === "string") {
        requesterName = t.department.trim() || "Unknown";
      } else if (t.assigned_by) {
        const ab = profData?.find((p: any) => p.id === t.assigned_by);
        if (ab) requesterName = toStr(ab.full_name) || toStr(ab.email) || "Unknown";
      } else if (t.created_by) {
        const cb = profData?.find((p: any) => p.id === t.created_by);
        if (cb) requesterName = toStr(cb.full_name) || toStr(cb.email) || "Unknown";
      }

      const status = mapStatus(t.status);
      const completedAt = t.completed_at ? formatDate(t.completed_at) : (status === "Done" && t.updated_at ? formatDate(t.updated_at) : null);

      return {
        id: String(t.id),
        title: t.title || "Untitled Task",
        description: t.description || "",
        status,
        priority: t.priority === "high" || t.priority === "urgent" ? "High" : t.priority === "medium" ? "Medium" : "Low",
        category: t.category || t.department || "General",
        due_date: t.due_date || "",
        due_date_display: formatDate(t.due_date) || "No date",
        completed_at: t.completed_at || null,
        completed_at_display: completedAt,
        assignee_initials: getInitials(pName || ""),
        assignee_name: pName || "Unassigned",
        requester_name: requesterName,
        requester_initials: getInitials(requesterName),
        created_by: t.created_by || "",
        progress: t.progress || 0,
      };
    });

  useEffect(() => {
    if (!authLoading && (user?.institution_id || user?.tenant_id)) fetchTasksAndProfiles();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading, fetchTasksAndProfiles]);

  // Handle global quick create "?create=true" query parameter reactively
  useEffect(() => {
    if (createParam === "true" && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      setForm({
        title: "",
        description: "",
        status: "To Do",
        priority: "Medium",
        category: "General",
        due_date: "",
        assignee_id: user?.id || ""
      });
      setEditTask(null);
      setShowModal(true);

      // Clear query param reactively and cleanly
      const params = new URLSearchParams(window.location.search);
      params.delete("create");
      const newPath = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState(null, "", newPath);
    }
  }, [createParam, user?.id]);

  // ─── Create / Edit Task ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !user) return;
    setSaving(true);
    showToast("loading", editTask ? "Updating task..." : "Creating task...");
    try {
      const dbStatus = form.status.toLowerCase().replace(/ /g, "_");
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: user.role === "member" ? "todo" : (dbStatus === "on_hold" ? "on_hold" : dbStatus === "to_do" ? "todo" : dbStatus),
        priority: user.role === "member" ? "medium" : form.priority.toLowerCase(),
        department: form.category,
        due_date: form.due_date || null,
        updated_at: new Date().toISOString(),
      };

      if (editTask) {
        // Update completed_at when marking done
        if (form.status === "Done" && editTask.status !== "Done") {
          payload.completed_at = new Date().toISOString();
        } else if (form.status !== "Done") {
          payload.completed_at = null;
        }
        const { error } = await supabase.from("tasks").update(payload).eq("id", editTask.id);
        if (error) throw error;
        showToast("success", "Task updated!");
      } else {
        payload.institution_id = user.institution_id || null;
        payload.tenant_id = user.tenant_id || null;
        payload.created_by = user.id;
        payload.assigned_by = user.role === "admin" || user.role === "manager" ? (form.assignee_id || user.id) : user.id;
        payload.created_at = new Date().toISOString();
        if (form.status === "Done") payload.completed_at = new Date().toISOString();
        const { error } = await supabase.from("tasks").insert(payload);
        if (error) throw error;
        showToast("success", "Task created!");

        if (user.role !== 'admin' && user.role !== 'manager') {
          const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'manager']);
          if (admins && admins.length > 0) {
            const notifications = admins.map((a: any) => ({
              user_id: a.id,
              type: 'system',
              title: 'New Task Request',
              message: `${user.email || 'A user'} has requested a new task: ${payload.title}`,
              is_read: false,
              created_at: new Date().toISOString()
            }));
            await supabase.from('notifications').insert(notifications);
          }
        }
      }

      setShowModal(false);
      setEditTask(null);
      setForm({ title: "", description: "", status: "To Do", priority: "Medium", category: "General", due_date: "", assignee_id: user.id });
      await fetchTasksAndProfiles();
    } catch (err: any) {
      showToast("error", err.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle Done ────────────────────────────────────────────────────────────
  const toggleDone = async (task: Task) => {
    const isDone = task.status === "Done";
    const newStatus = isDone ? "todo" : "done";
    const newStatusUI: Task["status"] = isDone ? "To Do" : "Done";
    const completedAt = isDone ? null : new Date().toISOString();

    setTasks(prev => prev.map(t => t.id === task.id ? {
      ...t,
      status: newStatusUI,
      completed_at: completedAt,
      completed_at_display: completedAt ? formatDate(completedAt) : null
    } : t));
    await supabase.from("tasks").update({
      status: newStatus,
      completed_at: completedAt,
      updated_at: new Date().toISOString()
    }).eq("id", task.id);
  };

  // ─── Change Status ───────────────────────────────────────────────────────────
  const changeStatus = async (task: Task, newStatusUI: Task["status"]) => {
    const dbMap: Record<Task["status"], string> = {
      "To Do": "todo", "In Progress": "in_progress", "On Hold": "on_hold", "Done": "done"
    };
    const completedAt = newStatusUI === "Done" ? new Date().toISOString() : null;
    setTasks(prev => prev.map(t => t.id === task.id ? {
      ...t, status: newStatusUI,
      completed_at: completedAt,
      completed_at_display: completedAt ? formatDate(completedAt) : null
    } : t));
    await supabase.from("tasks").update({
      status: dbMap[newStatusUI],
      completed_at: completedAt,
      updated_at: new Date().toISOString()
    }).eq("id", task.id);
  };

  // ─── Delete Task ─────────────────────────────────────────────────────────────
  const handleDelete = async (task: Task) => {
    showToast("loading", "Deleting task...");
    setDeleteConfirm(null);
    const { error } = await supabase.from("tasks").update({ deleted: true, deleted_at: new Date().toISOString() }).eq("id", task.id);
    if (error) { showToast("error", "Failed to delete."); return; }
    setTasks(prev => prev.filter(t => t.id !== task.id));
    showToast("success", "Task deleted.");
  };

  // ─── Open Edit Modal ──────────────────────────────────────────────────────────
  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
      assignee_id: user?.id || "",
    });
    setShowModal(true);
  };

  // ─── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === "To Do").length,
      dueToday: tasks.filter(t => t.status !== "Done" && t.due_date && new Date(t.due_date).toDateString() === today).length,
      inProgress: tasks.filter(t => t.status === "In Progress").length,
      onHold: tasks.filter(t => t.status === "On Hold").length,
      done: tasks.filter(t => t.status === "Done").length,
    };
  }, [tasks]);

  // ─── Tab Filtering ────────────────────────────────────────────────────────────
  const tabFilteredTasks = useMemo(() => {
    const today = new Date().toDateString();
    if (activeTab === "today") {
      return tasks.filter(t =>
        (t.due_date && new Date(t.due_date).toDateString() === today) ||
        (t.status === "In Progress") ||
        (t.status === "On Hold")
      );
    }
    if (activeTab === "mine") {
      return tasks.filter(t => t.created_by === user?.id);
    }
    return tasks;
  }, [tasks, activeTab, user]);

  // ─── Search + Filter ──────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tabFilteredTasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tabFilteredTasks, search, statusFilter, priorityFilter]);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-sm font-semibold ${
              toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
              toast.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" :
              "bg-zinc-900/80 border-white/10 text-zinc-200"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 size={16} />}
            {toast.type === "error" && <AlertCircle size={16} />}
            {toast.type === "loading" && <Loader2 size={16} className="animate-spin" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── View Task Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewTask && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setViewTask(null)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg glass-panel rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div>
                  <h2 className="text-base font-bold text-white m-0">Task Details</h2>
                  <p className="text-[11px] text-zinc-500 m-0 mt-0.5">Full information about this task</p>
                </div>
                <button onClick={() => setViewTask(null)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Title</p>
                  <p className={`text-sm font-semibold ${viewTask.status === "Done" ? "line-through text-zinc-500" : "text-zinc-100"}`}>{viewTask.title}</p>
                </div>
                {viewTask.description && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{viewTask.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                    <span className={`px-2.5 py-0.5 text-[10px] font-semibold border rounded-full ${STATUS_COLORS[viewTask.status]}`}>{viewTask.status}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Priority</p>
                    <span className={`px-2.5 py-0.5 text-[10px] font-semibold border rounded-full ${PRIORITY_BG[viewTask.priority]}`}>{viewTask.priority}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Assignee</p>
                    <p className="text-xs text-zinc-300">{viewTask.assignee_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Requester</p>
                    <p className="text-xs text-zinc-300">{viewTask.requester_name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      {viewTask.status === "Done" ? "Completed On" : "Due Date"}
                    </p>
                    <p className="text-xs text-zinc-300">
                      {viewTask.status === "Done" ? (viewTask.completed_at_display || "—") : viewTask.due_date_display}
                    </p>
                  </div>
                  {viewTask.category && viewTask.category !== "General" && (
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Category</p>
                      <p className="text-xs text-zinc-300">{viewTask.category}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setViewTask(null); openEdit(viewTask); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Pencil size={12} /> Edit Task
                  </button>
                  <button
                    onClick={() => { setViewTask(null); toggleDone(viewTask); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <CheckCheck size={12} /> {viewTask.status === "Done" ? "Mark Undone" : "Mark Done"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm glass-panel rounded-3xl shadow-2xl overflow-hidden relative p-6 flex flex-col gap-4"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 size={16} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white m-0">Delete Task?</h3>
                <p className="text-xs text-zinc-500 mt-1 m-0">
                  &ldquo;<span className="text-zinc-300">{deleteConfirm.title}</span>&rdquo; will be permanently removed.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all cursor-pointer">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── New / Edit Task Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowModal(false); setEditTask(null); }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg glass-panel rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-base font-bold text-white m-0">{editTask ? "Edit Task" : "New Task"}</h2>
                  <p className="text-[11px] text-zinc-500 m-0 mt-0.5">
                    {editTask ? "Update task details" : "Create a task and assign it to your workspace"}
                  </p>
                </div>
                <button onClick={() => { setShowModal(false); setEditTask(null); }} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Task Title *</label>
                  <input
                    required autoFocus type="text" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Review Q2 campaign assets"
                    className="glass-form-input placeholder:text-zinc-500 w-full"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea
                    value={form.description} rows={3}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Optional — add context, acceptance criteria, links..."
                    className="glass-form-input placeholder:text-zinc-500 resize-none w-full"
                  />
                </div>

                {/* Status + Priority */}
                <div className="grid grid-cols-2 gap-4">
                  {!(user?.role === "member") && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Task["status"] }))}
                        className="glass-form-input cursor-pointer w-full">
                        <option className="bg-zinc-900" value="To Do">To Do</option>
                        <option className="bg-zinc-900" value="In Progress">In Progress</option>
                        <option className="bg-zinc-900" value="On Hold">On Hold</option>
                        <option className="bg-zinc-900" value="Done">Done</option>
                      </select>
                    </div>
                  )}
                  {!(user?.role === "member") && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Priority</label>
                      <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task["priority"] }))}
                        className="glass-form-input cursor-pointer w-full">
                        <option className="bg-zinc-900" value="High">High</option>
                        <option className="bg-zinc-900" value="Medium">Medium</option>
                        <option className="bg-zinc-900" value="Low">Low</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Category + Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Category / Department</label>
                    <input type="text" value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. Marketing, Editorial"
                      className="glass-form-input placeholder:text-zinc-500 w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Due Date</label>
                    <input type="date" value={form.due_date}
                      onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                      className="glass-form-input w-full" />
                  </div>
                </div>

                {/* Assignee */}
                {!editTask && (user?.role === "admin" || user?.role === "manager") && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Assignee</label>
                    <select value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}
                      className="glass-form-input cursor-pointer w-full">
                      {profiles.map((p: any) => (
                        <option key={p.id} value={p.id} className="bg-zinc-900">
                           {p.full_name || p.name || p.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="submit" disabled={saving || !form.title.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : editTask ? <Pencil size={15} /> : <Plus size={15} />}
                  {saving ? (editTask ? "Updating..." : "Creating...") : editTask ? "Update Task" : "Create Task"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Header ───────────────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} /> Workflows
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Tasks</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Manage, schedule, and collaborate on project action items.
            {!loading && (
              <span className="ml-2 text-zinc-500">
                — {stats.done}/{stats.total} done
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-950/40 border border-white/5 p-1 rounded-xl flex gap-1">
            {(["list", "kanban"] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${viewMode === v ? "bg-white/10 text-teal-400" : "text-zinc-500 hover:text-zinc-300"}`}>
                {v === "list" ? <List size={14} /> : <LayoutGrid size={14} />}
                <span className="capitalize">{v}</span>
              </button>
            ))}
          </div>

          <button onClick={() => { setEditTask(null); setForm({ title: "", description: "", status: "To Do", priority: "Medium", category: "General", due_date: "", assignee_id: user?.id || "" }); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer">
            <Plus size={16} /> New Task
          </button>
        </div>
      </header>

      {/* ─── Stats Cards ──────────────────────────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <StatCard label="Total" value={stats.total} icon={ListTodo} color="bg-blue-500" />
          <StatCard label="To Do" value={stats.todo} icon={Clock} color="bg-zinc-500" />
          <StatCard label="Due Today" value={stats.dueToday} icon={AlertTriangle} color="bg-amber-500" />
          <StatCard label="In Progress" value={stats.inProgress} icon={TrendingUp} color="bg-purple-500" />
          <StatCard label="On Hold" value={stats.onHold} icon={Pause} color="bg-amber-500" />
          <StatCard label="Done" value={stats.done} icon={CheckCheck} color="bg-emerald-500" />
        </div>
      )}

      {/* ─── Tabs + Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Tab bar + search/filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-zinc-950/40 border border-white/5 p-1 rounded-xl">
            {([
              { key: "today", label: "Today Focus" },
              { key: "all", label: "All Tasks" },
              { key: "mine", label: "My Requests" },
            ] as { key: TabType; label: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-teal-500/20 to-indigo-500/20 border border-teal-500/30 text-teal-300"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {!loading && (
                  <span className={`ml-1.5 text-[9px] px-1 py-0.5 rounded-full ${activeTab === tab.key ? "bg-teal-500/20 text-teal-400" : "bg-zinc-800 text-zinc-600"}`}>
                    {tab.key === "today"
                      ? tasks.filter(t => (t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()) || t.status === "In Progress" || t.status === "On Hold").length
                      : tab.key === "mine"
                      ? tasks.filter(t => t.created_by === user?.id).length
                      : tasks.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input type="text" placeholder="Search tasks..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 transition-all font-sans" />
          </div>

          {/* Filter toggle */}
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${showFilters ? "bg-teal-500/10 border-teal-500/30 text-teal-400" : "bg-zinc-900/50 hover:bg-zinc-800 border-white/5 text-zinc-300"}`}>
            <Filter size={14} /> Filters
            {(statusFilter !== "All" || priorityFilter !== "All") && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            )}
          </button>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-3 px-1 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status:</span>
                {["All", "To Do", "In Progress", "On Hold", "Done"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                      statusFilter === s ? "bg-teal-500/10 text-teal-400 border-teal-500/30" : "bg-zinc-900/40 text-zinc-500 border-white/5 hover:text-zinc-300"
                    }`}>{s}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Priority:</span>
                {["All", "High", "Medium", "Low"].map(p => (
                  <button key={p} onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                      priorityFilter === p ? "bg-teal-500/10 text-teal-400 border-teal-500/30" : "bg-zinc-900/40 text-zinc-500 border-white/5 hover:text-zinc-300"
                    }`}>{p}</button>
                ))}
              </div>
              {(statusFilter !== "All" || priorityFilter !== "All") && (
                <button onClick={() => { setStatusFilter("All"); setPriorityFilter("All"); }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Views ───────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-[500px]">
        {loading ? (
          <div className="flex items-center gap-3 text-zinc-500 text-sm py-10 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading tasks...
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── List View ─────────────────────────────────────────────────────── */}
            {viewMode === "list" && (
              <motion.div key={`list-${activeTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="flex flex-col gap-2">

                {/* Column Headers */}
                <div className="grid gap-4 px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5"
                  style={{ gridTemplateColumns: "minmax(0,3fr) minmax(0,1.5fr) minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr) auto" }}>
                  <div>Task</div>
                  <div>Requester</div>
                  <div>Assignee</div>
                  <div>Priority</div>
                  <div>Status</div>
                  <div>Date</div>
                  <div className="w-20 text-right">Ops</div>
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-center text-zinc-600">
                      <CheckSquare size={22} />
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm font-semibold m-0">No tasks found</p>
                      <p className="text-zinc-600 text-xs m-0 mt-1">
                        {search || statusFilter !== "All" || priorityFilter !== "All"
                          ? "Try adjusting your search or filters"
                          : activeTab === "today" ? "No tasks due today or in progress"
                          : activeTab === "mine" ? "You haven't created any tasks"
                          : "Click New Task to create your first one"}
                      </p>
                    </div>
                    {!search && statusFilter === "All" && priorityFilter === "All" && activeTab === "all" && (
                      <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-xs font-semibold cursor-pointer">
                        <Plus size={13} /> New Task
                      </button>
                    )}
                  </div>
                ) : (
                  <AnimatedList className="!gap-1.5">
                    {filteredTasks.map(task => (
                      <div key={task.id}
                        className="grid gap-4 items-center px-4 py-3 rounded-xl glass-card transition-all group hover:bg-white/[0.03]"
                        style={{ gridTemplateColumns: "minmax(0,3fr) minmax(0,1.5fr) minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr) auto" }}>

                        {/* Title + checkbox */}
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            onClick={() => toggleDone(task)}
                            title={task.status === "Done" ? "Mark incomplete" : "Mark as done"}
                            className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                              task.status === "Done"
                                ? "bg-teal-500 border-teal-500 text-white"
                                : "border-zinc-700 hover:border-teal-500/50"
                            }`}
                          >
                            {task.status === "Done" && <CheckSquare className="w-2.5 h-2.5" />}
                          </button>
                          <div className="flex flex-col gap-0.5 min-w-0 w-full">
                            <span className={`text-sm font-medium truncate ${task.status === "Done" ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                              {task.title}
                            </span>
                            {task.category && task.category !== "General" && (
                              <span className="text-[9px] font-bold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-wider w-fit">
                                {task.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Requester */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-400">
                            {task.requester_initials}
                          </div>
                          <span className="text-xs text-zinc-400 truncate">{task.requester_name}</span>
                        </div>

                        {/* Assignee */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-teal-500/20 flex items-center justify-center text-[9px] font-bold text-teal-400">
                            {task.assignee_initials}
                          </div>
                          <span className="text-xs text-zinc-400 truncate">{task.assignee_name}</span>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center gap-1">
                          <Flag size={10} className={PRIORITY_COLORS[task.priority]} />
                          <span className={`text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                        </div>

                        {/* Status — clickable cycle */}
                        <div>
                          <button
                            onClick={() => {
                              const cycle: Task["status"][] = ["To Do", "In Progress", "On Hold", "Done"];
                              const idx = cycle.indexOf(task.status);
                              changeStatus(task, cycle[(idx + 1) % cycle.length]);
                            }}
                            title="Click to change status"
                            className={`px-2 py-0.5 text-[9px] font-semibold border rounded-full whitespace-nowrap transition-all cursor-pointer hover:opacity-80 ${STATUS_COLORS[task.status]}`}>
                            {task.status}
                          </button>
                        </div>

                        {/* Date — Due or Completed */}
                        <div className="flex items-center gap-1.5 text-xs min-w-0">
                          {task.status === "Done" ? (
                            <>
                              <CheckCheck size={11} className="text-emerald-500 flex-shrink-0" />
                              <span className="text-emerald-400 truncate text-[10px]">{task.completed_at_display || "—"}</span>
                            </>
                          ) : (
                            <>
                              <Calendar size={11} className={`flex-shrink-0 ${isToday(task.due_date) ? "text-amber-400" : "text-zinc-600"}`} />
                              <span className={`truncate text-[10px] ${isToday(task.due_date) ? "text-amber-300 font-semibold" : "text-zinc-400"}`}>
                                {isToday(task.due_date) ? "Today" : task.due_date_display}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Action icons */}
                        <div className="flex items-center gap-1 w-20 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewTask(task)}
                            title="View"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-teal-400 hover:bg-teal-500/10 transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => openEdit(task)}
                            title="Edit"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(task)}
                            title="Delete"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </AnimatedList>
                )}
              </motion.div>
            )}

            {/* ── Kanban View ──────────────────────────────────────────────────── */}
            {viewMode === "kanban" && (
              <motion.div key={`kanban-${activeTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {KANBAN_COLS.map(col => {
                  const colTasks = filteredTasks.filter(t => t.status === col);
                  const dotColor = col === "Done" ? "bg-emerald-500" : col === "In Progress" ? "bg-purple-500" : col === "On Hold" ? "bg-amber-500" : "bg-zinc-500";
                  return (
                    <div key={col} className="flex flex-col gap-3 glass-panel p-4 rounded-2xl min-h-[400px] relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-48 h-48 blur-[60px] rounded-full pointer-events-none opacity-20 ${dotColor}`} />
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{col}</span>
                          <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                        </div>
                        <button onClick={() => { setForm(f => ({ ...f, status: col })); setShowModal(true); }}
                          className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer">
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                        {colTasks.length === 0 && (
                          <div className="flex-1 flex items-center justify-center">
                            <p className="text-[11px] text-zinc-600 text-center">No tasks here</p>
                          </div>
                        )}
                        <AnimatedList className="!gap-3">
                          {colTasks.map(task => (
                            <motion.div key={task.id} whileHover={{ y: -2 }}
                              className="glass-card rounded-xl p-4 flex flex-col gap-3 transition-colors group">
                              <div className="flex items-start justify-between gap-2">
                                {task.category && task.category !== "General" && (
                                  <span className="text-[9px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 truncate max-w-[80px]">
                                    {task.category}
                                  </span>
                                )}
                                <div className="flex items-center gap-1 ml-auto">
                                  <Flag size={9} className={PRIORITY_COLORS[task.priority]} />
                                  <span className={`text-[9px] font-bold ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                                </div>
                              </div>

                              <div className={`text-xs font-semibold leading-normal ${task.status === "Done" ? "line-through text-zinc-500" : "text-zinc-200"}`}>{task.title}</div>
                              {task.description && (
                                <p className="text-[10px] text-zinc-500 m-0 leading-relaxed line-clamp-2">{task.description}</p>
                              )}

                              {/* Requester row */}
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                <User size={9} />
                                <span className="truncate">{task.requester_name}</span>
                              </div>

                              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                  {task.status === "Done" ? (
                                    <>
                                      <CheckCheck size={9} className="text-emerald-500" />
                                      <span className="text-emerald-400">{task.completed_at_display || "—"}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Calendar size={9} />
                                      <span className={isToday(task.due_date) ? "text-amber-400 font-semibold" : ""}>
                                        {isToday(task.due_date) ? "Today" : task.due_date_display}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Action icons on kanban card */}
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setViewTask(task)} title="View"
                                      className="w-5 h-5 rounded flex items-center justify-center text-zinc-600 hover:text-teal-400 hover:bg-teal-500/10 transition-all cursor-pointer">
                                      <Eye size={10} />
                                    </button>
                                    <button onClick={() => openEdit(task)} title="Edit"
                                      className="w-5 h-5 rounded flex items-center justify-center text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer">
                                      <Pencil size={10} />
                                    </button>
                                    <button onClick={() => setDeleteConfirm(task)} title="Delete"
                                      className="w-5 h-5 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-teal-500/20 flex items-center justify-center text-[9px] font-bold text-teal-400"
                                    title={task.assignee_name}>
                                    {task.assignee_initials}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatedList>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
