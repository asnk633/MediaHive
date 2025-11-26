"use client";

import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default function NotificationDetail({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="px-4 pb-24 pt-6">
      <button 
        className="mb-2 rounded-md p-2 text-[var(--icon-muted)] hover:text-[var(--text)]"
        onClick={() => router.back()}
      >
        <ArrowLeft size={20} />
      </button>

      <div className="glass-card rounded-xl p-6 card-padding">
        <p className="text-sm text-[var(--muted)]">Received: 1 hour ago</p>
        <h2 className="mt-1 mb-3 text-xl font-bold text-[var(--text)]">New Task Assigned: 'Weekly Report Graphics'</h2>
        <p className="text-[var(--text)]">
          A new task has been assigned to you. Please create the graphics for the weekly performance report. Assets and
          data are in the project folder. Deadline: Friday EOD. View the brief{" "}
          <a className="text-[var(--accent)] underline hover:text-[var(--accent-2)]" href="#">
            here
          </a>.
        </p>
      </div>

      <div className="mt-4">
        <button className="grid h-12 w-full place-items-center rounded-xl bg-[var(--accent)] font-bold text-[var(--text)] hover:bg-[var(--accent-2)] transition-colors duration-200 ease-in-out">
          Mark as Read
        </button>
      </div>

      <p className="mt-8 text-xs text-[var(--muted)]">Notification ID: {id}</p>
    </div>
  );
}