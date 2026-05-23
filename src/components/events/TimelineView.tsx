import { useMemo } from "react";
import { TaskLite, EventLite } from "@/app/(shell)/ClientDataContext";
import { format, parseISO, startOfDay, isToday, isTomorrow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, CheckCircle2, Clock, Plus, Filter, LayoutList, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventCard } from "@/components/event/EventCard";
import { Button } from "@/components/ui/button";
import { normalizeDate, getEventDays } from "@/features/events/utils/dateNormalization";

type CalendarItem =
    | { type: "event"; data: EventLite; tasks: TaskLite[]; date: Date }
    | { type: "task"; data: TaskLite; date: Date };

interface TimelineViewProps {
    events: EventLite[];
    tasks: TaskLite[];
    loading: boolean;
    onCreateEvent: () => void;
    filter: 'all' | 'events' | 'tasks';
}

export function TimelineView({ events, tasks, loading, onCreateEvent, filter }: TimelineViewProps) {
    const groupedItems = useMemo(() => {
        const filteredEvents = filter === 'tasks' ? [] : events;
        const filteredTasks = filter === 'events' ? [] : tasks;

        // 1. Index tasks by event_id
        const eventIdMap = new Map<string, TaskLite[]>();
        const standaloneTasks: TaskLite[] = [];

        filteredTasks.forEach(t => {
            if (t.event_id) {
                if (!eventIdMap.has(t.event_id)) eventIdMap.set(t.event_id, []);
                eventIdMap.get(t.event_id)!.push(t);
            } else {
                standaloneTasks.push(t);
            }
        });

        const calendarItems: CalendarItem[] = [];

        // 2. Process events (and their nested tasks)
        // Groups by the start date of the event only.
        filteredEvents.forEach(e => {
            const startAt = e.start_at || e.start_time;
            const date = normalizeDate(startAt) || new Date();
            const childTasks = eventIdMap.get(e.id) || [];
            calendarItems.push({ type: "event", data: e, tasks: childTasks, date });
        });

        // 3. Process standalone tasks
        standaloneTasks.forEach(t => {
            const dateRaw = t.due_date || t.dueDate;
            const date = normalizeDate(dateRaw);
            if (date) {
                calendarItems.push({ type: "task", data: t, date });
            }
        });

        // 4. Sort all items chronologically by their anchor date
        calendarItems.sort((a, b) => a.date.getTime() - b.date.getTime());

        // 5. Final grouping into date headers
        const groups = new Map<string, CalendarItem[]>();
        calendarItems.forEach(item => {
            const key = format(item.date, 'yyyy-MM-dd');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(item);
        });

        return Array.from(groups.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([dateKey, items]) => ({
                date: parseISO(dateKey),
                items
            }));
    }, [events, tasks, filter]);

    if (process.env.NODE_ENV === 'development') {
        const allKeys = groupedItems.flatMap(g =>
            g.items.map(i => `${i.type}-${i.data.id}`)
        );

        const duplicates = allKeys.filter(
            (item, index) => allKeys.indexOf(item) !== index
        );

        if (duplicates.length > 0 || allKeys.includes("")) {
            console.error("Timeline duplicate or empty keys detected:", {
                duplicates,
                hasEmpty: allKeys.includes("")
            });
        }
    }

    return (
        <div className="space-y-8 relative">
            <AnimatePresence mode="popLayout">
                {/* Continuous Vertical Line Background */}
                <div className="absolute left-[24px] top-0 bottom-0 w-px bg-foreground/10 z-0" />

                {groupedItems.length === 0 ? (
                    <motion.div
                        key="empty-state"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center justify-center py-20 text-center text-foreground/80 relative z-10"
                    >
                        <div className="h-20 w-20 rounded-full bg-foreground/5 flex items-center justify-center mb-6 border border-foreground/10">
                            <CalendarIcon className={cn("h-10 w-10 opacity-40 text-foreground/80", loading && "animate-pulse")} />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            {loading ? "Syncing your schedule..." : "No upcoming items"}
                        </h3>
                        <p className="max-w-xs mx-auto mb-6 text-sm">
                            {loading ? "Fetching your latest events and tasks..." : "You're all caught up! Create an event or task to get started."}
                        </p>
                        {!loading && (
                            <Button onClick={onCreateEvent} variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-all duration-200">
                                Schedule Event
                            </Button>
                        )}
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
                            <div className="sticky top-0 z-20 mb-8 flex items-center gap-6 bg-background/80 py-4 backdrop-blur-md -mx-4 px-6 border-b border-foreground/5">
                                <div className="event-date-badge shadow-lg">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-0.5">{format(group.date, "MMM")}</span>
                                    <span className="text-xl font-bold text-foreground leading-none">{format(group.date, "d")}</span>
                                </div>
                                <div className="flex flex-col">
                                    <h2 className={cn("text-xl font-bold tracking-tight", isToday(group.date) ? "text-blue-400" : "text-foreground")}>
                                        {isToday(group.date) ? "Today" : isTomorrow(group.date) ? "Tomorrow" : format(group.date, "EEEE")}
                                    </h2>
                                    <span className="text-xs font-medium text-foreground/80 uppercase tracking-widest">
                                        {format(group.date, "MMMM yyyy")}
                                    </span>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="bg-foreground/5 border border-foreground/10 rounded-full px-3 py-1 text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                                        {group.items.length} Items
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6 pl-12">
                                {group.items.map((item, idx) => (
                                    <div
                                        key={`${item.type}-${item.data.id}`}
                                        className="relative group/item"
                                    >
                                        {/* Timeline Dot Indicator */}
                                        <div className={cn(
                                            "absolute -left-[17px] top-6 h-2 w-2 rounded-full z-10 transition-all duration-300 group-hover/item:scale-150 group-hover/item:ring-4",
                                            item.type === 'event' 
                                                ? 'bg-blue-500 ring-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.5)]' 
                                                : 'bg-emerald-500 ring-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                        )} />

                                        {item.type === "event" ? (
                                            <div className="space-y-4">
                                                <EventCard 
                                                    event={item.data} 
                                                    className="event-surface !p-4 border-foreground/5 hover:bg-blue-500/5 transition-all duration-300" 
                                                />
                                                
                                                {/* Nested Tasks */}
                                                {item.tasks && item.tasks.length > 0 && (
                                                    <div className="ml-8 space-y-3 relative">
                                                        {/* Vertical line connector */}
                                                        <div className="absolute left-[-20px] top-[-10px] bottom-6 w-px bg-foreground/10" />
                                                        
                                                        {item.tasks.map((task) => (
                                                            <div key={task.id} className="relative flex items-center">
                                                                {/* Horizontal connector line */}
                                                                <div className="absolute left-[-20px] top-1/2 w-4 h-[1px] bg-foreground/10" />
                                                                
                                                                <div className={cn(
                                                                    "flex-1 flex items-center justify-between gap-4 bg-foreground/[0.03] p-3 rounded-xl border border-foreground/5 hover:bg-foreground/[0.06] transition-all group/task",
                                                                    task.status === 'Done' && "opacity-60"
                                                                )}>
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className={cn(
                                                                            "w-1.5 h-1.5 rounded-full shrink-0",
                                                                            task.status === 'Done' ? "bg-emerald-500" : "bg-blue-500"
                                                                        )} />
                                                                        <p className={cn(
                                                                            "text-xs font-medium truncate",
                                                                            task.status === 'Done' ? "text-foreground/80 line-through" : "text-foreground/90"
                                                                        )}>
                                                                            {task.title}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {task.priority && (
                                                                            <span className={cn(
                                                                                "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                                                                                 task.priority === 'high' ? "bg-orange-500/10 text-orange-400" : "bg-foreground/5 text-foreground/80"
                                                                            )}>
                                                                                {task.priority}
                                                                            </span>
                                                                        )}
                                                                        {task.status === 'Done' && <CheckCircle2 size={12} className="text-emerald-500" />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "event-card-base p-4 flex items-center justify-between group/task",
                                                item.data.status === 'Done' && "opacity-60"
                                            )}>
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20",
                                                        item.data.status === 'Done' && "bg-foreground/5 border-foreground/10"
                                                    )}>
                                                        <CheckCircle2 className={cn("h-5 w-5", item.data.status === 'Done' ? "text-foreground/80" : "text-emerald-500")} />
                                                    </div>
                                                    <div>
                                                        <h3 className={cn("text-sm font-bold", item.data.status === 'Done' ? "text-foreground/80 line-through" : "text-foreground")}>
                                                            {item.data.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/70">Task</span>
                                                            {item.data.priority && (
                                                                <span className="text-[10px] text-foreground/80 uppercase tracking-tighter">• {item.data.priority}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>
    );
}
