"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckSquare, Calendar, Pencil, CheckCheck, X, AlertTriangle, MessageSquare, Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContextProvider";

interface RequestItem {
  id: string;
  type: "task" | "event";
  title: string;
  description: string;
  status: string;
  created_at: string;
  created_by: string;
  creator_name?: string;
  dueDateOrStart?: string;
}

export function RequestsWidget() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeItem, setActiveItem] = useState<RequestItem | null>(null);
  const [modalType, setModalType] = useState<"edit" | "approve" | "reject" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit State
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  // Reject State
  const [rejectReason, setRejectReason] = useState("");
  // Approve State
  const [assigneeId, setAssigneeId] = useState("");

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) return;
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const tenantFilter = user?.tenant_id ? { tenant_id: user.tenant_id } : user?.institution_id ? { institution_id: user.institution_id } : {};

      // Fetch profiles
      const { data: profData } = await supabase.from("profiles").select("id, full_name, email, role");
      const activeProfiles = profData || [];
      setProfiles(activeProfiles);

      // Fetch tasks (todo)
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("status", "todo")
        .eq("deleted", false)
        .match(tenantFilter);

      // Fetch events (pending or Scheduled)
      // Since user approved 'pending', we will check for 'pending' or 'Scheduled' as fallback
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .in("status", ["pending", "Scheduled"])
        .eq("deleted", false)
        .match(tenantFilter);

      const combined: RequestItem[] = [];

      (tasksData || []).forEach((t: any) => {
        combined.push({
          id: String(t.id),
          type: "task",
          title: t.title || "Untitled Task",
          description: t.description || "",
          status: t.status,
          created_at: t.created_at,
          created_by: t.created_by,
          dueDateOrStart: t.due_date
        });
      });

      (eventsData || []).forEach((e: any) => {
        combined.push({
          id: String(e.id),
          type: "event",
          title: e.title || "Untitled Event",
          description: e.description || "",
          status: e.status,
          created_at: e.created_at,
          created_by: e.created_by,
          dueDateOrStart: e.start_at
        });
      });

      // Filter out admin/manager creators
      const filtered = combined.filter(item => {
        const creatorProfile = activeProfiles.find(p => p.id === item.created_by);
        if (!creatorProfile) return true; // keep if unknown
        const role = creatorProfile.role?.toLowerCase();
        return role !== "admin" && role !== "manager";
      });

      // Map creator names
      const finalRequests = filtered.map(item => {
        const creatorProfile = activeProfiles.find(p => p.id === item.created_by);
        return {
          ...item,
          creator_name: creatorProfile?.full_name || creatorProfile?.email || "Unknown User"
        };
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRequests(finalRequests);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item: RequestItem, type: "edit" | "approve" | "reject") => {
    setActiveItem(item);
    setModalType(type);
    if (type === "edit") {
      setEditForm({ title: item.title, description: item.description });
    }
    setRejectReason("");
    setAssigneeId(user?.id || "");
  };

  const closeModal = () => {
    setActiveItem(null);
    setModalType(null);
  };

  const sendNotification = async (targetId: string, title: string, message: string) => {
    await supabase.from("notifications").insert({
      user_id: targetId,
      type: "system",
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    });
  };

  const handleAction = async () => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      if (modalType === "edit") {
        if (activeItem.type === "task") {
          await supabase.from("tasks").update({ title: editForm.title, description: editForm.description }).eq("id", activeItem.id);
        } else {
          await supabase.from("events").update({ title: editForm.title, description: editForm.description }).eq("id", activeItem.id);
        }
        await sendNotification(activeItem.created_by, "Request Edited", `Your ${activeItem.type} request '${activeItem.title}' was modified by an admin.`);
      } 
      else if (modalType === "approve") {
        if (activeItem.type === "task") {
          await supabase.from("tasks").update({ status: "in_progress", assignee_id: assigneeId }).eq("id", activeItem.id);
        } else {
          await supabase.from("events").update({ status: "Approved" }).eq("id", activeItem.id);
        }
        await sendNotification(activeItem.created_by, "Request Approved", `Your ${activeItem.type} request '${activeItem.title}' has been approved.`);
      } 
      else if (modalType === "reject") {
        if (activeItem.type === "task") {
          await supabase.from("tasks").update({ status: "rejected", deleted: true }).eq("id", activeItem.id);
        } else {
          await supabase.from("events").update({ status: "Rejected", deleted: true }).eq("id", activeItem.id);
        }
        await sendNotification(activeItem.created_by, "Request Rejected", `Your ${activeItem.type} request '${activeItem.title}' was rejected. Reason: ${rejectReason}`);
      }

      closeModal();
      fetchRequests();
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5 flex flex-col gap-4 relative overflow-hidden w-full"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--text-primary)] m-0">Tasks & Events requests</h2>
              {requests.length > 0 && (
                <span className="bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {requests.length} New
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] m-0 mt-0.5 uppercase tracking-wider font-bold">
              Pending submissions from team members
            </p>
          </div>
        </div>

        <div className={`flex flex-col gap-2.5 z-10 overflow-y-auto pr-2 custom-scrollbar ${requests.length > 0 ? 'max-h-[400px]' : 'h-[250px] justify-center'}`}>
          {loading ? (
            <div className="text-sm text-zinc-500 flex flex-col items-center justify-center h-full">Loading requests...</div>
          ) : requests.length > 0 ? (
            requests.map(item => (
              <div key={item.id + item.type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)] transition-colors relative group">
                <div className="flex items-start gap-3 flex-1 min-w-0 pl-1">
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-md border flex items-center justify-center ${item.type === 'task' ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]' : 'bg-violet-500/10 border-violet-500/30 text-violet-400'}`}>
                    {item.type === 'task' ? <CheckSquare size={14} /> : <Calendar size={14} />}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 w-full">
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">{item.title}</span>
                    <span className="text-xs text-zinc-400 truncate max-w-[90%]">{item.description || "No description"}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        By: {item.creator_name}
                      </span>
                      <span className="text-[10px] text-zinc-600 border border-zinc-700/50 px-1.5 rounded bg-zinc-900/50">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openModal(item, "approve")} className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20" title="Approve">
                    <CheckCheck size={14} />
                  </button>
                  <button onClick={() => openModal(item, "edit")} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-white/5" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => openModal(item, "reject")} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20" title="Reject">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-zinc-500 flex flex-col items-center justify-center h-full gap-2">
              <CheckSquare size={24} className="text-zinc-700" />
              No pending requests at the moment.
            </div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {activeItem && modalType && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden relative p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] capitalize">{modalType} Request</h3>
                <button onClick={closeModal} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"><X size={14} /></button>
              </div>

              <div className="mb-4">
                <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">{activeItem.type}</span>
                <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{activeItem.title}</p>
              </div>

              {modalType === "edit" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Title</label>
                    <input 
                      value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Description</label>
                    <textarea 
                      value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3}
                      className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none" 
                    />
                  </div>
                </div>
              )}

              {modalType === "approve" && activeItem.type === "task" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Assign To</label>
                  <select 
                    value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                    className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === "reject" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Reason (Required)</label>
                  <textarea 
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Please provide feedback to the creator..."
                    className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none" 
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="flex-1 py-2 rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-semibold transition-colors cursor-pointer">
                  Cancel
                </button>
                <button 
                  onClick={handleAction} 
                  disabled={submitting || (modalType === "reject" && !rejectReason.trim()) || (modalType === "edit" && !editForm.title.trim())}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    modalType === "approve" ? "bg-[var(--success)] text-white hover:bg-[var(--success)]/90" : 
                    modalType === "reject" ? "bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90" : 
                    "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {modalType === "approve" ? "Approve" : modalType === "reject" ? "Reject" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
