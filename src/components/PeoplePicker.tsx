"use client";

import { useEffect, useRef, useState } from "react";
import { UserService } from '@/services/userService';
import { getRoleBadgeColors } from '@/lib/roleStyles';
import { cn } from '@/lib/utils';

type Person = { id: string; name: string; role?: "admin" | "team" };


export default function PeoplePicker({
  value,
  onSelect,
  anchorClass = "relative inline-block",
  buttonClass = "rounded-md bg-foreground/10 px-3 py-1.5 text-sm hover:bg-foreground/15",
}: {
  value?: string | null;
  onSelect: (personId: string | null, personName?: string) => void;
  anchorClass?: string;
  buttonClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [teamMembers, setTeamMembers] = useState<Person[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  // Fetch team members from Firestore
  useEffect(() => {
    const fetchMembers = async () => {
      const members = await UserService.getTeamMembers();
      setTeamMembers(members.map(m => ({ id: m.uid, name: m.name, role: 'team' as const })));
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = teamMembers.find(p => p.id === value);
  const list = teamMembers.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className={anchorClass} ref={boxRef}>
      <button onClick={() => setOpen(v => !v)} className={buttonClass}>
        {selected ? selected.name : "Unassigned"}
      </button>

      {open && (
        <div className="absolute z-[80] mt-2 w-64 rounded-lg border border-[#ffffff1a] bg-[#1f1f1f] p-3 shadow-xl">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people…"
            className="mb-2 h-9 w-full rounded-md bg-[#121212] px-3 text-sm"
          />
          <div className="max-h-56 overflow-auto">
            {list.map(p => (
              <button
                key={p.id}
                onClick={() => { onSelect(p.id, p.name); setOpen(false); }}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-foreground/10"
              >
                <span>{p.name}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border bg-opacity-10", getRoleBadgeColors(p.role))}>{p.role}</span>
              </button>
            ))}
            {list.length === 0 && <div className="px-2 py-2 text-sm text-foreground/80">No results</div>}
          </div>
          <div className="mt-2 flex justify-between">
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className="rounded-md bg-foreground/10 px-3 py-1.5 text-sm hover:bg-foreground/15"
            >
              Clear assignee
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md bg-foreground/10 px-3 py-1.5 text-sm hover:bg-foreground/15"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
