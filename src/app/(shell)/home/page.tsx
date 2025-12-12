"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from "react";
import { CheckSquare, Clock, CheckCircle2, XCircle } from "lucide-react";
import { OverviewCard } from "@/components/home/OverviewCard";
import { TaskItem } from "@/components/home/TaskItem";
import { useRole } from "@/app/(shell)/RoleContext";

export default function Home() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const { user } = useRole();
  const displayName = user?.name ? user.name.split(' ').pop() : 'User';

  const overviewStats = [
    { icon: CheckSquare, count: "12", label: "Project", subLabel: "Todo", variant: "primary" as const },
    { icon: CheckCircle2, count: "3", label: "Project", subLabel: "Completed", variant: "default" as const },
    { icon: Clock, count: "7", label: "Project", subLabel: "On Going", variant: "default" as const },
    { icon: XCircle, count: "2", label: "Project", subLabel: "Canceled", variant: "default" as const },
  ];

  return (
    <div className="flex flex-col min-h-screen app-body-padding px-4 max-w-xl mx-auto md:max-w-4xl">
      {/* Header */}
      <header className="mb-8 pt-6">
        <p className="text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase mb-2">Thaiba MediaHive</p>
        <h1 className="text-4xl font-display font-bold text-[var(--color-text-primary)] leading-tight">
          Good Morning, <br />
          <span className="text-[var(--color-primary-start)]">{displayName}.</span>
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">Here is a glance at your day.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewStats.map((stat, i) => (
          <OverviewCard key={i} {...stat} />
        ))}
      </section>

      {/* My Tasks */}
      <section className="space-y-4">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">My Tasks</h2>
          <button onClick={() => router.push('/tasks')} className="text-sm font-semibold text-[var(--color-primary-start)] hover:underline">See All</button>
        </div>

        <div className="space-y-3">
          <TaskItem title="Meeting With Client" date="10:00 AM" icon={undefined} />
          <TaskItem title="Design System Update" date="11:30 AM" isCompleted />
          <TaskItem title="Project Research" date="2:00 PM" icon={undefined} />
        </div>
      </section>
    </div>
  );
}