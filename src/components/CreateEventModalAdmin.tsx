"use client";

import { useState } from "react";
import ModalBase from "@/components/ModalBase";
import { DateSelector } from "@/components/ui/selectors/DateSelector";
import { TimeSelector } from "@/components/ui/selectors/TimeSelector";
import { format } from "date-fns";

export default function EditEventModalAdmin({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const [start, setStart] = useState("2023-10-26T10:00");
  const [end, setEnd] = useState("2023-10-26T11:30");
  if (!open) return null;
  return (
    <ModalBase open={open} onClose={onClose}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold">Edit Event</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
      </header>
      <div className="space-y-6">
        <section className="rounded-lg bg-[#2c2c2c] p-4 shadow-lg">
          <label className="flex flex-col">
            <p className="pb-2 text-base font-bold">Event Title</p>
            <input className="h-12 rounded-lg bg-[#121212] px-4" defaultValue="Quarterly Media Strategy Meeting" />
          </label>
          <label className="mt-4 flex flex-col">
            <p className="pb-2 text-base font-bold">Description</p>
            <textarea rows={4} className="rounded-lg bg-[#121212] p-4" defaultValue="Review of Q3 performance and planning for Q4 content." />
          </label>
        </section>
        <section className="rounded-lg bg-[#2c2c2c] p-4 shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <DateSelector 
                label="Start Date"
                date={new Date(start)}
                onChange={(date) => {
                  if (!date) return;
                  const newDate = new Date(date);
                  const current = new Date(start);
                  newDate.setHours(current.getHours());
                  newDate.setMinutes(current.getMinutes());
                  setStart(newDate.toISOString());
                }}
              />
              <TimeSelector 
                label="Start Time"
                value={format(new Date(start), "HH:mm")}
                onChange={(time) => {
                  const [h, m] = time.split(':').map(Number);
                  const newDate = new Date(start);
                  newDate.setHours(h);
                  newDate.setMinutes(m);
                  setStart(newDate.toISOString());
                }}
              />
            </div>
            <div className="space-y-4">
              <DateSelector 
                label="End Date"
                date={new Date(end)}
                onChange={(date) => {
                  if (!date) return;
                  const newDate = new Date(date);
                  const current = new Date(end);
                  newDate.setHours(current.getHours());
                  newDate.setMinutes(current.getMinutes());
                  setEnd(newDate.toISOString());
                }}
              />
              <TimeSelector 
                label="End Time"
                value={format(new Date(end), "HH:mm")}
                onChange={(time) => {
                  const [h, m] = time.split(':').map(Number);
                  const newDate = new Date(end);
                  newDate.setHours(h);
                  newDate.setMinutes(m);
                  setEnd(newDate.toISOString());
                }}
              />
            </div>
          </div>
          <label className="mt-4 flex flex-col">
            <p className="pb-2 text-base font-bold">Location / Meeting Link</p>
            <input defaultValue="https://meet.google.com/tha-iba-grdn" className="h-12 rounded-lg bg-[#121212] px-4" />
          </label>
        </section>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button className="h-12 flex-1 rounded-lg bg-[#00BFA6] font-bold text-black">Save Changes</button>
          <button onClick={onClose} className="h-12 flex-1 rounded-lg border border-white/30">Cancel</button>
        </div>
      </div>
    </ModalBase>
  );
}
