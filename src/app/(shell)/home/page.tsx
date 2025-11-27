// src/app/(shell)/home/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Calendar, CheckSquare, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import FeatureToggle from "@/components/ui/FeatureToggle";
import HomePageRedesign from "@/components/ui/HomePageRedesign";

export default function Home() {
  return (
    <FeatureToggle 
      featureName="NEXT_PUBLIC_NEW_UI" 
      fallback={
        <div className="flex flex-col gap-8 px-1 pt-4 pb-24">
          {/* Header Section */}
          <header className="px-2">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
              Good Morning, <span className="text-[var(--accent)]">Alex</span>
            </h1>
            <p className="mt-1 text-[var(--muted)]">Here's what's happening today at Thaiba Garden.</p>
          </header>

          {/* Dashboard Grid */}
          <div className="grid gap-6">

            {/* Upcoming Tasks Card */}
            <DashboardCard
              icon={CheckSquare}
              iconColor="text-[var(--accent)]"
              title="Upcoming Tasks"
              subtitle="You have 5 tasks due today"
              href="/tasks"
              gradient="from-[var(--accent)]/10 to-[var(--accent)]/5"
            >
              <div className="space-y-3 mt-4">
                <TaskPreview title="Review monthly report" due="2h left" priority="high" />
                <TaskPreview title="Update inventory list" due="5h left" priority="medium" />
              </div>
            </DashboardCard>

            {/* Today's Events Card */}
            <DashboardCard
              icon={Calendar}
              iconColor="text-[var(--accent-2)]"
              title="Today's Events"
              subtitle="2 events scheduled"
              href="/calendar"
              gradient="from-[var(--accent-2)]/10 to-[var(--accent-2)]/5"
            >
              <div className="space-y-3 mt-4">
                <EventPreview title="Team Meeting" time="10:00 AM" location="Conference Room A" />
                <EventPreview title="Client Call" time="02:00 PM" location="Online" />
              </div>
            </DashboardCard>

            {/* Notifications Card */}
            <DashboardCard
              icon={Bell}
              iconColor="text-amber-400"
              title="Recent Updates"
              subtitle="3 unread notifications"
              href="/updates"
              gradient="from-amber-500/10 to-amber-600/5"
            >
              <div className="mt-4">
                <p className="text-sm text-[var(--muted)]">New comment on <span className="text-[var(--text)] font-medium">'Project Alpha'</span></p>
                <div className="mt-2 h-px w-full bg-[var(--glass-border)]" />
                <p className="mt-2 text-sm text-[var(--muted)]">System maintenance scheduled for tonight.</p>
              </div>
            </DashboardCard>

          </div>
        </div>
      }
    >
      <HomePageRedesign />
    </FeatureToggle>
  );
}

function DashboardCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  children,
  href,
  gradient
}: {
  icon: any;
  iconColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  href: string;
  gradient: string;
}) {
  return (
    <section className={cn(
      "glass-card card-padding relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px]",
      "bg-gradient-to-br", gradient
    )}>
      {/* Glass Background - removed manual backdrop as glass-card handles it, but keeping gradient overlay */}
      <div className="absolute inset-0 bg-[var(--panel)]/40 -z-10" />

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-[var(--panel)]", iconColor)}>
            <Icon size={20} className="text-[var(--icon)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)] leading-none">{title}</h3>
            <p className="text-xs text-[var(--muted)] mt-1">{subtitle}</p>
          </div>
        </div>
        <Link
          href={href}
          className="p-2 rounded-full hover:bg-[var(--panel)] transition-all duration-200 ease-in-out text-[var(--icon-muted)] hover:text-[var(--icon)]"
        >
          <ArrowRight size={18} />
        </Link>
      </div>

      {children}
    </section>
  );
}

function TaskPreview({ title, due, priority }: { title: string; due: string; priority: 'high' | 'medium' | 'low' }) {
  const priorityColor = {
    high: 'bg-[var(--danger)]/20 text-[var(--danger)]',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-[var(--accent-2)]/20 text-[var(--accent-2)]'
  }[priority];

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--panel)] border border-[var(--glass-border)] hover:bg-[var(--panel-strong)] transition-all duration-200 ease-in-out">
      <span className="text-sm font-medium text-[var(--text)]">{title}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted)]">{due}</span>
        <span className={cn("w-2 h-2 rounded-full", priorityColor.split(' ')[1].replace('text', 'bg'))} />
      </div>
    </div>
  );
}

function EventPreview({ title, time, location }: { title: string; time: string; location: string }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--panel)] border border-[var(--glass-border)] hover:bg-[var(--panel-strong)] transition-all duration-200 ease-in-out">
      <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-[var(--panel-strong)] text-[var(--muted)]">
        <span className="text-xs font-bold">{time.split(' ')[0]}</span>
        <span className="text-[10px] uppercase opacity-60">{time.split(' ')[1]}</span>
      </div>
      <div>
        <h4 className="text-sm font-medium text-[var(--text)]">{title}</h4>
        <p className="text-xs text-[var(--muted)]">{location}</p>
      </div>
    </div>
  );
}