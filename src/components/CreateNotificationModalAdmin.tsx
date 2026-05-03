"use client";

import { useState } from "react";
// Notifications temporarily disabled
import ModalBase from "@/components/ModalBase";

export default function CreateNotificationModalAdmin({ open, onClose }: { open: boolean; onClose: () => void; }) {
  // Notifications temporarily disabled — no-op stub
  const createNotification = async (_: any) => { console.warn("Notifications disabled"); };
  const [title, setTitle] = useState("Team Meeting Reminder");
  const [body, setBody] = useState("Just a quick reminder about the all-hands team meeting tomorrow at 10 AM…");

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;
    try { await createNotification({ title: title.trim(), body: body.trim(), audience: "team" }); onClose(); } catch { }
  };

  return (
    <ModalBase open={open} onClose={onClose} panelClass="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-xl rounded-t-2xl bg-[#102220] p-4">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold">Create New Notification</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
      </header>
      <div className="space-y-5">
        <label className="block">
          <p className="pb-2">Notification Title</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 w-full rounded-xl border border-[#00b39d]/30 bg-white/5 px-4" />
        </label>
        <label className="block">
          <p className="pb-2">Message Body</p>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-28 w-full rounded-xl border border-[#00b39d]/30 bg-white/5 p-4" />
        </label>
        <div className="pt-2">
          <button onClick={submit} className="grid h-12 w-full place-items-center rounded-xl bg-[#09b39d] font-bold text-black">Send Notification</button>
        </div>
      </div>
    </ModalBase>
  );
}
