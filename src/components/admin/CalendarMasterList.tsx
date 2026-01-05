"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Search, Trash2, Edit2, Archive, CheckCircle2, XCircle, Bell, AlertTriangle } from 'lucide-react';
import { SystemEventService } from '@/services/systemEventService';
import { SystemEvent } from '@/types/systemEvent';
import { toast } from 'sonner';
import { CreateEventModal } from '@/components/library/organisms/CreateEventModal';
import { EventEditModal } from '@/components/events/EventEditModal';
import { Event } from '@/types/event'; // Need Event type compatibility for EditModal
import { apiClient } from '@/lib/apiClient';

export function CalendarMasterList() {
    const [events, setEvents] = useState<SystemEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [showDisabled, setShowDisabled] = useState(false);

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    // Fetch Events
    const fetchEvents = async () => {
        setLoading(true);
        try {
            // Fetch ALL system events (client-side filter for master list power)
            // Ideally we'd have a specific query, but getting all isn't too heavy for generic institutional apps yet.
            const allEvents = await SystemEventService.getAllSystemEvents();
            setEvents(allEvents);
        } catch (error) {
            console.error("Failed to fetch system events:", error);
            toast.error("Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const getSafeDate = (date: any): Date => {
        if (!date) return new Date();
        if (typeof date.toDate === 'function') return date.toDate();
        if (date.seconds) return new Date(date.seconds * 1000);
        return new Date(date);
    };

    const getSafeMillis = (date: any): number => {
        return getSafeDate(date).getTime();
    };

    // Filter Logic
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            if (!event.date) return false;
            const eventDate = getSafeDate(event.date);

            // Status Filter
            if (!showDisabled && event.status === 'disabled') return false;

            // Year Filter
            if (!showDisabled && eventDate.getFullYear() !== selectedYear) return false;

            // Search Filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return event.title.toLowerCase().includes(q) ||
                    event.type.toLowerCase().includes(q);
            }

            return true;
        }).sort((a, b) => getSafeMillis(a.date) - getSafeMillis(b.date));
    }, [events, selectedYear, searchQuery, showDisabled]);

    // Grouping Logic
    const groupedEvents = useMemo(() => {
        const groups: { [key: string]: SystemEvent[] } = {};
        filteredEvents.forEach(event => {
            if (!event.date) return;
            const monthKey = format(getSafeDate(event.date), 'MMMM yyyy'); // "January 2025"
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(event);
        });
        return groups;
    }, [filteredEvents]);

    const handleCreateClose = (created?: any) => {
        setIsCreateOpen(false);
        if (created) fetchEvents();
    };

    const handleEditClose = () => {
        setEditingEvent(null);
        fetchEvents(); // Refresh after edit
    };

    const toggleNotification = async (eventId: string, offset: string, currentState: boolean | undefined) => {
        // currentState: true = enabled, false = disabled, undefined = default (assume enabled if global rule exists)
        // We want to store explicit override.
        // New state should be !currentState (if defined) or false (if undefined/default-on)??
        // Wait, "default" implies enabled. So if undefined, treat as true. Toggle -> false. 
        // If false, toggle -> true.
        // If true, toggle -> false.

        const effectiveState = currentState !== false; // Default true
        const newState = !effectiveState;

        try {
            await apiClient(`/api/system-events/${eventId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    [`notificationPreferences.${offset}`]: newState
                })
            });

            // Optimistic Update
            setEvents(prev => prev.map(e => {
                if (e.id === eventId) {
                    return {
                        ...e,
                        notificationPreferences: {
                            ...e.notificationPreferences,
                            [offset]: newState
                        }
                    };
                }
                return e;
            }));

            toast.success(`Notification (${offset}d) ${newState ? 'Enabled' : 'Disabled'}`);
        } catch (error) {
            console.error("Failed to toggle rule:", error);
            toast.error("Update failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this System Event? This cannot be undone.")) return;
        try {
            await SystemEventService.deleteSystemEvent(id);
            toast.success("Event deleted");
            fetchEvents();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Delete failed");
        }
    };

    // Helper to Convert SystemEvent to Event for EditModal
    const openEdit = (sysEvent: SystemEvent) => {
        // Mapping
        const mapped: Event = {
            id: sysEvent.id,
            title: sysEvent.title,
            description: sysEvent.description || '',
            date: sysEvent.date!,
            startTime: sysEvent.date!, // Approximate, system events are usually all day or specific
            endTime: sysEvent.date!,
            location: '',
            type: sysEvent.type as any,
            status: 'approved',
            isSystemEvent: true,
            isMediaOffDay: sysEvent.isMediaOffDay,
            createdBy: { uid: sysEvent.createdBy.uid, name: sysEvent.createdBy.name, role: 'admin' },
            createdAt: sysEvent.createdAt,
            department: 'Management'
        };
        setEditingEvent(mapped);
    };

    return (
        <div className="w-full">
            {/* Toolbar */}
            <div className="p-4 border-b border-white/10 flex flex-wrap gap-4 items-center justify-between bg-black/20">
                <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2 border border-white/10 w-full sm:w-auto">
                    <Search size={18} className="text-white/40" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-white text-sm w-48 placeholder:text-white/20"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-white/50 hover:text-white cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showDisabled}
                            onChange={e => setShowDisabled(e.target.checked)}
                            className="rounded bg-white/5 border-white/10"
                        />
                        Show Disabled
                    </label>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none"
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                        + Add Holiday / Event
                    </button>
                </div>
            </div>

            {/* List Content */}
            <div className="overflow-x-auto min-h-[500px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-white/40">Loading Master List...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-white/40 text-[10px] uppercase font-bold tracking-wider">
                                <th className="p-4 w-32">Date</th>
                                <th className="p-4">Event Name</th>
                                <th className="p-4 w-32">Type</th>
                                <th className="p-4 w-32 text-center">Media Off</th>
                                <th className="p-4 w-48 text-center">Notifications</th>
                                <th className="p-4 w-24 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {Object.keys(groupedEvents).map(month => (
                                <React.Fragment key={month}>
                                    <tr className="bg-white/[0.02]">
                                        <td colSpan={6} className="px-4 py-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
                                            {month}
                                        </td>
                                    </tr>
                                    {groupedEvents[month].map(event => (
                                        <tr key={event.id} className="hover:bg-white/[0.02] group transition-colors">
                                            {/* Date */}
                                            <td className="p-4 text-white/70 font-mono text-xs">
                                                {event.date ? format(getSafeDate(event.date), 'dd MMM, EEE') : 'N/A'}
                                            </td>

                                            {/* Name */}
                                            <td className="p-4">
                                                <div className="font-medium text-white text-sm">{event.title}</div>
                                            </td>

                                            {/* Type */}
                                            <td className="p-4">
                                                <span className={`
                                                    px-2 py-0.5 rounded text-[10px] font-bold uppercase border
                                                    ${event.type === 'holiday' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        event.type === 'company' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-white/5 text-white/60 border-white/10'
                                                    }
                                                `}>
                                                    {event.type}
                                                </span>
                                            </td>

                                            {/* Media Off Day */}
                                            <td className="p-4 text-center">
                                                {event.isMediaOffDay ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                                                        <XCircle size={12} /> OFF
                                                    </span>
                                                ) : (
                                                    <span className="text-white/20">-</span>
                                                )}
                                            </td>

                                            {/* Notifications */}
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {['15', '7', '1'].map(day => {
                                                        const isEnabled = event.notificationPreferences?.[day] !== false; // Default true
                                                        return (
                                                            <button
                                                                key={day}
                                                                onClick={() => toggleNotification(event.id, day, event.notificationPreferences?.[day])}
                                                                title={`Toggle ${day} Day Notification`}
                                                                className={`
                                                                    w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold border transition-all
                                                                    ${isEnabled
                                                                        ? 'bg-blue-500 text-white border-blue-500'
                                                                        : 'bg-transparent text-white/20 border-white/10 hover:border-white/30'
                                                                    }
                                                                `}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={async () => {
                                                            const newStatus = event.status === 'disabled' ? 'active' : 'disabled';
                                                            try {
                                                                await apiClient(`/api/system-events/${event.id}`, {
                                                                    method: 'PATCH',
                                                                    body: JSON.stringify({ status: newStatus })
                                                                });
                                                                setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: newStatus } : e));
                                                                toast.success(`Event ${newStatus === 'active' ? 'Enabled' : 'Disabled'}`);
                                                            } catch (e) { toast.error("Update failed"); }
                                                        }}
                                                        className={`p-1.5 rounded transition-colors ${event.status === 'disabled' ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-white/50 hover:text-yellow-400 hover:bg-yellow-500/10'}`}
                                                        title={event.status === 'disabled' ? "Enable Event" : "Disable Event"}
                                                    >
                                                        <Archive size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(event)}
                                                        className="p-1.5 text-white/50 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(event.id)}
                                                        className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}

                            {filteredEvents.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-white/30 italic">
                                        No events found for {selectedYear}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            <CreateEventModal
                isOpen={isCreateOpen}
                onClose={() => handleCreateClose()}
                initialDate={new Date()}
                forceSystemEvent={true} // New prop needed or just rely on Admin role logic in modal
            />

            {editingEvent && (
                <EventEditModal
                    event={editingEvent}
                    isOpen={!!editingEvent}
                    onClose={handleEditClose}
                />
            )}
        </div>
    );
}
