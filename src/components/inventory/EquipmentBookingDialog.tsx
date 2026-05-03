"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EquipmentItem, AvailabilityInfo } from "@/services/inventory/inventoryContract";
import { inventoryService } from '@/services/inventory/inventoryService';
import { TaskService as taskService } from '@/features/tasks/services/taskService';
import { eventService } from '@/services/events/eventService';
import { useAuth } from "@/contexts/AuthContextProvider";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EquipmentBookingDialogProps {
    item: EquipmentItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EquipmentBookingDialog({ item, open, onOpenChange, onSuccess }: EquipmentBookingDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    
    // Form State
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 1));
    const [units, setUnits] = useState(1);
    const [taskId, setTaskId] = useState<string>("none");
    const [eventId, setEventId] = useState<string>("none");
    
    // Data for pickers
    const [tasks, setTasks] = useState<{id: string, title: string}[]>([]);
    const [events, setEvents] = useState<{id: string, title: string}[]>([]);
    
    // Availability State
    const [availability, setAvailability] = useState<AvailabilityInfo | null>(null);

    // Fetch tasks and events for linking
    useEffect(() => {
        if (open && user) {
            const loadLinks = async () => {
                const [t, e] = await Promise.all([
                    taskService.getTasks({ status: 'todo' }), // Only show active tasks?
                    eventService.getAll()
                ]);
                setTasks(t.map(x => ({ id: String(x.id), title: x.title })));
                setEvents(e.map(x => ({ id: String(x.id), title: x.title })));
            };
            loadLinks();
        }
    }, [open, user]);

    // Check availability whenever dates or units change
    useEffect(() => {
        if (item && open) {
            const verify = async () => {
                setChecking(true);
                try {
                    const info = await inventoryService.checkAvailability(
                        String(item.id), 
                        startDate.toISOString(), 
                        endDate.toISOString()
                    );
                    setAvailability(info);
                } catch (err) {
                    console.error(err);
                } finally {
                    setChecking(false);
                }
            };
            verify();
        }
    }, [item, open, startDate, endDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item || !user) return;

        if (availability && units > availability.available) {
            toast.error(`Only ${availability.available} units available for these dates.`);
            return;
        }

        try {
            setLoading(true);
            await inventoryService.createBooking({
                equipmentId: String(item.id),
                bookedBy: user.uid,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                unitsRequested: units,
                taskId: taskId !== "none" ? taskId : undefined,
                // eventId is not in schema but could be added later or linked via task
            });
            
            toast.success("Booking confirmed");
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create booking");
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    const isAvailable = availability ? availability.available >= units : true;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-[#ffffff1a] text-slate-200 sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        Reserve {item.name}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Date Selection Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400">Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-slate-950/50 border-white/10 hover:bg-white/5",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(val) => val && setStartDate(val)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400">End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-slate-950/50 border-white/10 hover:bg-white/5",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={(val) => val && setEndDate(val)}
                                        initialFocus
                                        disabled={(date) => isBefore(date, startDate)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Quantity & Rental Info */}
                    <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-2">
                            <Label className="text-slate-400">Units</Label>
                            <Input
                                type="number"
                                min={1}
                                max={item.quantity}
                                value={units}
                                onChange={e => setUnits(parseInt(e.target.value) || 1)}
                                className="bg-slate-950/50 border-white/10"
                            />
                        </div>
                        {item.isRentable && (
                             <div className="flex-1 p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                                <div className="opacity-70 mb-0.5">Estimated Rental Cost</div>
                                <div className="font-bold text-sm text-white">
                                    ₹{(item.rentalRatePerDay || 0) * units} / day
                                </div>
                             </div>
                        )}
                    </div>

                    {/* Availability Status */}
                    <div className={cn(
                        "p-3 rounded-lg border flex items-center gap-3 transition-colors",
                        checking ? "bg-slate-800/10 border-white/5 opacity-50" :
                        isAvailable ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : 
                        "bg-red-500/10 border-red-500/20 text-red-400"
                    )}>
                        {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                         isAvailable ? <CheckCircle2 className="w-4 h-4" /> : 
                         <AlertTriangle className="w-4 h-4" />}
                        <div className="text-sm">
                            {checking ? "Verifying schedule..." : 
                             isAvailable ? `Available: ${availability?.available} of ${item.quantity} units` : 
                             `Conflict detected: Only ${availability?.available} left for these dates.`}
                        </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-4 pt-2 border-t border-white/5">
                        <div className="space-y-2">
                            <Label className="text-slate-400">Link to Task (Optional)</Label>
                            <Select value={taskId} onValueChange={setTaskId}>
                                <SelectTrigger className="bg-slate-950/50 border-white/10">
                                    <SelectValue placeholder="Select a task" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-slate-300">
                                    <SelectItem value="none">No association</SelectItem>
                                    {tasks.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading || checking || !isAvailable}
                            className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Booking"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
