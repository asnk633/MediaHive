'use client';

import { useMemo, useState, useEffect } from "react";
import { useClientData, TaskLite, EventLite } from "@/app/(shell)/ClientDataContext";
import { 
    format, parseISO, isSameDay, startOfDay, isToday, isTomorrow,
    startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
    addDays, subDays, addMonths, subMonths, addWeeks, subWeeks
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Calendar as CalendarIcon, CheckCircle2, Clock, Plus, Filter, 
    LayoutList, Grid3X3, ChevronLeft, ChevronRight, Info, AlertCircle, Circle, ArrowRight
} from "lucide-react";
import { EventCard } from "@/components/event/EventCard";
import { EventModal } from "@/components/event/EventModal";
import { Button } from "@/components/ui/button";
import { cn, nativeNavigate } from "@/lib/utils";
import { normalizeDate } from "@/features/events/utils/dateNormalization";
import { CanonicalDataService } from "@/services/canonicalDataService";
import { useRouter } from "next/navigation";
import { useEvents } from "@/features/events/hooks/useEvents";
import "react-day-picker/style.css";

type CalendarItem =
    | { type: "event"; data: EventLite; date: Date }
    | { type: "task"; data: TaskLite; date: Date };

export type CalendarView = 'timeline' | 'month' | 'week';

