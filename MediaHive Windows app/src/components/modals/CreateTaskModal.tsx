"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle, Check } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "To Do",
    priority: "Medium",
    category: "General",
    due_date: "",
    assignee_id: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setForm({
        title: "",
        description: "",
        status: "To Do",
        priority: "Medium",
        category: "General",
        due_date: "",
        assignee_id: user.id || "",
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user]);

  // Fetch profiles for Assignee select (only admins and managers can assign to others)
  useEffect(() => {
    if (!isOpen || !user) return;
    const isPrivileged = user.role === "admin" || user.role === "manager";
    if (!isPrivileged) return;

    async function fetchProfiles() {
      setLoadingProfiles(true);
      try {
        let query = supabase.from("profiles").select("id, full_name, email");
        if (user?.institution_id) {
          query = query.eq("institution_id", user.institution_id);
        } else if (user?.tenant_id) {
          query = query.eq("tenant_id", user.tenant_id);
        }
        const { data, error } = await query;
        if (error) throw error;
        setProfiles(data || []);
      } catch (err: any) {
        console.error("Failed to fetch profiles:", err?.message);
      } finally {
        setLoadingProfiles(false);
      }
    }
    fetchProfiles();
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !user) return;

    setSaving(true);
    setError(null);

    try {
      const dbStatus = form.status.toLowerCase().replace(/ /g, "_");
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: user.role === "member" ? "todo" : (dbStatus === "on_hold" ? "on_hold" : dbStatus === "to_do" ? "todo" : dbStatus),
        priority: user.role === "member" ? "medium" : form.priority.toLowerCase(),
        department: form.category,
        due_date: form.due_date || null,
        institution_id: user.institution_id || null,
        tenant_id: user.tenant_id || null,
        created_by: user.id,
        assigned_by: user.role === "admin" || user.role === "manager" ? (form.assignee_id || user.id) : user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (payload.status === "done") {
        payload.completed_at = new Date().toISOString();
      }

      // Insert Task
      const { error: insertError } = await supabase.from("tasks").insert(payload);
      if (insertError) throw insertError;

      // Insert admin notifications for guest/team requests
      if (user.role !== "admin" && user.role !== "manager") {
        const { data: admins, error: adminError } = await supabase
          .from("profiles")
          .select("id")
          .in("role", ["admin", "manager"]);
          
        if (!adminError && admins && admins.length > 0) {
          const notifications = admins.map((a: any) => ({
            user_id: a.id,
            type: "system",
            title: user.role === "member" ? "New Guest Task Request" : "New Task Request",
            message: `${user.name || user.email || "A team user"} has created a new task: ${payload.title}`,
            is_read: false,
            created_at: new Date().toISOString(),
          }));
          await supabase.from("notifications").insert(notifications);
        }
      }

      setSuccess(true);
      window.dispatchEvent(new CustomEvent("mediahive:dashboard-refresh"));
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to create task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isPrivileged = user?.role === "admin" || user?.role === "manager";
  const isGuest = user?.role === "member";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="studio-panel border-white/10 max-w-md w-full text-[var(--text-primary)] p-6 shadow-2xl !flex !flex-col !gap-4 max-h-[90vh] overflow-y-auto !h-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-wide text-[var(--text-primary)]">
            Create New Task
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a new task in the workspace.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Check size={24} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-[var(--accent)]">Task created successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Task Title *
              </label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="What needs to be done?"
                disabled={saving}
                className="glass-form-input placeholder:text-[var(--text-tertiary)] w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Provide task details or links..."
                rows={3}
                disabled={saving}
                className="glass-form-input placeholder:text-[var(--text-tertiary)] w-full resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Category / Department
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. general"
                  disabled={saving}
                  className="glass-form-input placeholder:text-[var(--text-tertiary)] w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  disabled={saving}
                  className="glass-form-input w-full"
                />
              </div>
            </div>

            {!isGuest && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    disabled={saving}
                    className="glass-form-input cursor-pointer w-full"
                  >
                    <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="To Do">To Do</option>
                    <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="In Progress">In Progress</option>
                    <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="On Hold">On Hold</option>
                    <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="Done">Done</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    disabled={saving}
                    className="glass-form-input cursor-pointer w-full"
                  >
                    <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="High">High</option>
                    <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="Medium">Medium</option>
                    <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="Low">Low</option>
                  </select>
                </div>
              </div>
            )}

            {isPrivileged && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Assignee
                </label>
                {loadingProfiles ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] py-2">
                    <Loader2 className="animate-spin" size={14} />
                    <span>Loading team members...</span>
                  </div>
                ) : (
                  <select
                    value={form.assignee_id}
                    onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
                    disabled={saving}
                    className="glass-form-input cursor-pointer w-full"
                  >
                    {profiles.map((p: any) => (
                      <option key={p.id} value={p.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
                        {p.full_name || p.name || p.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--bg-primary)] text-sm font-semibold py-2.5 rounded-full active:scale-[0.98] transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating Task...</span>
                </>
              ) : (
                <span>Create Task</span>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

