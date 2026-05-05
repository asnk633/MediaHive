'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
    format, 
    startOfWeek, 
    addDays, 
    eachDayOfInterval, 
    isToday, 
    startOfDay, 
    addMinutes, 
    differenceInMinutes, 
    parseISO,
    setHours,
    setMinutes,
    isWithinInterval
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Event } from '@/features/events/types/event';
import { normalizeDate, getEventDays } from '@/features/events/utils/dateNormalization';
import './weekTimeline.css';

interface WeekTimelineViewProps {
    events: Event[];
    currentDate: Date;
    onDateChange: (date: Date) => void;
    onEventClick: (event: Event) => void;
    onEventUpdate: (id: string, updates: Partial<Event>) => void;
    onCreateEvent: (date: Date, startTime?: string, endTime?: string) => void;
    onRangeSelect: (start: Date, end: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_HEIGHT = 50; // pixels per hour
const START_HOUR = 8;
const END_HOUR = 20;
const PIXELS_PER_MINUTE = SLOT_HEIGHT / 60;

export function WeekTimelineView({ 
    events, 
    currentDate, 
    onDateChange, 
    onEventClick, 
    onEventUpdate,
    onCreateEvent,
    onRangeSelect 
}: WeekTimelineViewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [now, setNow] = useState(new Date());

    // Drag State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ day: Date; top: number } | null>(null);
    const [dragEnd, setDragEnd] = useState<{ day: Date; top: number } | null>(null);

    // Resize State
    const [isResizing, setIsResizing] = useState(false);
    const [resizingId, setResizingId] = useState<string | null>(null);
    const [resizingType, setResizingType] = useState<'top' | 'bottom' | null>(null);
    const [resizingTop, setResizingTop] = useState(0);
    const [resizingHeight, setResizingHeight] = useState(0);

    // Initial mount
    useEffect(() => {
        setMounted(true);
        setNow(new Date());
    }, []);

    // Update current time every minute
    useEffect(() => {
        if (!mounted) return;
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, [mounted]);

    // Scroll to start hour on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = START_HOUR * SLOT_HEIGHT;
        }
    }, []);

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
        return eachDayOfInterval({
            start,
            end: addDays(start, 6)
        });
    }, [currentDate]);

    const navigatePrev = () => onDateChange(addDays(currentDate, -7));
    const navigateNext = () => onDateChange(addDays(currentDate, 7));
    const navigateToday = () => onDateChange(new Date());

    // Helper to get vertical position from date
    const getTimePosition = (date: Date) => {
        const minutesFromMidnight = differenceInMinutes(date, startOfDay(date));
        return minutesFromMidnight * PIXELS_PER_MINUTE;
    };

    // Filter and group events by day
    const eventsByDay = useMemo(() => {
        const groups: { [key: string]: Event[] } = {};
        
        events.forEach(event => {
            const startAt = event.start_at || (event as any).date;
            const endAt = event.end_at || (event as any).date;
            if (!startAt) return;
            
            try {
                const eventDays = getEventDays(startAt, endAt);
                eventDays.forEach(dateStr => {
                    if (!groups[dateStr]) groups[dateStr] = [];
                    groups[dateStr].push(event);
                });
            } catch (e) {
                console.error("WeekTimeline: Failed to parse event date", startAt, e);
            }
        });
        
        return groups;
    }, [events]);

    // Calculate Overlaps for Layout
    const getLayoutData = (dayEvents: Event[]) => {
        const sorted = [...dayEvents].sort((a, b) => {
            const aStartRaw = a.start_at || (a as any).date;
            const bStartRaw = b.start_at || (b as any).date;
            const aDate = normalizeDate(aStartRaw) || new Date();
            const bDate = normalizeDate(bStartRaw) || new Date();
            return aDate.getTime() - bDate.getTime();
        });

        const columns: Event[][] = [];
        
        sorted.forEach(evt => {
            let placed = false;
            const startRaw = evt.start_at || (evt as any).date;
            const endRaw = evt.end_at;
            const evtStart = typeof startRaw === 'string' ? parseISO(startRaw) : new Date(startRaw);
            const evtEnd = endRaw ? (typeof endRaw === 'string' ? parseISO(endRaw) : new Date(endRaw)) : addMinutes(evtStart, 60);

            for (let i = 0; i < columns.length; i++) {
                const lastInCol = columns[i][columns[i].length - 1];
                const lastStartRaw = lastInCol.start_at || (lastInCol as any).date;
                const lastEndRaw = lastInCol.end_at;
                
                const evtStart = normalizeDate(startRaw) || new Date();
                const evtEnd = endRaw ? (normalizeDate(endRaw) || addMinutes(evtStart, 60)) : addMinutes(evtStart, 60);

                const lastEnd = lastEndRaw ? (normalizeDate(lastEndRaw) || addMinutes(normalizeDate(lastStartRaw) || new Date(), 60)) : addMinutes(normalizeDate(lastStartRaw) || new Date(), 60);
                
                if (evtStart >= lastEnd) {
                    columns[i].push(evt);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                columns.push([evt]);
            }
        });

        const layoutMap = new Map<string, { left: string; width: string }>();
        columns.forEach((col, colIdx) => {
            col.forEach(evt => {
                layoutMap.set(evt.id, {
                    left: `${(colIdx / columns.length) * 100}%`,
                    width: `${(1 / columns.length) * 100 - 1}%`
                });
            });
        });

        return layoutMap;
    };

    const handleMouseDown = (e: React.MouseEvent, day: Date) => {
        if (e.button !== 0) return; // Only primary button
        const rect = e.currentTarget.getBoundingClientRect();
        const top = e.clientY - rect.top;
        setIsDragging(true);
        setDragStart({ day, top });
        setDragEnd({ day, top });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const rect = e.currentTarget.getBoundingClientRect();
            const top = Math.max(0, e.clientY - rect.top);
            setDragEnd(prev => prev ? { ...prev, top } : null);
        } else if (isResizing && resizingId) {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseTop = e.clientY - rect.top;
            
            if (resizingType === 'top') {
                const newHeight = resizingHeight + (resizingTop - mouseTop);
                if (newHeight > 15) {
                    setResizingTop(mouseTop);
                    setResizingHeight(newHeight);
                }
            } else {
                const newHeight = mouseTop - resizingTop;
                if (newHeight > 15) {
                    setResizingHeight(newHeight);
                }
            }
        }
    };

    const handleResizeStart = (e: React.MouseEvent, event: Event, type: 'top' | 'bottom') => {
        e.stopPropagation();
        const start = normalizeDate(event.start_at) || new Date();
        const end = event.end_at ? (normalizeDate(event.end_at) || addMinutes(start, 60)) : addMinutes(start, 60);
        
        setIsResizing(true);
        setResizingId(event.id);
        setResizingType(type);
        setResizingTop(getTimePosition(start));
        setResizingHeight(getTimePosition(end) - getTimePosition(start));
    };

    useEffect(() => {
        const handleMouseUp = () => {
            if (isDragging && dragStart && dragEnd) {
                const startTop = Math.min(dragStart.top, dragEnd.top);
                const endTop = Math.max(dragStart.top, dragEnd.top);

                const startMin = Math.floor(startTop / SLOT_HEIGHT * 60);
                const endMin = Math.floor(endTop / SLOT_HEIGHT * 60);

                const startDate = setMinutes(setHours(startOfDay(dragStart.day), 0), startMin);
                const endDate = setMinutes(setHours(startOfDay(dragStart.day), 0), endMin);

                if (Math.abs(endTop - startTop) > 10) {
                    onRangeSelect(startDate, endDate);
                } else {
                    onCreateEvent(startDate);
                }
            } else if (isResizing && resizingId && resizingType) {
                const startMin = Math.floor(resizingTop / SLOT_HEIGHT * 60);
                const endMin = Math.floor((resizingTop + resizingHeight) / SLOT_HEIGHT * 60);

                const event = events.find(e => e.id === resizingId);
                if (event) {
                    const baseDate = startOfDay(normalizeDate(event.start_at) || new Date());
                    const newStart = setMinutes(setHours(baseDate, 0), startMin);
                    const newEnd = setMinutes(setHours(baseDate, 0), endMin);

                    onEventUpdate(resizingId, {
                        start_at: newStart.toISOString(),
                        end_at: newEnd.toISOString()
                    });
                }
            }

            setIsDragging(false);
            setDragStart(null);
            setDragEnd(null);
            setIsResizing(false);
            setResizingId(null);
            setResizingType(null);
        };
// ...

        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, [isDragging, dragStart, dragEnd, onRangeSelect, onCreateEvent]);

    return (
        <div className="space-y-4">
            {/* Header Controls */}
            <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black tracking-tighter text-white">
                        {format(weekDays[0], 'MMM dd')}
                        <span className="text-blue-500/50 mx-2">—</span>
                        {format(weekDays[6], 'MMM dd')}
                        <span className="text-white/20 ml-2">{format(weekDays[6], 'yyyy')}</span>
                    </h2>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Operational Schedule</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={navigatePrev}
                        className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={navigateToday}
                        className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"
                    >
                        Today
                    </button>
                    <button
                        onClick={navigateNext}
                        className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Timeline View */}
            <div className="week-timeline-container shadow-2xl">
                {/* Fixed Headers */}
                <div className="week-timeline-header">
                    <div className="time-gutter" />
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className={cn("day-header", isToday(day) && "is-today")}>
                            <div className="day-name">{format(day, 'EEE')}</div>
                            <div className="day-date">{format(day, 'd')}</div>
                        </div>
                    ))}
                </div>

                {/* Scrollable Content */}
                <div className="timeline-grid-scroll" ref={scrollContainerRef}>
                    <div className="timeline-grid">
                        {/* Time Column */}
                        <div className="time-labels">
                            {HOURS.map(hour => (
                                <div key={hour} className="time-label">
                                    {format(setHours(startOfDay(new Date()), hour), 'ha')}
                                </div>
                            ))}
                        </div>

                        {/* Day Columns */}
                        {weekDays.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const dayEvents = eventsByDay[dateStr] || [];
                            const isCurrentDay = isToday(day);
                            const layoutData = getLayoutData(dayEvents);

                            const dragHighlight = isDragging && dragStart && format(dragStart.day, 'yyyy-MM-dd') === dateStr ? {
                                top: Math.min(dragStart.top, dragEnd?.top || dragStart.top),
                                height: Math.abs((dragEnd?.top || dragStart.top) - dragStart.top)
                            } : null;

                            return (
                                <div 
                                    key={day.toISOString()} 
                                    className="day-column select-none"
                                    onMouseDown={(e) => handleMouseDown(e, day)}
                                    onMouseMove={handleMouseMove}
                                >
                                    {/* Grid Lines */}
                                    {HOURS.map(hour => (
                                        <div key={hour} className="grid-row" />
                                    ))}

                                    {/* Drag Highlight */}
                                    {dragHighlight && (
                                        <div 
                                            className="drag-selection"
                                            style={{ top: dragHighlight.top, height: dragHighlight.height }}
                                        />
                                    )}

                                    {/* Events */}
                                    {dayEvents.map(event => {
                                        const eventStart = normalizeDate(event.start_at) || new Date();
                                        const eventEnd = event.end_at ? (normalizeDate(event.end_at) || addMinutes(eventStart, 60)) : addMinutes(eventStart, 60);
                                        
                                        // Clip to day start/end for visualization
                                        const dayStart = startOfDay(day);
                                        const dayEnd = addMinutes(dayStart, 1439.9); // 23:59:59
                                        
                                        const renderStart = eventStart < dayStart ? dayStart : eventStart;
                                        const renderEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
                                        
                                        const top = getTimePosition(renderStart);
                                        const duration = differenceInMinutes(renderEnd, renderStart);
                                        const height = Math.max(30, duration * PIXELS_PER_MINUTE);
                                        
                                        const layout = layoutData.get(event.id);

                                        const isBeingResized = resizingId === event.id;
                                        const activeTop = isBeingResized ? resizingTop : top;
                                        const activeHeight = isBeingResized ? resizingHeight : height;

                                        return (
                                            <Link 
                                                href={`/events/${event.id}`}
                                                key={event.id}
                                                className={cn(
                                                    "event-block", 
                                                    event.is_system_event && "is-system",
                                                    isBeingResized && "z-50 shadow-glow",
                                                    "block no-underline"
                                                )}
                                                style={{ 
                                                    top: activeTop, 
                                                    height: activeHeight,
                                                    left: layout?.left,
                                                    width: layout?.width
                                                }}
                                            >
                                                {!event.is_system_event && (
                                                    <div 
                                                        className="resize-handle-top" 
                                                        onMouseDown={(e) => handleResizeStart(e, event, 'top')}
                                                    />
                                                )}
                                                
                                                <div className="event-title">{event.title}</div>
                                                <div className="event-time font-mono">
                                                    {format(isBeingResized ? setMinutes(setHours(startOfDay(now), 0), Math.floor(activeTop / SLOT_HEIGHT * 60)) : eventStart, 'HH:mm')} - 
                                                    {format(isBeingResized ? setMinutes(setHours(startOfDay(now), 0), Math.floor((activeTop + activeHeight) / SLOT_HEIGHT * 60)) : eventEnd, 'HH:mm')}
                                                </div>

                                                {!event.is_system_event && (
                                                    <div 
                                                        className="resize-handle-bottom" 
                                                        onMouseDown={(e) => handleResizeStart(e, event, 'bottom')}
                                                    />
                                                )}
                                            </Link>
                                        );
                                    })}

                                    {/* Current Time Indicator for Today */}
                                    {isCurrentDay && mounted && now && (
                                        <div 
                                            className="current-time-line"
                                            style={{ top: getTimePosition(now) }}
                                        >
                                            <div className="current-time-dot" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