export default function CalendarClient() {
    const { data: rawEvents, isLoading: eventsLoading } = useEvents();
    const { tasks, loading: tasksLoading } = useClientData();
    
    const events = useMemo(() => {
        return (rawEvents || []).map((e: any) => ({
            ...e,
            start_time: e.start_time || e.startTime,
            end_time: e.end_time || e.endTime
        })) as EventLite[];
    }, [rawEvents]);
    
    const loading = tasksLoading || eventsLoading;
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const router = useRouter();
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [filter, setFilter] = useState<'all' | 'events' | 'tasks'>('all');
    
    // Calendar Navigation State
    const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

    // Day Inspector State
    const [inspectedDate, setInspectedDate] = useState<Date | null>(null);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    // Load preference or default to timeline
    const [view, setView] = useState<CalendarView>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('calendar-view-pref');
            return (saved === 'month' || saved === 'week' || saved === 'timeline') ? saved : 'timeline';
        }
        return 'timeline';
    });

    // Save on change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('calendar-view-pref', view);
        }
    }, [view]);

    useEffect(() => {
        if (searchParams.get('modal') === 'new-event') {
            setIsEventModalOpen(true);
        }
    }, [searchParams]);

    const handleModalClose = () => {
        setIsEventModalOpen(false);
        setSelectedDate(undefined);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('modal');
        nativeNavigate(`/calendar?${params.toString()}`, router, 'Calendar (Modal Close)');
    };

    const groupedItems = useMemo(() => {
        const items: CalendarItem[] = [];

        if (filter === 'all' || filter === 'events') {
            events.forEach(e => {
                if (e.start_time) {
                    items.push({ type: "event", data: e, date: normalizeDate(e.start_time) || new Date() });
                }
            });
        }

        if (filter === 'all' || filter === 'tasks') {
            tasks.forEach(t => {
                if (t.due_date || t.dueDate) {
                    items.push({ type: "task", data: t, date: normalizeDate(t.due_date || t.dueDate) || new Date() });
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

    // Flat list of items for quick lookup in month/week grid cells
    const allScheduleItems = useMemo(() => {
        const items: CalendarItem[] = [];

        if (filter === 'all' || filter === 'events') {
            events.forEach(e => {
                if (e.start_time) {
                    items.push({ type: "event", data: e, date: normalizeDate(e.start_time) || new Date() });
                }
            });
        }

        if (filter === 'all' || filter === 'tasks') {
            tasks.forEach(t => {
                if (t.due_date || t.dueDate) {
                    items.push({ type: "task", data: t, date: normalizeDate(t.due_date || t.dueDate) || new Date() });
                }
            });
        }
        return items;
    }, [events, tasks, filter]);

    // Navigation handlers
    const handlePrev = () => {
        if (view === 'month') {
            setCurrentDate(prev => subMonths(prev, 1));
        } else if (view === 'week') {
            setCurrentDate(prev => subWeeks(prev, 1));
        } else {
            setCurrentDate(prev => subDays(prev, 7));
        }
    };

    const handleNext = () => {
        if (view === 'month') {
            setCurrentDate(prev => addMonths(prev, 1));
        } else if (view === 'week') {
            setCurrentDate(prev => addWeeks(prev, 1));
        } else {
            setCurrentDate(prev => addDays(prev, 7));
        }
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Month days calculator
    const monthDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    // Week days calculator
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    // Days items lookup helper
    const getItemsForDay = (day: Date) => {
        return allScheduleItems.filter(item => isSameDay(item.date, day));
    };

    const inspectedDayItems = useMemo(() => {
        if (!inspectedDate) return [];
        return getItemsForDay(inspectedDate);
    }, [inspectedDate, allScheduleItems]);

    const handleDayClick = (day: Date) => {
        setInspectedDate(day);
        setIsInspectorOpen(true);
    };

    return (
        <div className="min-h-full px-4 max-w-4xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] mb-1">
                        {view === 'timeline' && 'Timeline'}
                        {view === 'month' && format(currentDate, "MMMM yyyy")}
                        {view === 'week' && `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`}
                    </h1>
                    <p className="text-[var(--muted)]">Your schedule and deadlines</p>
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto">
                    {/* Month/Week controls */}
                    {view !== 'timeline' && (
                        <div className="flex items-center bg-[var(--panel)] border border-[var(--glass-border)] rounded-lg p-0.5">
                            <button
                                onClick={handlePrev}
                                className="p-2 hover:bg-[var(--panel-strong)] rounded-md text-[var(--text-secondary)] transition-all"
                                aria-label="Previous"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={handleToday}
                                className="px-3 py-1.5 hover:bg-[var(--panel-strong)] rounded-md text-xs font-semibold text-[var(--text-secondary)] transition-all"
                            >
                                Today
                            </button>
                            <button
                                onClick={handleNext}
                                className="p-2 hover:bg-[var(--panel-strong)] rounded-md text-[var(--text-secondary)] transition-all"
                                aria-label="Next"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {/* View Toggle */}
                    <div className="flex p-1 bg-[var(--panel)] rounded-lg border border-[var(--glass-border)]">
                        <button
                            onClick={() => setView('timeline')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${view === 'timeline' ? 'bg-[var(--accent)] text-[var(--text)] shadow-glow' : 'text-[var(--text-secondary)] hover:bg-[var(--panel-strong)]'}`}
                        >
                            <LayoutList size={12} />
                            Timeline
                        </button>
                        <button
                            onClick={() => setView('month')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${view === 'month' ? 'bg-[var(--accent)] text-[var(--text)] shadow-glow' : 'text-[var(--text-secondary)] hover:bg-[var(--panel-strong)]'}`}
                        >
                            <Grid3X3 size={12} />
                            Month
                        </button>
                        <button
                            onClick={() => setView('week')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${view === 'week' ? 'bg-[var(--accent)] text-[var(--text)] shadow-glow' : 'text-[var(--text-secondary)] hover:bg-[var(--panel-strong)]'}`}
                        >
                            <CalendarIcon size={12} />
                            Week
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
                        onClick={() => {
                            setSelectedDate(new Date());
                            setIsEventModalOpen(true);
                        }}
                        aria-label="Create new item"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Task Status Legend */}
            {view !== 'timeline' && (
                <div className="flex flex-wrap items-center gap-4 mb-6 px-3 py-2.5 bg-foreground/[0.01] border border-foreground/[0.04] rounded-xl text-[10px] uppercase font-bold tracking-wider text-foreground/50 w-fit mx-auto md:mx-0">
                    <span className="text-[9px] font-extrabold text-foreground/35">Legend:</span>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.3)]" /> <span>Event</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-500" /> <span>To Do</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> <span>Working</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> <span>On Hold</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]" /> <span>Completed</span></div>
                </div>
            )}

            <div className="space-y-8 relative">
                <AnimatePresence mode="popLayout">
                    {view === 'timeline' ? (
                        <div className="relative">
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
                                        <CalendarIcon className={cn("h-10 w-10 opacity-20 text-[var(--icon-muted)]", loading && "animate-pulse")} />
                                    </div>
                                    <h3 className="text-lg font-medium text-[var(--text)] mb-2">
                                        {loading ? "Syncing your schedule..." : "No upcoming items"}
                                    </h3>
                                    <p className="max-w-xs mx-auto mb-6">
                                        {loading ? "Fetching your latest events and tasks..." : "You're all caught up! Create an event or task to get started."}
                                    </p>
                                    {!loading && (
                                        <Button onClick={() => setIsEventModalOpen(true)} variant="outline" className="border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all duration-200 ease-in-out">
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
                        </div>
                    ) : view === 'month' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-[var(--panel)] rounded-2xl border border-[var(--glass-border)] overflow-hidden backdrop-blur-md shadow-lg"
                        >
                            {/* Days of Week Header */}
                            <div className="grid grid-cols-7 border-b border-[var(--glass-border)] bg-black/40 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest text-foreground/50">
                                <div>Sun</div>
                                <div>Mon</div>
                                <div>Tue</div>
                                <div>Wed</div>
                                <div>Thu</div>
                                <div>Fri</div>
                                <div>Sat</div>
                            </div>

                            {/* Month Grid Cells */}
                            <div className="grid grid-cols-7 divide-x divide-y divide-[var(--glass-border)] bg-[var(--panel)]">
                                {monthDays.map((day, idx) => {
                                    const dayItems = getItemsForDay(day);
                                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                                    return (
                                        <div
                                            key={day.toISOString()}
                                            onClick={() => handleDayClick(day)}
                                            className={cn(
                                                "min-h-[100px] p-2 flex flex-col justify-between hover:bg-foreground/[0.015] cursor-pointer select-none transition-colors relative group",
                                                !isCurrentMonth && "bg-black/[0.15] opacity-35"
                                            )}
                                        >
                                            {/* Date indicator and selection wrapper */}
                                            <div className="flex items-center justify-between">
                                                <span className={cn(
                                                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all",
                                                    isToday(day) ? "bg-[var(--accent)] text-[var(--text)] shadow-glow font-extrabold" : "text-foreground/75"
                                                )}>
                                                    {format(day, "d")}
                                                </span>

                                                {/* Mini add hover indicator */}
                                                <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-[var(--accent)] transition-opacity uppercase tracking-wider flex items-center gap-0.5">
                                                    <Plus size={8} /> Add
                                                </span>
                                            </div>

                                            {/* Micro-events stacking list */}
                                            <div className="flex-1 flex flex-col gap-1 mt-2.5 justify-end">
                                                {dayItems.slice(0, 3).map((item, itemIdx) => {
                                                    const isEvent = item.type === 'event';
                                                    
                                                    // Task status colors mapping
                                                    const taskColors = {
                                                        todo: 'bg-slate-500/20 text-foreground border-slate-500/30',
                                                        in_progress: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
                                                        review: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
                                                        done: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                                    };
                                                    
                                                    const badgeClass = isEvent 
                                                         ? 'bg-blue-600/20 text-blue-300 border-blue-500/40' 
                                                         : (item.type === 'task' && item.data.status ? taskColors[item.data.status.toLowerCase() as keyof typeof taskColors] : undefined) || taskColors.todo;

                                                    return (
                                                        <div
                                                            key={itemIdx}
                                                            className={cn(
                                                                "text-[9px] font-extrabold truncate px-1.5 py-0.5 border rounded leading-tight uppercase tracking-wider",
                                                                badgeClass
                                                            )}
                                                            title={item.data.title}
                                                        >
                                                            {isEvent ? 'Evt: ' : 'Tsk: '}{item.data.title}
                                                        </div>
                                                    );
                                                })}
                                                {dayItems.length > 3 && (
                                                    <div className="text-[8px] font-bold text-foreground/40 text-center uppercase tracking-widest">
                                                        +{dayItems.length - 3} More
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        // Custom Interactive Week view
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="grid grid-cols-1 sm:grid-cols-7 gap-4 items-stretch"
                        >
                            {weekDays.map((day, idx) => {
                                const dayItems = getItemsForDay(day);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={cn(
                                            "flex flex-col bg-[var(--panel)] border rounded-2xl p-4.5 backdrop-blur-md transition-all duration-200 min-h-[300px]",
                                            isToday(day) ? "border-[var(--accent)] shadow-[0_0_15px_rgba(255,184,0,0.06)] scale-[1.01]" : "border-[var(--glass-border)]"
                                        )}
                                    >
                                        {/* Column Header */}
                                        <div className="flex items-center justify-between pb-3 border-b border-foreground/[0.04] mb-4">
                                            <div className="flex flex-col text-left">
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/40">{format(day, "eee")}</span>
                                                <span className={cn(
                                                    "text-lg font-black tracking-tight",
                                                    isToday(day) ? "text-[var(--accent)]" : "text-foreground/90"
                                                )}>
                                                    {format(day, "d")}
                                                </span>
                                            </div>
                                            
                                            {/* Day count badge */}
                                            {dayItems.length > 0 && (
                                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-foreground/[0.03] border border-foreground/[0.05] text-foreground/60">
                                                    {dayItems.length}
                                                </span>
                                            )}
                                        </div>

                                        {/* Weekly Schedule Stack */}
                                        <div className="flex-1 flex flex-col gap-3">
                                            {dayItems.map((item, itemIdx) => {
                                                const isEvent = item.type === 'event';
                                                
                                                const taskColors = {
                                                    todo: 'border-slate-500/30 text-foreground bg-slate-500/5 hover:bg-slate-500/10',
                                                    in_progress: 'border-blue-400/30 text-blue-200 bg-blue-400/5 hover:bg-blue-400/10',
                                                    review: 'border-amber-400/30 text-amber-200 bg-amber-400/5 hover:bg-amber-400/10',
                                                    done: 'border-emerald-500/30 text-emerald-200 bg-emerald-500/5 hover:bg-emerald-500/10 line-through opacity-60'
                                                };
                                                
                                                const activeClass = isEvent 
                                                     ? 'border-blue-600/40 text-blue-100 bg-blue-600/5 hover:bg-blue-600/10' 
                                                     : (item.type === 'task' && item.data.status ? taskColors[item.data.status.toLowerCase() as keyof typeof taskColors] : undefined) || taskColors.todo;

                                                return (
                                                    <div
                                                        key={itemIdx}
                                                        onClick={() => handleDayClick(day)}
                                                        className={cn(
                                                            "p-3 rounded-xl border text-left cursor-pointer transition-all active:scale-95 flex flex-col justify-between gap-2.5",
                                                            activeClass
                                                        )}
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            <div className="text-[8px] uppercase font-black tracking-widest opacity-40">
                                                                {isEvent ? 'Event' : 'Task'}
                                                            </div>
                                                            <h5 className="text-[11px] font-bold leading-snug line-clamp-2">
                                                                {item.data.title}
                                                            </h5>
                                                        </div>

                                                        {/* Priority & Assignee Info */}
                                                        {item.type === 'task' && item.data.priority && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={cn(
                                                                    "text-[7px] uppercase font-extrabold px-1 py-0.2 rounded border",
                                                                    item.data.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/25' :
                                                                    item.data.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25' :
                                                                    'bg-slate-500/10 text-foreground/60 border-slate-500/25'
                                                                )}>
                                                                    {item.data.priority}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {dayItems.length === 0 && (
                                                <div 
                                                    onClick={() => {
                                                        setSelectedDate(day);
                                                        setIsEventModalOpen(true);
                                                    }}
                                                    className="flex-1 flex flex-col items-center justify-center py-10 border border-dashed border-foreground/[0.04] rounded-xl text-foreground/20 text-[9px] uppercase tracking-wider font-extrabold select-none hover:bg-foreground/[0.01] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all cursor-pointer"
                                                >
                                                    <Plus size={10} className="mb-1" />
                                                    Add Item
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Day Inspector Modal */}
            <AnimatePresence>
                {isInspectorOpen && inspectedDate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f1219]/95 border border-[var(--glass-border)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-foreground/[0.05] bg-black/30 flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] uppercase font-black tracking-widest text-[var(--accent)] mb-0.5">Inspector</div>
                                    <h3 className="text-base font-bold text-foreground">{format(inspectedDate, "EEEE, MMMM d, yyyy")}</h3>
                                </div>
                                <button
                                    onClick={() => setIsInspectorOpen(false)}
                                    className="p-1 rounded-lg hover:bg-foreground/5 text-foreground/45 hover:text-foreground/80 transition-colors text-sm font-bold uppercase tracking-wider"
                                >
                                    Close
                                </button>
                            </div>

                            {/* Items List */}
                            <div className="p-5 overflow-y-auto max-h-[350px] space-y-4">
                                {inspectedDayItems.length === 0 ? (
                                    <div className="py-8 text-center text-foreground/35 text-xs font-semibold">
                                        No tasks or events scheduled for this day.
                                    </div>
                                ) : (
                                    inspectedDayItems.map((item, idx) => {
                                        const isEvent = item.type === 'event';
                                        return (
                                            <div 
                                                key={idx}
                                                className="p-4 bg-foreground/[0.01] border border-foreground/[0.04] rounded-xl flex items-start gap-4 transition-all hover:bg-foreground/[0.02]"
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                                                    isEvent ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                                                )}>
                                                    {isEvent ? <CalendarIcon size={16} /> : <CheckCircle2 size={16} />}
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <span className="text-[8px] uppercase font-black tracking-widest text-foreground/40">{item.type}</span>
                                                        {item.type === 'task' && item.data.priority && (
                                                            <span className={cn(
                                                                "text-[7px] uppercase font-extrabold px-1 rounded",
                                                                item.data.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-foreground/60'
                                                            )}>
                                                                {item.data.priority}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">{item.data.title}</h4>
                                                    {item.data.description && (
                                                        <p className="text-[10px] text-foreground/45 mt-1 leading-relaxed line-clamp-2">{item.data.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Actions Footer */}
                            <div className="p-4 bg-black/45 border-t border-foreground/[0.04] flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsInspectorOpen(false);
                                        setSelectedDate(inspectedDate);
                                        setIsEventModalOpen(true);
                                    }}
                                    className="border-[var(--glass-border)] bg-[var(--panel)] hover:bg-[var(--panel-strong)] text-xs text-foreground/80 hover:text-foreground w-full py-2.5 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                                >
                                    <Plus size={14} /> Schedule New Item
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={handleModalClose}
                defaultDate={selectedDate}
            />
        </div>
    );
}

function TaskCard({ task }: { task: TaskLite }) {
    const isDone = task.status === "Done";
    return (
        <div className={cn(
            "glass-card group relative overflow-hidden p-4 transition-all duration-200 ease-in-out hover:bg-[var(--panel)] hover:shadow-lg hover:shadow-[var(--accent)]/10 card-padding text-left flex flex-col gap-2",
            isDone && "opacity-60 grayscale-[0.5]"
        )}>
            <div className={cn("absolute left-0 top-0 h-full w-1", isDone ? "bg-emerald-500/30" : "bg-teal-500")} />

            <div className="flex items-start justify-between gap-2">
                <h3 className={cn("font-semibold text-[var(--text)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors duration-200 ease-in-out", isDone && "line-through text-[var(--muted)]")}>
                    {task.title}
                </h3>
                <span className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider border",
                    task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            'bg-slate-500/10 text-foreground/60 border-slate-500/20'
                )}>
                    {task.priority || 'low'}
                </span>
            </div>
            {task.description && (
                <p className="text-[10px] text-[var(--muted)] line-clamp-2 leading-relaxed">{task.description}</p>
            )}
        </div>
    );
}
