"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle, Check } from "lucide-react";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateEventModal({ isOpen, onClose }: CreateEventModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    start_at: "",
    end_at: "",
    production_stage: "Planning",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setForm({
        title: "",
        description: "",
        location: "",
        start_at: "",
        end_at: "",
        production_stage: "Planning",
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !user) return;

    // Check dates validation
    if (form.start_at && form.end_at && new Date(form.start_at) > new Date(form.end_at)) {
      setError("Start time cannot be after end time.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        institution_id: user.institution_id || null,
        tenant_id: user.tenant_id || null,
        created_by: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
        production_stage: form.production_stage,
        deleted: false,
      };

      const { error: insertError } = await supabase.from("events").insert(payload);
      if (insertError) throw insertError;

      setSuccess(true);
      window.dispatchEvent(new CustomEvent("mediahive:dashboard-refresh"));
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to schedule event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-panel border-white/10 max-w-md w-full text-zinc-100 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-wide text-white">
            Schedule New Event
          </DialogTitle>
          <DialogDescription className="sr-only">
            Schedule a new event in the workspace.
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
            <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Check size={24} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-teal-300">Event scheduled successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Event Title *
              </label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="What is the event title?"
                disabled={saving}
                className="glass-form-input placeholder:text-zinc-500 w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Details about the meeting or shoot..."
                rows={3}
                disabled={saving}
                className="glass-form-input placeholder:text-zinc-500 w-full resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Conference Room A, Studio 3"
                disabled={saving}
                className="glass-form-input placeholder:text-zinc-500 w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Start Date/Time
                </label>
                <input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))}
                  disabled={saving}
                  className="glass-form-input w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  End Date/Time
                </label>
                <input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
                  disabled={saving}
                  className="glass-form-input w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Production Stage
              </label>
              <select
                value={form.production_stage}
                onChange={(e) => setForm((f) => ({ ...f, production_stage: e.target.value }))}
                disabled={saving}
                className="glass-form-input cursor-pointer w-full"
              >
                <option className="bg-zinc-950 text-white" value="Planning">Planning</option>
                <option className="bg-zinc-950 text-white" value="Pre-production">Pre-production</option>
                <option className="bg-zinc-950 text-white" value="Production">Production</option>
                <option className="bg-zinc-950 text-white" value="Post-production">Post-production</option>
                <option className="bg-zinc-950 text-white" value="Complete">Complete</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <span>Schedule Event</span>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
