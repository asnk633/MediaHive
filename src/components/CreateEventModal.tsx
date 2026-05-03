"use client";

import { useState } from "react";
// Events temporarily disabled
import ModalBase from "@/components/ModalBase";

type Role = "admin" | "team" | "guest";

export default function CreateEventModal({ open, role, onClose }: { open: boolean; role: Role; onClose: () => void; }) {
  // Events temporarily disabled — no-op stub
  const createEvent = async (_: any) => { console.warn("Events disabled"); };
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loc, setLoc] = useState("");

  const hint =
    role === "guest" ? "Admin will review and assign resources after submission."
      : role === "team" ? "Ensure both date/time fields are filled."
        : "Set visibility and attendees before creating.";

  const submit = async () => {
    if (!title.trim() || !start) return;
    try { await createEvent({ title: title.trim(), description: desc.trim(), startAt: start, endAt: end || null, location: loc.trim() }); onClose(); setTitle(""); setDesc(""); setStart(""); setEnd(""); setLoc(""); } catch { }
  };

  return (
    <ModalBase open={open} onClose={onClose}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold">Create New Event</h3>
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
          <label className="block">
            <p className="pb-2">Start Date &amp; Time*</p>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="h-12 w-full rounded-lg bg-[#333] px-3 [color-scheme:dark]" />
          </label>
          <label className="block">
            <p className="pb-2">End Date &amp; Time</p>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="h-12 w-full rounded-lg bg-[#333] px-3 [color-scheme:dark]" />
          </label>
        </div>
        <label className="block">
          <p className="pb-2">Location / Link</p>
          <input value={loc} onChange={(e) => setLoc(e.target.value)} className="h-12 w-full rounded-lg bg-[#333] px-4" />
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-md bg-white/10 px-4 py-2">Cancel</button>
        <button onClick={submit} className="rounded-md bg-[#00BFA6] px-4 py-2 font-semibold text-black">{role === "guest" ? "Submit for Review" : "Create Event"}</button>
      </div>
    </ModalBase>
  );
}
