"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare, Calendar, Clock, AlertCircle,
  Play, CheckCircle2, Sparkles, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { GooeyInput } from "@/components/ui/gooey-input";
import { MasterCreateButton } from "@/components/ui/master-create-button";
import { AnimatedList } from "@/components/ui/animated-list";
import { RequestsWidget } from "@/components/dashboard/RequestsWidget";
import { MetricPod } from '@/components/dashboard/MetricPod';
import { TaskRow, TaskSkeleton } from '@/components/dashboard/TaskRow';
import { ScheduleItem, ScheduleSkeleton } from '@/components/dashboard/ScheduleItem';

// ─── Micro primitives ────────────────────────────────────────────────────────

const FilmFrameCorners = () => (
  <>
    <span className="absolute top-2 left-2  w-2.5 h-2.5 border-t border-l border-white/20 pointer-events-none" />
    <span className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-white/20 pointer-events-none" />
    <span className="absolute bottom-2 left-2  w-2.5 h-2.5 border-b border-l border-white/20 pointer-events-none" />
    <span className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-white/20 pointer-events-none" />
  </>
);

/** 1px gradient divider with glowing right endpoint */
const TimelineDivider = () => (
  <div className="relative flex items-center w-full select-none" aria-hidden>
    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="absolute right-8 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_#14b8a6]" />
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  const [greetTime, setGreetTime]     = useState("Day");
  const [tagline, setTagline]         = useState("");
  const [tasks, setTasks]             = useState<any[]>([]);
  const [events, setEvents]           = useState<any[]>([]);
  const [campaigns, setCampaigns]     = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const h = new Date().getHours();
    setGreetTime(h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening");
    const lines = [
      "Let's create something extraordinary today.",
      "Your ideas, organized and ready.",
      "Turning vision into reality.",
      "Stay focused. Stay creative.",
      "Streamlining your workflow, one task at a time.",
    ];
    setTagline(lines[Math.floor(Math.random() * lines.length)]);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoadingData(false); return; }

    (async () => {
      setLoadingData(true);
      try {
        const tenant = user.institution_id || user.tenant_id;

        let tQ = supabase.from("tasks").select("*, task_assignments(*)").eq("deleted", false).order("created_at", { ascending: false }).limit(500);
        let eQ = supabase.from("events").select("*").eq("deleted", false).order("date", { ascending: true }).limit(5);
        let cQ = supabase.from("campaigns").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(1);

        if (tenant) { tQ = tQ.eq("tenant_id", tenant); eQ = eQ.eq("tenant_id", tenant); cQ = cQ.eq("tenant_id", tenant); }

        const [tR, eR, cR] = await Promise.all([tQ, eQ, cQ]);
        if (tR.data) setTasks(tR.data.filter((t: any) => !t.is_demo_data));
        if (eR.data) setEvents(eR.data.filter((e: any) => !e.is_demo_data));
        if (cR.data) setCampaigns(cR.data);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [user, authLoading]);

  // Date helpers
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const isToday = (d: string) => { if (!d) return false; const dt = new Date(d); return dt >= today && dt < tomorrow; };
  const isPast  = (d: string) => { if (!d) return false; return new Date(d) < today; };

  // Metrics
  const dueTodayCount   = tasks.filter(t => t.status !== "done" && t.status !== "completed" && t.due_date && (isToday(t.due_date) || isPast(t.due_date))).length;
  const inProgressCount = tasks.filter(t => t.status === "in-progress" || t.status === "in_progress").length;
  const onHoldCount     = tasks.filter(t => t.status === "on-hold"     || t.status === "blocked" || t.status === "on_hold").length;
  const completedCount  = tasks.filter(t => (t.status === "done" || t.status === "completed") && t.completed_at && isToday(t.completed_at)).length;
  const progressPct     = (dueTodayCount + completedCount) > 0 ? Math.round((completedCount / (dueTodayCount + completedCount)) * 100) : 0;

  // My requests
  const myTasks = tasks
    .filter(t => t.status !== "done" && t.status !== "completed")
    .slice(0, 4);

  const myReqTasks = tasks.filter(t => {
    const creator = typeof t.created_by === "string" ? t.created_by : t.created_by?.uid || t.created_by?.id;
    const isAssignee = t.task_assignments?.some((ta: any) => ta.user_id === user?.id || ta.user_id === user?.uid) ||
                       t.assigned_to === user?.id || t.assigned_by === user?.id;
    return creator === user?.id || creator === user?.uid || isAssignee;
  });
  const myReqPending    = myReqTasks.filter(t => t.status === "todo" || t.status === "pending").length;
  const myReqInProgress = myReqTasks.filter(t => t.status === "in_progress" || t.status === "in-progress").length;
  const myReqCompleted  = myReqTasks.filter(t => t.status === "done" || t.status === "completed").length;
  const myReqTotal      = myReqTasks.length;
  const myReqPct        = myReqTotal > 0 ? Math.round((myReqCompleted / myReqTotal) * 100) : 0;

  const activeCampaign = campaigns[0];

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item: any = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 14 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.header variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 dash-header-anchor">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-teal-400 font-semibold tracking-wider uppercase mb-1">
            <Sparkles size={11} />
            Good {greetTime}
          </div>
          <h1 className="heading-lux text-3xl m-0 capitalize leading-none">{user?.name || "Welcome back"}</h1>
          <p className="subtext-secondary m-0 mt-1">{tagline}</p>
        </div>
        <div className="flex items-center gap-3">
          <GooeyInput className="w-64" />
          <MasterCreateButton />
        </div>
      </motion.header>

      {/* ── Metrics row ────────────────────────────────────────────────── */}
      <motion.section variants={item} className="dashboard-grid" aria-label="System Status">
        <MetricPod title="Due Today"    value={dueTodayCount}   percentage={progressPct}               status="urgent"    loading={loadingData} />
        <MetricPod title="In Progress"  value={inProgressCount} percentage={inProgressCount > 0 ? 60 : 0} status="working"    loading={loadingData} />
        <MetricPod title="On Hold"      value={onHoldCount}     percentage={onHoldCount > 0 ? 30 : 0}     status="pending"   loading={loadingData} />
        <MetricPod title="Completed"    value={completedCount}  percentage={progressPct}               status="completed" loading={loadingData} />
      </motion.section>

      <motion.div variants={item}><TimelineDivider /></motion.div>

      {/* ── Main content grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 content-grid-surface">

        {/* Tasks in Queue — 2 cols */}
        <motion.article variants={item} className="lg:col-span-2 glass-card-premium panel-accent-top p-6 flex flex-col gap-4 relative overflow-hidden group">
          <GlowingEffect spread={40} glow proximity={64} inactiveZone={0.01} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
            <div>
              <h2 className="heading-lux text-lg m-0 tracking-tight">Tasks in Queue</h2>
              <p className="text-[10px] text-zinc-500 m-0 mt-0.5 uppercase tracking-[0.14em] font-semibold">Your workspace backlog</p>
            </div>
            <Link href="/tasks" className="text-xs text-teal-400 hover:text-teal-300 font-medium">View All</Link>
          </div>
          <div className="flex flex-col gap-2.5 relative z-10">
            {loadingData
              ? <>{[0,1,2].map(i => <TaskSkeleton key={i} />)}</>
              : myTasks.length > 0
                ? <AnimatedList className="!gap-2.5">
                    {myTasks.map(task => (
                      <TaskRow
                        key={task.id}
                        title={task.title}
                        tag={task.category || "General"}
                        priority={task.priority === "high" ? "High" : task.priority === "medium" ? "Medium" : "Low"}
                        dueDate={task.due_date ? new Date(task.due_date).toLocaleDateString() : "No Date"}
                        status={task.status === "done" || task.status === "completed" ? "Completed" : task.status === "in-progress" || task.status === "in_progress" ? "In Progress" : "Pending"}
                      />
                    ))}
                  </AnimatedList>
                : <div className="text-[13px] text-zinc-600 italic text-center py-6">No pending tasks found.</div>
            }
          </div>
        </motion.article>

        {/* My Requests — 1 col */}
        <motion.article variants={item} className="lg:col-span-1 glass-card-premium p-6 flex flex-col justify-between relative overflow-hidden group">
          <GlowingEffect spread={40} glow proximity={64} inactiveZone={0.01} />
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="heading-lux text-sm uppercase tracking-wider m-0">My Requests</h3>
              <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Personal</span>
            </div>
            {loadingData
              ? <div className="h-3.5 w-24 bg-white/5 rounded animate-pulse mt-1" />
              : <p className="text-[13px] text-zinc-400 mt-1">{myReqTotal} Total Requests</p>
            }
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { label: "Pending",     val: myReqPending },
                { label: "In Progress", val: myReqInProgress },
                { label: "Completed",   val: myReqCompleted },
                { label: "Total",       val: myReqTotal },
              ].map(({ label, val }) => (
                <div key={label} className="bg-black/50 border border-white/[0.07] rounded-2xl p-3 flex flex-col items-center justify-center">
                  {loadingData
                    ? <div className="h-8 w-8 bg-white/5 rounded animate-pulse" />
                    : <span className="heading-lux text-2xl">{val}</span>
                  }
                  <span className="text-[9px] text-zinc-500 uppercase tracking-[0.12em] font-bold mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-zinc-400 font-medium">Request Progress</span>
              {loadingData
                ? <span className="inline-block h-3.5 w-8 bg-white/5 rounded animate-pulse" />
                : <span className="text-xs font-bold text-teal-400">{myReqPct}%</span>
              }
            </div>
            <div className="lux-progress-track">
              <motion.div
                className="lux-progress-fill bg-gradient-to-r from-teal-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: loadingData ? "0%" : `${myReqPct}%` }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </motion.article>

        {/* Upcoming Schedule — 2 cols */}
        <motion.article variants={item} className="lg:col-span-2 glass-card-premium p-6 flex flex-col gap-4 relative overflow-hidden group">
          <GlowingEffect spread={40} glow proximity={64} inactiveZone={0.01} />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
            <h3 className="heading-lux text-lg m-0">Upcoming Schedule</h3>
            <Calendar size={16} className="text-zinc-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 relative z-10">
            {loadingData
              ? <>{[0,1,2,4].map(i => <ScheduleSkeleton key={i} />)}</>
              : events.length > 0
                ? events.map(ev => (
                    <ScheduleItem
                      key={ev.id}
                      title={ev.title}
                      time={ev.date ? new Date(ev.date).toLocaleDateString() : "TBD"}
                      category={ev.type || "Event"}
                    />
                  ))
                : <div className="col-span-2 text-[13px] text-zinc-600 italic text-center py-6">No upcoming events.</div>
            }
          </div>
        </motion.article>

        {/* Live Campaign — 1 col */}
        <motion.article variants={item} className="lg:col-span-1 glass-card-premium p-6 flex flex-col justify-between relative overflow-hidden group">
          <GlowingEffect spread={40} glow proximity={64} inactiveZone={0.01} />
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="heading-lux text-sm uppercase tracking-wider m-0">Live Campaign</h3>
            {activeCampaign
              ? <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Active</span>
              : <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">None</span>
            }
          </div>
          <div className="flex-1 flex flex-col justify-center py-4">
            {activeCampaign
              ? <>
                  <div className="font-bold text-white text-lg truncate mb-2">{activeCampaign.name || "Untitled"}</div>
                  <p className="text-sm text-zinc-400 mb-4 line-clamp-3">{activeCampaign.description || "No description."}</p>
                  <div className="w-full bg-black/40 border border-white/5 rounded-xl p-3 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
                    <span className="text-sm text-zinc-300 font-medium">Monitoring</span>
                  </div>
                </>
              : <div className="flex items-center justify-center h-full text-sm text-zinc-500">No active campaigns found.</div>
            }
          </div>
          <Link href="/campaigns" className="flex items-center justify-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-auto group bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl py-2.5 tracking-wide transition-colors">
            Track Campaigns
            <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </motion.article>

        {/* Admin / Manager Requests panel */}
        {(user?.role === "admin" || user?.role === "manager") && (
          <motion.div variants={item} className="lg:col-span-2 flex h-full">
            <RequestsWidget />
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
