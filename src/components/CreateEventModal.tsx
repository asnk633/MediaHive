"use client";

import { useState } from "react";
// Events temporarily disabled
import ModalBase from "@/components/ModalBase";
import { DateSelector } from "@/components/ui/selectors/DateSelector";
import { TimeSelector } from "@/components/ui/selectors/TimeSelector";
import { format } from "date-fns";
import { useFormState } from "@/hooks/useFormState";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { DraftIndicator } from "@/components/ui/DraftIndicator";

type Role = "admin" | "manager" | "team" | "member";

export default function CreateEventModal({ open, role, onClose }: { open: boolean; role: Role; onClose: () => void; }) {
  // Events temporarily disabled — no-op stub
  const createEvent = async (_: any) => { console.warn("Events disabled"); };
  const { state: formData, setState: setFormData, clearDraft, isDraftSaved } = useFormState({
    key: 'draft:event:new',
    initialState: {
      title: "",
      desc: "",
      start: "",
      end: "",
      loc: ""
    }
  });

  const { title, desc, start, end, loc } = formData;
  const setTitle = (val: string) => setFormData(prev => ({ ...prev, title: val }));
  const setDesc = (val: string) => setFormData(prev => ({ ...prev, desc: val }));
  const setStart = (val: string) => setFormData(prev => ({ ...prev, start: val }));
  const setEnd = (val: string) => setFormData(prev => ({ ...prev, end: val }));
  const setLoc = (val: string) => setFormData(prev => ({ ...prev, loc: val }));

  const hint =
    role === "member" ? "Admin will review and assign resources after submission."
      : role === "team" ? "Ensure both date/time fields are filled."
        : "Set visibility and attendees before creating.";

  const submitEvent = async () => {
    if (!title.trim() || !start) throw new Error("Title and Start Date required");
    await createEvent({ title: title.trim(), description: desc.trim(), startAt: start, endAt: end || null, location: loc.trim() });
  };

  const { isSubmitting, handleSubmit } = useFormSubmit({
    onSubmit: submitEvent,
    onSuccess: () => {
        clearDraft();
        onClose();
        setTitle(""); setDesc(""); setStart(""); setEnd(""); setLoc("");
    }
  });

  const submit = async () => {
    await handleSubmit(undefined);
  };

  return (
    <ModalBase open={open} onClose={onClose}>
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">Create New Event</h3>
          <DraftIndicator isSaved={isDraftSaved} />
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
      </header>
      <p className="mb-3 rounded-lg bg-white/5 p-3 text-sm text-white/80">{hint}</p>
      <div className="space-y-4">
        <label className="block">
          <p className="pb-2">Event Title</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 w-full rounded-lg bg-[#333] px-4" />
        </label>
        <label className="block">
          <p className="pb-2">Event Description</p>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-28 w-full rounded-lg bg-[#333] p-4" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            <DateSelector 
              label="Start Date"
              date={start ? new Date(start) : undefined}
              onChange={(date) => {
                if (!date) return;
                const newDate = new Date(date);
                if (start) {
                  const current = new Date(start);
                  newDate.setHours(current.getHours());
                  newDate.setMinutes(current.getMinutes());
                }
                setStart(newDate.toISOString());
              }}
            />
            <TimeSelector 
              label="Start Time"
              value={start ? format(new Date(start), "HH:mm") : "09:00"}
              onChange={(time) => {
                const [h, m] = time.split(':').map(Number);
                const newDate = start ? new Date(start) : new Date();
                newDate.setHours(h);
                newDate.setMinutes(m);
                setStart(newDate.toISOString());
              }}
            />
          </div>
          <div className="space-y-4">
            <DateSelector 
              label="End Date"
              date={end ? new Date(end) : undefined}
              onChange={(date) => {
                if (!date) return;
                const newDate = new Date(date);
                if (end) {
                  const current = new Date(end);
                  newDate.setHours(current.getHours());
                  newDate.setMinutes(current.getMinutes());
                }
                setEnd(newDate.toISOString());
              }}
            />
            <TimeSelector 
              label="End Time"
              value={end ? format(new Date(end), "HH:mm") : "18:00"}
              onChange={(time) => {
                const [h, m] = time.split(':').map(Number);
                const newDate = end ? new Date(end) : new Date();
                newDate.setHours(h);
                newDate.setMinutes(m);
                setEnd(newDate.toISOString());
              }}
            />
          </div>
        </div>
        <label className="block">
          <p className="pb-2">Location / Link</p>
          <input value={loc} onChange={(e) => setLoc(e.target.value)} className="h-12 w-full rounded-lg bg-[#333] px-4" />
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={isSubmitting} className="rounded-md bg-white/10 px-4 py-2 disabled:opacity-50">Cancel</button>
        <button onClick={submit} disabled={isSubmitting} className="rounded-md bg-[#00BFA6] px-4 py-2 font-semibold text-black flex items-center gap-2 disabled:opacity-50">
            {isSubmitting && <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />}
            {role === "member" ? "Submit for Review" : "Create Event"}
        </button>
      </div>
    </ModalBase>
  );
}
