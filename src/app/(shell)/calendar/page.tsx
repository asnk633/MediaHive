"use client";

import { useMemo, useState, useEffect } from "react";
import { useClientData, TaskLite, EventLite } from "@/app/(shell)/ClientDataContext";
import { format, parseISO, isSameDay, startOfDay, isToday, isTomorrow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, CheckCircle2, Clock, Plus, Filter, LayoutList, Grid3X3 } from "lucide-react";
import { EventCard } from "@/components/event/EventCard";
import { EventModal } from "@/components/event/EventModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

type CalendarItem =
  | { type: "event"; data: EventLite; date: Date }
  | { type: "task"; data: TaskLite; date: Date };

export type CalendarView = 'timeline' | 'month' | 'week';

export default function CalendarPage() {
  const { events, tasks } = useClientData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'events' | 'tasks'>('all');
  const [view, setView] = useState<CalendarView>('timeline');

  useEffect(() => {
    if (searchParams.get('modal') === 'new-event') {
      setIsEventModalOpen(true);
    }
  }, [searchParams]);

  const handleModalClose = () => {
    setIsEventModalOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    router.replace(`/calendar?${params.toString()}`, { scroll: false });
  };

  const groupedItems = useMemo(() => {
    const items: CalendarItem[] = [];

    if (filter === 'all' || filter === 'events') {
      events.forEach(e => {
        if (e.startAt) {
          items.push({ type: "event", data: e, date: parseISO(e.startAt) });
        }
      });
    }

    if (filter === 'all' || filter === 'tasks') {
      tasks.forEach(t => {
        if (t.dueAt) {
          items.push({ type: "task", data: t, date: parseISO(t.dueAt) });
        }
      });
    }

    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    const groups = new Map<string, CalendarItem[]>();
    items.forEach(item => {
      const key = startOfDay(item.date).toISOString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([dateStr, items]) => ({
        date: new Date(dateStr),
        items
      }));
  }, [events, tasks, filter]);

  return (
    <div className="min-h-full px-4 max-w-2xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] mb-1">{view === 'timeline' ? 'Timeline' : view === 'month' ? 'Month View' : 'Week View'}</h1>
          <p className="text-[var(--muted)]">Your schedule and deadlines</p>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="flex p-1 bg-[var(--panel)] rounded-lg border border-[var(--glass-border)]">
            <button
              onClick={() => setView('timeline')}
              className={`p-2 rounded-md text-sm ${view === 'timeline' ? 'bg-[var(--accent)] text-[var(--text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--panel-strong)]'}`}
              aria-label="Timeline view"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setView('month')}
              className={`p-2 rounded-md text-sm ${view === 'month' ? 'bg-[var(--accent)] text-[var(--text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--panel-strong)]'}`}
              aria-label="Month view"
            >
              <Grid3X3 size={16} />
            </button>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-[var(--glass-border)] bg-[var(--panel)] hover:bg-[var(--panel-strong)] text-[var(--icon-muted)] hover:text-[var(--text)]"
            onClick={() => setFilter(f => f === 'all' ? 'events' : f === 'events' ? 'tasks' : 'all')}
            aria-label="Filter items"
          >
            <Filter className={cn("h-4 w-4", filter !== 'all' && "text-[var(--accent)]")} />
          </Button>
          <Button
            size="icon"
            className="rounded-full bg-[var(--accent)] hover:bg-[var(--accent-2)] text-[var(--text)] shadow-glow"
            onClick={() => setIsEventModalOpen(true)}
            aria-label="Create new item"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="space-y-8 relative">
        <AnimatePresence mode="popLayout">
          {view === 'timeline' ? (
            <>
              {/* Continuous Vertical Line Background */}
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--glass-border)] via-[var(--glass-border)]/50 to-transparent z-0" />

              {groupedItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center py-20 text-center text-[var(--muted)] relative z-10"
                >
                  <div className="h-20 w-20 rounded-full bg-[var(--panel)] flex items-center justify-center mb-6 border border-[var(--glass-border)]">
                    <CalendarIcon className="h-10 w-10 opacity-20 text-[var(--icon-muted)]" />
                  </div>
                  <h3 className="text-lg font-medium text-[var(--text)] mb-2">No upcoming items</h3>
                  <p className="max-w-xs mx-auto mb-6">You're all caught up! Create an event or task to get started.</p>
                  <Button onClick={() => setIsEventModalOpen(true)} variant="outline" className="border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all duration-200 ease-in-out">
                    Schedule Event
                  </Button>
                </motion.div>
              ) : (
                groupedItems.map((group, groupIdx) => (
                  <motion.div
                    key={group.date.toISOString()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIdx * 0.05 }}
                    className="relative z-10"
                  >
                    {/* Sticky Date Header */}
                    <div className="sticky top-0 z-20 mb-6 flex items-center gap-4 bg-[var(--bg)]/95 py-3 backdrop-blur-md border-b border-[var(--glass-border)] -mx-4 px-4 shadow-sm">
                      <div className={cn(
                        "flex h-12 w-12 flex-col items-center justify-center rounded-xl border shadow-sm",
                        isToday(group.date) ? "bg-[var(--accent)] text-[var(--text)] border-[var(--accent)] shadow-glow" :
                          isTomorrow(group.date) ? "bg-[var(--panel)] text-[var(--text)] border-[var(--glass-border)]" :
                            "bg-[var(--panel)] text-[var(--muted)] border-[var(--glass-border)]"
                      )}>
                        <span className="text-[10px] font-bold uppercase leading-none opacity-80">{format(group.date, "MMM")}</span>
                        <span className="text-xl font-bold leading-none">{format(group.date, "d")}</span>
                      </div>
                      <div>
                        <h2 className={cn("text-lg font-semibold", isToday(group.date) ? "text-[var(--accent)]" : "text-[var(--text)]")}>
                          {isToday(group.date) ? "Today" : isTomorrow(group.date) ? "Tomorrow" : format(group.date, "EEEE")}
                        </h2>
                        <p className="text-xs text-[var(--muted)]">{format(group.date, "MMMM yyyy")}</p>
                      </div>
                    </div>

                    <div className="space-y-4 pl-4">
                      {group.items.map((item, idx) => (
                        <div
                          key={`${item.type}-${item.data.id}`}
                          className="relative pl-8 group/item"
                        >
                          {/* Timeline Dot */}
                          <div className={cn(
                            "absolute left-[15px] top-6 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg)] z-10 transition-transform duration-200 ease-in-out group-hover/item:scale-125",
                            item.type === 'event' ? 'bg-[var(--accent)] shadow-[0_0_8px_rgba(123,97,255,0.5)]' : 'bg-[var(--accent-2)] shadow-[0_0_8px_rgba(0,191,166,0.5)]'
                          )} />

                          {/* Connector Line to Dot */}
                          <div className="absolute left-[19px] top-6 w-8 h-0.5 bg-[var(--glass-border)] -z-10" />

                          {item.type === "event" ? (
                            <EventCard event={item.data} />
                          ) : (
                            <TaskCard task={item.data} />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </>
          ) : view === 'month' ? (
            <div className="p-4 bg-[var(--panel)] rounded-xl border border-[var(--glass-border)]">
              <DayPicker
                mode="single"
                selected={new Date()}
                onDayClick={() => { }}
                className="p-4"
                modifiersClassNames={{
                  today: 'bg-[var(--accent)] text-white',
                  selected: 'bg-[var(--accent-2)] text-white',
                }}
                showOutsideDays={true}
                captionLayout="dropdown"
              />
            </div>
          ) : (
            <div className="p-4 bg-[var(--panel)] rounded-xl border border-[var(--glass-border)]">
              <h3 className="text-lg font-semibold mb-4">Week View</h3>
              <p className="text-[var(--text-secondary)]">Week view implementation coming soon.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <EventModal
        isOpen={isEventModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}

function TaskCard({ task }: { task: TaskLite }) {
  const isDone = task.status === "Done";
  return (
    <div className={cn(
      "glass-card group relative overflow-hidden p-4 transition-all duration-200 ease-in-out hover:bg-[var(--panel)] hover:shadow-lg hover:shadow-[var(--accent)]/10 card-padding",
      isDone && "opacity-60 grayscale-[0.5]"
    )}>
      <div className={cn("absolute left-0 top-0 h-full w-1", isDone ? "bg-[var(--accent-2)]/30" : "bg-[var(--accent-2)]")} />

      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className={cn("font-semibold text-[var(--text)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors duration-200 ease-in-out", isDone && "line-through text-[var(--muted)]")}>
          {task.title}
        </h3>
        <span className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          task.priority === 'urgent' ? 'bg-[var(--danger)]/20 text-[var(--danger)]' :
            task.priority === 'high' ? 'bg-[var(--danger)]/20 text-[var(--danger)]' :
              task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-[var(--accent-2)]/20 text-[var(--accent-2)]'
        )}>
          {task.priority}
        </span>
      </div>
    </div>
  );
}