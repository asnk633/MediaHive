"use client";

import { useState } from "react";
import { DateSelector } from "@/components/ui/selectors/DateSelector";
import { TimeSelector } from "@/components/ui/selectors/TimeSelector";
import { format } from "date-fns";

export default function CreateEventModalMember({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-xl rounded-t-2xl bg-[#1E1E1E] p-4">
        <header className="mb-3">
          <h3 className="text-lg font-bold">Create New Event</h3>
          <p className="mt-1 text-sm text-foreground/60">
            Admin will review and assign relevant resources/teams after submission.
          </p>
        </header>

        <div className="space-y-4">
          <label className="block">
            <p className="pb-2 text-foreground">Event Title</p>
            <input className="h-12 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/50" />
          </label>
          <label className="block">
            <p className="pb-2 text-foreground">Description</p>
            <textarea className="min-h-28 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/50" />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
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
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md bg-foreground/10 px-4 py-2">Cancel</button>
          <button className="rounded-md bg-[#00BFA6] px-4 py-2 font-semibold text-black">Submit</button>
        </div>
      </div>
    </>
  );
}
