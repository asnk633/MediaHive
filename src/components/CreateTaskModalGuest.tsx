"use client";

import { useState } from "react";
import { useClientData } from "@/app/(shell)/ClientDataContext";
import ModalBase from "@/components/ModalBase";
import { Loader2 } from "lucide-react";

export default function CreateTaskModalGuest({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const { createTask } = useClientData();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined
      });
      onClose();
      setTitle("");
      setDescription("");
    } catch (err) {
      setError("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalBase
      open={open}
      onClose={onClose}
      panelClass="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      overlayClass="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#102220]/90 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">
        <header className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">New Request</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
          </button>
        </header>

        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-emerald-100/80">
              What needs to be done? <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g., Fix leaking tap in Room 101"
              className={`w-full rounded-xl border bg-black/20 px-4 py-3 text-white placeholder-white/30 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${error ? "border-red-500/50" : "border-white/10"}`}
              autoFocus
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-emerald-100/80">
              Additional Details (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context..."
              className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-white/30 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 font-semibold text-black shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
