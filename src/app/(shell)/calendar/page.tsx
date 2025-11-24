"use client";

import { useMemo, useState, useEffect } from "react";
import { useClientData, TaskLite, EventLite } from "@/app/(shell)/ClientDataContext";
import { format, parseISO, isSameDay, startOfDay, isToday, isTomorrow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, CheckCircle2, Clock, Plus, Filter } from "lucide-react";
import { EventCard } from "@/components/event/EventCard";
import { EventModal } from "@/components/event/EventModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";

type CalendarItem =
  | { type: "event"; data: EventLite; date: Date }
  | { type: "task"; data: TaskLite; date: Date };

export default function CalendarPage() {
  const { events, tasks } = useClientData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'events' | 'tasks'>('all');

  useEffect(() => {
    if (searchParams.get('modal') === 'new-event') {
      setIsEventModalOpen(true);
    }
  }, [searchParams]);

  const handleModalClose = () => {
    setIsEventModalOpen(false);
    // Remove query param without refresh
    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    router.replace(`/calendar?${params.toString()}`, { scroll: false });
  };

  const groupedItems = useMemo(() => {
    const items: CalendarItem[] = [];

    // Process Events
    if (filter === 'all' || filter === 'events') {
      events.forEach(e => {
        if (e.startAt) {
          items.push({ type: "event", data: e, date: parseISO(e.startAt) });
        }
      });
    }

    // Process Tasks (only those with due dates)
    if (filter === 'all' || filter === 'tasks') {
      tasks.forEach(t => {
        if (t.dueAt) {
          items.push({ type: "task", data: t, date: parseISO(t.dueAt) });
        }
      });
    }

    // Sort by date
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by Day
    const groups = new Map<string, CalendarItem[]>();
    items.forEach(item => {
      const key = startOfDay(item.date).toISOString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    // Convert to array and sort keys
    return Array.from(groups.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([dateStr, items]) => ({
        date: new Date(dateStr),
        items
      }));
  }, [events, tasks, filter]);

  return (
    <div className="min-h-full px-4 pb-32 pt-6 max-w-3xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Timeline</h1>
          <p className="text-text-muted">Your schedule and deadlines</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-white/10 bg-surface/50 hover:bg-surface text-text-muted hover:text-white"
            onClick={() => setFilter(f => f === 'all' ? 'events' : f === 'events' ? 'tasks' : 'all')}
            aria-label="Filter items"
          >
            <Filter className={cn("h-4 w-4", filter !== 'all' && "text-accent")} />
          </Button>
          <Button
            size="icon"
            className="rounded-full bg-accent hover:bg-accent/90 text-white shadow-glow"
            onClick={() => setIsEventModalOpen(true)}
            aria-label="Create new item"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="space-y-8 relative">
        {/* Continuous Vertical Line Background */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent z-0" />

        <AnimatePresence mode="popLayout">
          {groupedItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-20 text-center text-text-muted relative z-10"
            >
              <div className="h-20 w-20 rounded-full bg-surface/50 flex items-center justify-center mb-6 border border-white/5">
                <CalendarIcon className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">No upcoming items</h3>
              <p className="max-w-xs mx-auto mb-6">You're all caught up! Create an event or task to get started.</p>
              <Button onClick={() => setIsEventModalOpen(true)} variant="outline" className="border-accent/50 text-accent hover:bg-accent/10">
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
                <div className="sticky top-0 z-20 mb-6 flex items-center gap-4 bg-background/95 py-3 backdrop-blur-md border-b border-white/5 -mx-4 px-4 shadow-sm">
                  <div className={cn(
                    "flex h-12 w-12 flex-col items-center justify-center rounded-xl border shadow-sm",
                    isToday(group.date) ? "bg-accent text-white border-accent shadow-glow" :
                      isTomorrow(group.date) ? "bg-surface text-text-primary border-white/10" :
                        "bg-surface/50 text-text-muted border-white/5"
                  )}>
                    <span className="text-[10px] font-bold uppercase leading-none opacity-80">{format(group.date, "MMM")}</span>
                    <span className="text-xl font-bold leading-none">{format(group.date, "d")}</span>
                  </div>
                  <div>
                    <h2 className={cn("text-lg font-semibold", isToday(group.date) ? "text-accent" : "text-text-primary")}>
                      {isToday(group.date) ? "Today" : isTomorrow(group.date) ? "Tomorrow" : format(group.date, "EEEE")}
                    </h2>
                    <p className="text-xs text-text-muted">{format(group.date, "MMMM yyyy")}</p>
                  </div>
                </div>

                <div className="space-y-4 pl-4">
                  {group.items.map((item, idx) => (
                    <div key={`${item.type}-${item.data.id}`} className="relative pl-8 group/item">
                      {/* Timeline Dot */}
                      <div className={cn(
                        "absolute left-[15px] top-6 h-2.5 w-2.5 rounded-full border-2 border-background z-10 transition-transform group-hover/item:scale-125",
                        item.type === 'event' ? 'bg-accent shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      )} />

                      {/* Connector Line to Dot */}
                      <div className="absolute left-[19px] top-6 w-8 h-0.5 bg-white/5 -z-10" />

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
  const isDone = task.status === "Completed";
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border border-white/5 bg-surface/30 p-4 transition-all hover:bg-surface/50 hover:shadow-lg hover:shadow-primary/5 backdrop-blur-sm",
      isDone && "opacity-60 grayscale-[0.5]"
    )}>
      <div className={cn("absolute left-0 top-0 h-full w-1", isDone ? "bg-primary/30" : "bg-primary")} />

      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className={cn("font-semibold text-text-primary line-clamp-1 group-hover:text-primary transition-colors", isDone && "line-through text-text-muted")}>
          {task.title}
        </h3>
        <span className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          task.priority === 'urgent' ? 'bg-red-500/20 text-red-200' :
            task.priority === 'high' ? 'bg-orange-500/20 text-orange-200' :
              'bg-primary/20 text-primary'
        )}>
          {task.priority || 'Normal'}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className={cn("h-3.5 w-3.5", isDone ? "text-primary" : "text-text-muted")} />
          <span>{task.status || 'Pending'}</span>
        </div>
        {task.dueAt && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Due {format(parseISO(task.dueAt), "h:mm a")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
