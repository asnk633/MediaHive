"use client";

import { use } from "react";

type Props = { params: Promise<{ id: string }> };

export default function NotificationDetail({ params }: Props) {
  const { id } = use(params);

  return (
    <div className="px-4 pb-24 pt-6">
      <button className="-ml-2 mb-2 rounded-md p-2 text-white/80 hover:text-white">
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="rounded-xl bg-[#262626] p-6 shadow-lg">
        <p className="text-sm text-[#999]">Received: 1 hour ago</p>
        <h2 className="mt-1 mb-3 text-xl font-bold">New Task Assigned: ‘Weekly Report Graphics’</h2>
        <p className="text-[#ddd]">
          A new task has been assigned to you. Please create the graphics for the weekly performance report. Assets and
          data are in the project folder. Deadline: Friday EOD. View the brief{" "}
          <a className="text-[#00BFA6] underline" href="#">
            here
          </a>.
        </p>
      </div>

      <div className="mt-4">
        <button className="grid h-12 w-full place-items-center rounded-xl bg-[#00BFA6] font-bold text-black">
          Mark as Read
        </button>
      </div>

      <p className="mt-8 text-xs text-white/50">Notification ID: {id}</p>
    </div>
  );
}
