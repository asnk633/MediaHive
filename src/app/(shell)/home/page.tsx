"use client";

import React, { useState } from "react";

import { CheckSquare, Clock, CheckCircle2, XCircle } from "lucide-react";

import { OverviewCard } from "@/components/home/OverviewCard";

import { TaskItem } from "@/components/home/TaskItem";

export default function Home() {

  const [filter, setFilter] = useState("all");

  const overviewStats = [

    { icon: CheckSquare, count: "12", label: "Project", subLabel: "Todo", variant: "primary" as const },

    { icon: CheckCircle2, count: "3", label: "Project", subLabel: "Completed", variant: "default" as const },

    { icon: Clock, count: "7", label: "Project", subLabel: "On Going", variant: "default" as const },

    { icon: XCircle, count: "2", label: "Project", subLabel: "Canceled", variant: "default" as const },

  ];

  return (

    <div className="flex flex-col min-h-screen pb-28 space-y-6 px-4 pt-4 max-w-xl mx-auto md:max-w-4xl">

      <header className="flex justify-between items-center mb-2">

        <div>

          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Hello, Shukoor Rahman</h1>

          <p className="text-sm text-[var(--color-text-secondary)]">Here is your daily update</p>

        </div>

      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {overviewStats.map((stat, i) => (

          <OverviewCard key={i} {...stat} />

        ))}

      </section>

      <section className="space-y-4">

        <div className="flex justify-between items-end">

          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">My Tasks</h2>

          <button className="text-sm font-semibold text-[var(--color-primary-start)]">See All</button>

        </div>

        <div className="space-y-3">

           <TaskItem title="Meeting With Client" date="10:00 AM" icon={undefined} />

           <TaskItem title="Design System Update" date="11:30 AM" isCompleted />

        </div>

      </section>

    </div>

  );

}