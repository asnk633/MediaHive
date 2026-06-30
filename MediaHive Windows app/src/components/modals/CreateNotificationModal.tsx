"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle, Check } from "lucide-react";

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateNotificationModal({ isOpen, onClose }: CreateNotificationModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "System",
    targetRole: "All",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setForm({
        title: "",
        message: "",
        type: "System",
        targetRole: "All",
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim() || !user) return;

    setSaving(true);
    setError(null);

    try {
      // 1. Determine target profiles
      let profilesQuery = supabase.from("profiles").select("id, role");
      
      if (user.institution_id) {
        profilesQuery = profilesQuery.eq("institution_id", user.institution_id);
      } else if (user.tenant_id) {
        profilesQuery = profilesQuery.eq("tenant_id", user.tenant_id);
      }

      if (form.targetRole !== "All") {
        profilesQuery = profilesQuery.eq("role", form.targetRole.toLowerCase());
      }

      const { data: targetProfiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      if (!targetProfiles || targetProfiles.length === 0) {
        throw new Error(`No active users found for target group "${form.targetRole}".`);
      }

      // 2. Map and insert notifications
      const notifications = targetProfiles.map((p: any) => ({
        user_id: p.id,
        type: form.type.toLowerCase(),
        title: form.title.trim(),
        message: form.message.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase.from("notifications").insert(notifications);
      if (insertError) throw insertError;

      setSuccess(true);
      window.dispatchEvent(new CustomEvent("mediahive:dashboard-refresh"));
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to broadcast notification. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="studio-panel border-white/10 max-w-md w-full text-[var(--text-primary)] p-6 shadow-2xl !flex !flex-col !gap-4 max-h-[90vh] overflow-y-auto !h-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-wide text-[var(--text-primary)]">
            Broadcast Notification
          </DialogTitle>
          <DialogDescription className="sr-only">
            Broadcast a system notification to targeted roles.
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
            <span className="text-sm font-semibold text-[var(--accent)]">Broadcast sent successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Broadcast Title *
              </label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Alert title (e.g., Maintenance Window)"
                disabled={saving}
                className="glass-form-input placeholder:text-[var(--text-tertiary)] w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Message Content *
              </label>
              <textarea
                required
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Enter alert message details for recipients..."
                rows={3}
                disabled={saving}
                className="glass-form-input placeholder:text-[var(--text-tertiary)] w-full resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Alert Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  disabled={saving}
                  className="glass-form-input cursor-pointer w-full"
                >
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="System">System</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="Alert">Alert</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="Info">Info</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="Warning">Warning</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Target Audience
                </label>
                <select
                  value={form.targetRole}
                  onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
                  disabled={saving}
                  className="glass-form-input cursor-pointer w-full"
                >
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="All">All Workspace Users</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="Admin">Admins Only</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="Manager">Managers Only</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="Team">Team Members Only</option>
                  <option className="bg-[var(--bg-primary)] text-[var(--text-primary)]" value="Member">Guests Only</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !form.title.trim() || !form.message.trim()}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--bg-primary)] text-sm font-semibold py-2.5 rounded-full active:scale-[0.98] transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <span>Send Broadcast</span>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

