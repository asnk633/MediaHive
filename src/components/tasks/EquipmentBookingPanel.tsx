import { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Loader2, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { inventoryService } from '@/services/inventory/inventoryService';
import { EquipmentItem, EquipmentBooking } from '@/services/inventory/inventoryContract';
import { DateSelector } from '@/components/ui/selectors/DateSelector';
import { TimeSelector } from '@/components/ui/selectors/TimeSelector';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';

interface EquipmentBookingPanelProps {
    taskId?: string;
    onBookingsChange?: (bookings: EquipmentBooking[]) => void;
}

export function EquipmentBookingPanel({ taskId, onBookingsChange }: EquipmentBookingPanelProps) {
    const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
    const [selectedId, setSelectedId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [unitsRequested, setUnitsRequested] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [existingBookings, setExistingBookings] = useState<EquipmentBooking[]>([]);
    const [conflictInfo, setConflictInfo] = useState<{ message: string; available: number; total: number } | null>(null);
    const [checking, setChecking] = useState(false);
    const [availability, setAvailability] = useState<{ available: number; total: number } | null>(null);

    useEffect(() => {
        inventoryService.getEquipment({ limit: 200, category: 'Equipment' })
            .then(items => setEquipment(items))
            .catch(() => { });

        if (taskId) {
            inventoryService.getBookings({ taskId })
                .then(data => {
                    setExistingBookings(data);
                    onBookingsChange?.(data);
                })
                .catch(() => { });
        }
    }, [taskId]);

    // Check availability dynamically when equipment + time range are set
    const checkAvailability = useCallback(async () => {
        if (!selectedId || !startTime || !endTime) return;
        if (new Date(startTime) >= new Date(endTime)) return;

        setChecking(true);
        setConflictInfo(null);
        try {
            const availInfo = await inventoryService.checkAvailability(selectedId, startTime, endTime);
            setAvailability(availInfo);
            // Auto-clamp units requested to max available
            if (unitsRequested > availInfo.available) setUnitsRequested(Math.max(1, availInfo.available));
        } catch {
            // ignore
        } finally {
            setChecking(false);
        }
    }, [selectedId, startTime, endTime, equipment, unitsRequested]);

    useEffect(() => {
        checkAvailability();
    }, [selectedId, startTime, endTime]);

    const selectedItem = equipment.find(e => e.id === selectedId);

    const handleBook = async () => {
        if (!selectedId || !startTime || !endTime) {
            toast.error('Please select equipment and time range');
            return;
        }
        if (new Date(startTime) >= new Date(endTime)) {
            toast.error('End time must be after start time');
            return;
        }
        if (unitsRequested < 1) {
            toast.error('Units must be at least 1');
            return;
        }

        setSubmitting(true);
        setConflictInfo(null);
        try {
            const result = await inventoryService.createBooking({
                equipmentId: selectedId,
                taskId: taskId || 'pending',
                startTime: startTime,
                endTime: endTime,
                unitsRequested: unitsRequested,
            });

            if (result?.id) {
                const updated = [...existingBookings, result];
                setExistingBookings(updated);
                onBookingsChange?.(updated);
                setSelectedId('');
                setStartTime('');
                setEndTime('');
                setUnitsRequested(1);
                setAvailability(null);
                toast.success('Equipment booked successfully!');
            }
        } catch (err: any) {
            const data = err?.data || err;
            if (data?.available_units !== undefined) {
                setConflictInfo({
                    message: data.message || 'Not enough units available.',
                    available: data.available_units,
                    total: data.total_units,
                });
            } else {
                toast.error('Failed to book equipment');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const maxUnits = availability?.available ?? selectedItem?.quantity ?? 99;

    return (
        <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <CalendarCheck className="h-4 w-4 text-amber-400" />
                Equipment Reservation
            </div>

            {/* Equipment Selection + Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-0.5">
                    <DropdownSelector 
                        label="Equipment"
                        value={selectedId}
                        onChange={val => { setSelectedId(val); setAvailability(null); setConflictInfo(null); }}
                        placeholder="Select Equipment..."
                        options={equipment.map(item => ({
                            id: String(item.id),
                            label: `${item.name} ${item.quantity != null ? `(${item.quantity} units)` : ''}`,
                            icon: <Package size={14} />
                        }))}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-white/40 font-medium">
                        Units
                        {availability && (
                            <span className={`ml-2 font-semibold ${availability.available === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                ({availability.available}/{availability.total} available)
                            </span>
                        )}
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={maxUnits}
                        value={unitsRequested}
                        onChange={e => setUnitsRequested(Math.min(maxUnits, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500/50"
                    />
                </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <DateSelector 
                            label="Start Date"
                            date={startTime ? new Date(startTime) : undefined}
                            onChange={(date) => {
                                if (!date) return;
                                const newDate = new Date(date);
                                if (startTime) {
                                    const current = new Date(startTime);
                                    newDate.setHours(current.getHours());
                                    newDate.setMinutes(current.getMinutes());
                                }
                                setStartTime(newDate.toISOString());
                            }}
                        />
                        <TimeSelector 
                            label="Start Time"
                            value={startTime ? format(new Date(startTime), "HH:mm") : "09:00"}
                            onChange={(time) => {
                                const [h, m] = time.split(':').map(Number);
                                const newDate = startTime ? new Date(startTime) : new Date();
                                newDate.setHours(h);
                                newDate.setMinutes(m);
                                setStartTime(newDate.toISOString());
                            }}
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <DateSelector 
                            label="End Date"
                            date={endTime ? new Date(endTime) : undefined}
                            onChange={(date) => {
                                if (!date) return;
                                const newDate = new Date(date);
                                if (endTime) {
                                    const current = new Date(endTime);
                                    newDate.setHours(current.getHours());
                                    newDate.setMinutes(current.getMinutes());
                                }
                                setEndTime(newDate.toISOString());
                            }}
                        />
                        <TimeSelector 
                            label="End Time"
                            value={endTime ? format(new Date(endTime), "HH:mm") : "18:00"}
                            onChange={(time) => {
                                const [h, m] = time.split(':').map(Number);
                                const newDate = endTime ? new Date(endTime) : new Date();
                                newDate.setHours(h);
                                newDate.setMinutes(m);
                                setEndTime(newDate.toISOString());
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Availability status pill */}
            {checking && (
                <div className="flex items-center gap-2 text-xs text-white/40">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                </div>
            )}
            {!checking && availability && !conflictInfo && (
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${availability.available === 0
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : availability.available < availability.total
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                    <Package className="h-3.5 w-3.5" />
                    {availability.available === 0
                        ? 'Fully Booked — no units available for this time range'
                        : availability.available < availability.total
                            ? `Partially Booked — ${availability.available} of ${availability.total} units available`
                            : `Fully Available — all ${availability.total} units free`}
                </div>
            )}

            <button
                onClick={handleBook}
                disabled={submitting || !selectedId || !startTime || !endTime || (availability?.available ?? 1) < 1}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-all disabled:opacity-50"
            >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                Book {unitsRequested > 1 ? `${unitsRequested} Units` : 'Equipment'}
            </button>

            {/* Conflict Warning */}
            {conflictInfo && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                        <p>{conflictInfo.message}</p>
                        <p className="text-xs mt-1 text-red-300/70">
                            {conflictInfo.available} unit(s) available out of {conflictInfo.total} total.
                        </p>
                    </div>
                </div>
            )}

            {/* Existing Bookings */}
            {existingBookings.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-white/5">
                    <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Booked Equipment</p>
                    {existingBookings.map((b, i) => {
                        const item = equipment.find(e => e.id === b.equipmentId);
                        return (
                            <div key={b.id || i} className="flex items-center gap-2 text-sm text-white/70">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span className="font-medium text-white">{item?.name || 'Equipment'}</span>
                                <span className="text-xs bg-white/10 rounded px-1.5 py-0.5">{b.unitsRequested || 1}×</span>
                                {b.startTime && b.endTime && (
                                    <span className="text-white/40">
                                        {format(new Date(b.startTime), 'MMM d h:mm a')} → {format(new Date(b.endTime), 'h:mm a')}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
