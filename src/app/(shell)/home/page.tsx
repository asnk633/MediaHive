"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { RippleLogo } from "@/components/RippleLogo";
import { getWelcomeData } from "@/utils/greetings";

// Icons
import { CheckSquare, Clock, CheckCircle2, AlertCircle, FileClock } from "lucide-react";

// Components
import { OverviewCard } from "@/components/home/OverviewCard";
import { GuestTaskOverviewWidget } from "@/components/home/widgets/GuestTaskOverviewWidget";
import { MyFocusWidget } from "@/components/home/widgets/MyFocusWidget";
import { TasksFromMeWidget } from "@/components/home/widgets/TasksFromMeWidget";
import { MyWorkflowWidget } from "@/components/home/widgets/MyWorkflowWidget";
import { TimelineWidget } from "@/components/home/widgets/TimelineWidget";
import { ActivityFeed } from "@/components/home/widgets/ActivityFeed";
import { ActiveCampaignsWidget } from "@/components/home/widgets/ActiveCampaignsWidget";
import { OverdueAlertsWidget } from "@/components/home/widgets/OverdueAlertsWidget"; // Added
import { SectionHeader } from "@/components/ui/SectionHeader";

// Services & Types
import { CanonicalDataService, TaskStats } from "@/services/canonicalDataService";
import { Task } from "@/types/task";
import { Event } from "@/types/event";
import { UpcomingEventsStrip } from "@/components/events/UpcomingEventsStrip";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { GuestActivityFeed } from "@/components/home/widgets/GuestActivityFeed";
import { GuestQuickActions } from "@/components/home/widgets/GuestQuickActions";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<Event | null>(null);

  // UI State
  const [showSplash, setShowSplash] = useState(true);
  const [welcome, setWelcome] = useState({ greeting: "Good Morning", message: "Welcome back." });

  // Initial Loading Checks
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const nameToUse = user.officialName || user.name;
  const displayName = nameToUse ? nameToUse.split(' ').pop() : 'User';

  const role = user.role; // Helper

  // Effects
  useEffect(() => {
    if (role) {
      setWelcome(getWelcomeData(role));
    }
  }, [role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Fetch Data (Tasks & Events) - Stable Implementation
  const hasFetchedRef = useRef(false);

  const fetchData = useCallback(async (currentUid: string, currentRole: string) => {
    try {
      // 1. Fetch Tasks
      const tasksData = await CanonicalDataService.getTasks({
        role: currentRole,
        userId: currentUid,
        includeDemoData: true
      });
      setTasks(tasksData);



      // ...

      // 2. Fetch Stats (Needed for overview widgets)
      // Admin/Team: Detailed status breakdown
      // Guest: Aggregate department load
      if (currentRole === 'admin' || currentRole === 'team' || currentRole === 'guest') {
        const statsData = await CanonicalDataService.getTaskStats({
          role: currentRole,
          userId: currentUid,
          includeDemoData: true
        });
        setStats(statsData);
      }

      // ...



      // 3. Fetch Events
      const eventsData = await CanonicalDataService.getEvents({
        role: currentRole,
        userId: currentUid,
        includeDemoData: true
      });
      setEvents(eventsData);

    } catch (error) {
      console.error("Home Page Data Fetch Error:", error);
    }
  }, []);

  useEffect(() => {
    if (!user?.uid || !user?.role || hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    fetchData(user.uid, user.role);

    // -- LAZY CLEANUP TRIGGER --
    // Only Admin triggers general house cleaning
    if (user.role === 'admin') {
      // Run quietly in background
      // fetch('/api/cron/cleanup', { method: 'DELETE' })
      //   .then(async res => {
      //     if (!res.ok) {
      //       const errorData = await res.json().catch(() => ({}));
      //       console.warn('[Background Cleanup] Skipped or Failed:', errorData.error || res.statusText);
      //     }
      //   })
      //   .catch(err => console.warn('[Background Cleanup] Network Issue:', err));
    }
  }, [user?.uid, fetchData]);


  // Prepare Overview Stats (Admin Only)
  const overviewCards = [
    {
      icon: FileClock,
      count: stats?.pending || 0,
      label: (stats?.pending || 0) <= 1 ? "Task" : "Tasks",
      subLabel: "Pending Approval",
      status: 'pending'
    },
    {
      icon: CheckSquare,
      count: stats?.todo || 0,
      label: (stats?.todo || 0) <= 1 ? "Task" : "Tasks",
      subLabel: "To Do",
      variant: "primary" as const,
      status: 'todo'
    },
    {
      icon: Clock,
      count: stats?.inProgress || 0,
      label: (stats?.inProgress || 0) <= 1 ? "Task" : "Tasks",
      subLabel: "In Progress",
      status: 'in_progress'
    },
    {
      icon: AlertCircle,
      count: stats?.review || 0,
      label: (stats?.review || 0) <= 1 ? "Task" : "Tasks",
      subLabel: "In Review",
      status: 'review'
    },
    {
      icon: CheckCircle2,
      count: stats?.done || 0,
      label: (stats?.done || 0) <= 1 ? "Task" : "Tasks",
      subLabel: "Completed",
      status: 'done'
    },
  ];

  // Helper for overdue indicators
  const hasOverdueInStatus = (status: string) => {
    if (status === 'done') return false;
    const now = new Date();
    return tasks.some(t => {
      if (t.status !== status) return false;
      if (!t.dueDate) return false;
      const due = (t.dueDate as any).seconds ? new Date((t.dueDate as any).seconds * 1000) : new Date(t.dueDate);
      return due < now;
    });
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-[var(--color-bg-primary)] z-50 flex items-center justify-center"
          >
            <RippleLogo />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 pt-6">

          <h1 className="text-5xl font-display font-medium text-white leading-tight tracking-tight">
            {welcome.greeting}, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 font-bold">{displayName}.</span>
          </h1>
          <p className="mt-3 text-gray-400 text-lg font-light ml-1">{welcome.message}</p>
        </header>

        {/* ADMIN ONLY: Overdue Alerts */}
        {role === 'admin' && (
          <OverdueAlertsWidget />
        )}

        {/* ADMIN & TEAM: Overview Cards */}
        {(role === 'admin' || role === 'team') && (
          <section className="mb-10">
            <SectionHeader title="Media Team Overview" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
              {overviewCards.map((stat, i) => (
                <OverviewCard
                  key={i}
                  {...stat}
                  count={stat.count.toString()}
                  onClick={() => router.push(`/tasks?status=${stat.status}`)}
                  showIndicator={hasOverdueInStatus(stat.status)}
                />
              ))}
            </div>
          </section>
        )}

        {/* --- SECTION 1: TOP WIDGETS (Role Based) --- */}
        {role === 'guest' && (
          <section className="mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <GuestTaskOverviewWidget stats={stats} />
              </div>
              <div>
                <GuestQuickActions />
              </div>
            </div>
          </section>
        )}

        {/* ALL ROLES: Upcoming Events Strip 
            Enabled for Guest as per User Request: "add events in next 7 days in guest role UI" 
        */}
        <section className="mb-4">
          <UpcomingEventsStrip
            events={events}
            onEventClick={setExpandedEvent}
          />
        </section>

        {/* ALL ROLES: Active Campaigns */}
        {/* ALL ROLES: Active Campaigns (Hidden for Guests) */}
        <section className="mb-10">
          <SectionHeader title="Active Campaigns" />
          <ActiveCampaignsWidget />
        </section>

        {/* TEAM: My Workflow */}
        {role === 'team' && (
          <section className="mb-10">
            <MyWorkflowWidget tasks={tasks} userId={user.uid} />
          </section>
        )}


        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

          {/* LEFT PANEL */}
          <div className="xl:col-span-2 space-y-10">

            {/* ADMIN & TEAM: My Focus */}
            {role !== 'guest' && (
              <section>
                <MyFocusWidget tasks={tasks} userId={user.uid} />
              </section>
            )}

            {/* ALL ROLES: Tasks From Me / My Requests */}
            <section>
              <TasksFromMeWidget
                tasks={tasks}
                userId={user.uid}
                title={role === 'guest' ? "My Requests" : undefined}
              />
            </section>
          </div>

          {/* RIGHT PANEL */}
          <div className="xl:col-span-1 space-y-10 sticky top-6">

            {/* ALL ROLES: Timeline (Hidden for Guests) */}
            {role !== 'guest' && (
              <section>
                <TimelineWidget tasks={tasks} events={events} />
              </section>
            )}

            {/* ADMIN & TEAM (Not Guest): Updates */}
            {role !== 'guest' ? (
              <section>
                <ActivityFeed tasks={tasks} />
              </section>
            ) : (
              <section>
                <GuestActivityFeed tasks={tasks} />
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EventDetailsModal
        event={expandedEvent}
        isOpen={!!expandedEvent}
        onClose={() => setExpandedEvent(null)}
        onEdit={() => {
          setExpandedEvent(null);
          router.push(`/events?id=${expandedEvent?.id}`);
        }}
      />
    </>
  );
}
