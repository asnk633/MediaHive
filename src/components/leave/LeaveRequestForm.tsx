"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlignLeft, Loader2, Umbrella, AlertCircle, CheckCircle2, Stethoscope, Plane, Siren, HelpCircle } from 'lucide-react';
import { DateSelector } from '@/components/ui/selectors/DateSelector';
import { LeaveType, LEAVE_TYPE_LABELS, MINIMUM_NOTICE } from '@/types/leave';
import { LeaveRequestService } from '@/services/leaveRequestService';
import { LeaveBalanceDisplay } from '@/components/leave/LeaveBalanceDisplay';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const LEAVE_ICONS: Record<LeaveType, React.ElementType> = {
    casual: Umbrella,
    sick: Stethoscope,
    planned: Plane,
    unpaid: Clock,
    emergency: Siren,
    other: HelpCircle,
};


interface LeaveRequestFormProps {
    onSuccess: () => void;
    onCancel?: () => void;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [leaveType, setLeaveType] = useState<LeaveType>('casual');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [overlap, setOverlap] = useState<boolean>(false);

    const totalDays = startDate && endDate
        ? LeaveRequestService.calculateTotalDays(new Date(startDate), new Date(endDate))
        : 0;

    const checkOverlap = async () => {
        if (!startDate || !endDate) return;
        try {
            const overlapping = await LeaveRequestService.checkOverlap(
                '', 
                new Date(startDate),
                new Date(endDate)
            );
            setOverlap(overlapping);
        } catch (error) {
            console.error('Error checking overlap:', error);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            checkOverlap();
        }
    }, [startDate, endDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!startDate || !endDate || !reason) {
            toast.error('Please fill all required fields');
            return;
        }

        if (reason.length < 10) {
            toast.error('Reason must be at least 10 characters');
            return;
        }

        const minNotice = MINIMUM_NOTICE[leaveType];
        const start = new Date(startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilStart < minNotice) {
            toast.error(`${LEAVE_TYPE_LABELS[leaveType]} requires at least ${minNotice} day(s) notice`);
            return;
        }

        setLoading(true);
        try {
            await LeaveRequestService.submitRequest({
                type: leaveType,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason
            });

            toast.success('Leave request submitted successfully');
            onSuccess();
        } catch (error: any) {
            console.error('Error submitting request:', error);
            toast.error(error.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    const labelClasses = "text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em] mb-3 block ml-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-10">
            {/* Balance Overview */}
            <div className="space-y-4">
                <label className={labelClasses}>Current Allocation Status</label>
                <div className="bg-foreground/[0.03] border border-foreground/5 rounded-3xl p-6 backdrop-blur-sm">
                    <LeaveBalanceDisplay compact />
                </div>
            </div>

            {/* Leave Type Grid */}
            <div className="space-y-4">
                <label className={labelClasses}>Select Leave Category *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((type) => {
                        const isSelected = leaveType === type;
                        const Icon = LEAVE_ICONS[type] || Umbrella;
                        return (
                            <motion.button
                                key={type}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setLeaveType(type)}
                                className={cn(
                                    "relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 gap-3 group",
                                    isSelected
                                        ? "bg-blue-500/10 border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.1)]"
                                        : "bg-foreground/5 border-foreground/5 hover:bg-foreground/10 hover:border-foreground/20"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                    isSelected ? "bg-blue-500 text-foreground" : "bg-foreground/5 text-foreground/80 group-hover:text-foreground/80"
                                )}>
                                    <Icon size={20} />
                                </div>
                                <span className={cn(
                                    "text-sm font-bold tracking-tight transition-colors",
                                    isSelected ? "text-foreground" : "text-foreground/70 group-hover:text-foreground/80"
                                )}>
                                    {LEAVE_TYPE_LABELS[type]}
                                </span>
                                {isSelected && (
                                    <motion.div 
                                        layoutId="selected-indicator"
                                        className="absolute top-2 right-2"
                                    >
                                        <CheckCircle2 size={16} className="text-blue-400" />
                                    </motion.div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-4">
                <label className={labelClasses}>Duration & Schedule *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-foreground/[0.02] border border-foreground/5 p-6 rounded-3xl">
                    <div className="space-y-2">
                        <DateSelector 
                            label="Start Date"
                            date={startDate ? new Date(startDate) : undefined}
                            onChange={(date) => {
                                if (!date) return;
                                setStartDate(date.toISOString().split('T')[0]);
                            }}
                            disabledBefore={new Date()}
                        />
                    </div>
                    <div className="space-y-2">
                        <DateSelector 
                            label="End Date"
                            date={endDate ? new Date(endDate) : undefined}
                            onChange={(date) => {
                                if (!date) return;
                                setEndDate(date.toISOString().split('T')[0]);
                            }}
                            disabledBefore={startDate ? new Date(startDate) : new Date()}
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {totalDays > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl"
                        >
                            <Clock size={18} className="text-indigo-400" />
                            <p className="text-sm font-bold text-indigo-100">
                                Requested duration: <span className="text-foreground text-base ml-1">{totalDays} working days</span>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {overlap && (
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                        <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Overlap Detected</p>
                            <p className="text-sm text-amber-100/70">
                                You already have a request during this period. Submitting might result in a rejection.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Justification Textarea */}
            <div className="space-y-4">
                <label className={labelClasses}>Business Justification / Reason *</label>
                <div className="relative group">
                    <AlignLeft size={20} className="absolute left-5 top-5 text-foreground/80 group-focus-within:text-blue-400 transition-colors" />
                    <textarea
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={5}
                        placeholder="Please provide context for your leave request..."
                        className="w-full bg-foreground/[0.02] text-foreground placeholder:text-foreground/80 border border-foreground/5 rounded-[28px] py-5 pl-14 pr-6 outline-none transition-all duration-300 focus:border-blue-500/40 focus:ring-8 focus:ring-blue-500/5 hover:border-foreground/10 resize-none text-sm leading-relaxed"
                    />
                </div>
                <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">
                        {reason.length < 10 ? `${10 - reason.length} more characters required` : 'Requirement met'}
                    </p>
                    <p className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">
                        {reason.length} / 500
                    </p>
                </div>
            </div>

            {/* Submission Controls */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 text-sm font-black text-foreground/80 hover:text-foreground hover:bg-foreground/5 rounded-2xl transition-all uppercase tracking-widest active:scale-95 border border-transparent hover:border-foreground/5"
                    >
                        Dismiss
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading || reason.length < 10 || !startDate || !endDate}
                    className={cn(
                        "flex-[2] py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98] relative overflow-hidden",
                        "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] hover:bg-right shadow-2xl shadow-blue-500/25",
                        "disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed disabled:hover:bg-left"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Processing Submission...
                        </>
                    ) : (
                        <>
                            Submit Request
                            <motion.div
                                animate={{ x: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                <Calendar size={18} />
                            </motion.div>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
