"use client";

import React, { useState, useEffect } from 'react';
import { EquipmentBooking } from '@/services/inventory/inventoryContract';
import { inventoryService } from '@/services/inventory/inventoryService';
import { Card } from '@/components/ui/card';
import { format, addDays, startOfDay, isWithinInterval, isSameDay } from 'date-fns';
import { Calendar, Package, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function EquipmentScheduleWidget() {
    const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<Date>(new Date());

    const next7Days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            try {
                const data = await inventoryService.getUpcomingBookings(14); // Fetch 2 weeks for safety
                setBookings(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const getBookingsForDay = (date: Date) => {
        return bookings.filter(b => {
            if (!b.startTime || !b.endTime) return false;
            const start = startOfDay(new Date(b.startTime));
            const end = startOfDay(new Date(b.endTime));
            const target = startOfDay(date);
            return isWithinInterval(target, { start, end });
        });
    };

    const activeBookings = getBookingsForDay(selectedDay);

    return (
        <Card className="bg-glass border-soft overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-foreground/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Equipment Schedule</h3>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Next 7 Days</div>
            </div>

            <div className="p-4 space-y-6">
                {/* Horizontal Date Bar */}
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 scrollbar-hide">
                    {next7Days.map((date, idx) => {
                        const dayBookings = getBookingsForDay(date);
                        const isSelected = isSameDay(date, selectedDay);
                        const isToday = isSameDay(date, new Date());

                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDay(date)}
                                className={cn(
                                    "flex-1 min-w-[50px] flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all relative group",
                                    isSelected ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30" : "hover:bg-foreground/5 text-slate-500"
                                )}
                            >
                                <span className="text-[10px] uppercase font-bold tracking-tighter opacity-60">
                                    {format(date, 'EEE')}
                                </span>
                                <span className={cn(
                                    "text-sm font-bold",
                                    isSelected ? "text-foreground" : "group-hover:text-slate-200"
                                )}>
                                    {format(date, 'd')}
                                </span>
                                {dayBookings.length > 0 && (
                                    <div className="flex gap-0.5">
                                        {dayBookings.slice(0, 3).map((_, i) => (
                                            <div key={i} className="w-1 h-1 rounded-full bg-blue-500/60" />
                                        ))}
                                    </div>
                                )}
                                {isToday && !isSelected && (
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Day Details */}
                <div className="min-h-[120px]">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="space-y-3"
                            >
                                <Skeleton className="h-12 w-full bg-foreground/5 rounded-lg" />
                                <Skeleton className="h-12 w-full bg-foreground/5 rounded-lg" />
                            </motion.div>
                        ) : activeBookings.length > 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 5 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -5 }}
                                className="space-y-2"
                            >
                                {activeBookings.map((b, idx) => (
                                    <div 
                                        key={idx} 
                                        className="group flex items-center justify-between p-3 rounded-lg bg-surface/40 border border-foreground/5 hover:border-foreground/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                                                <Package size={14} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-200">
                                                    {(b as any).inventory?.name || `Item #${b.equipmentId}`}
                                                </div>
                                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                                                    <span>{b.unitsRequested} units</span>
                                                    <span>•</span>
                                                    <span>{b.bookedBy}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-8 text-center"
                            >
                                <div className="p-3 rounded-full bg-foreground/5 mb-3">
                                    <Info size={20} className="text-slate-600" />
                                </div>
                                <div className="text-sm font-medium text-slate-400">No bookings for this day</div>
                                <div className="text-[11px] text-slate-500">Everything is available for use</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </Card>
    );
}
