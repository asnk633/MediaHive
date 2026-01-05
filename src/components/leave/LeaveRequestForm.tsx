"use client";

import React, { useState } from 'react';
import { Calendar, Clock, AlignLeft, Loader2 } from 'lucide-react';
import { LeaveType, LEAVE_TYPE_LABELS, MINIMUM_NOTICE } from '@/types/leave';
import { LeaveRequestService } from '@/services/leaveRequestService';
import { LeaveBalanceDisplay } from '@/components/leave/LeaveBalanceDisplay';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';

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
    const [overlap, setOverlap] = useState<any[]>([]);

    // Calculate total days
    const totalDays = startDate && endDate
        ? LeaveRequestService.calculateTotalDays(new Date(startDate), new Date(endDate))
        : 0;

    // Check for overlaps when dates change
    const checkOverlap = async () => {
        if (!startDate || !endDate) return;

        try {
            const overlapping = await LeaveRequestService.checkOverlap(
                '', // Will be filled by service with current user
                new Date(startDate),
                new Date(endDate)
            );
            setOverlap(overlapping);
        } catch (error) {
            console.error('Error checking overlap:', error);
        }
    };

    React.useEffect(() => {
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

        // Check minimum notice
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

    const inputClasses = `
        w-full 
        bg-[#0a0c10] 
        text-white 
        placeholder:text-white/30
        border border-white/10 
        rounded-2xl 
        py-4 px-4 
        outline-none 
        transition-all duration-200
        focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10
        hover:border-white/20
    `;

    const labelClasses = "block text-xs font-bold text-white/50 uppercase tracking-wider mb-2 ml-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Balance Display */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <LeaveBalanceDisplay compact />
            </div>

            {/* Leave Type Selection */}
            <div>
                <label className={labelClasses}>Leave Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((type) => (
                        <label
                            key={type}
                            className={`
                                relative flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-all duration-200
                                ${leaveType === type
                                    ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                }
                            `}
                        >
                            <input
                                type="radio"
                                name="leaveType"
                                value={type}
                                checked={leaveType === type}
                                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                                className="sr-only"
                            />
                            <span className={`text-sm font-semibold ${leaveType === type ? 'text-blue-200' : 'text-white/70'}`}>
                                {LEAVE_TYPE_LABELS[type]}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Start Date *</label>
                    <div className="relative group">
                        <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            className={`${inputClasses} pl-12 [color-scheme:dark]`}
                        />
                    </div>
                </div>
                <div>
                    <label className={labelClasses}>End Date *</label>
                    <div className="relative group">
                        <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="date"
                            required
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || format(new Date(), 'yyyy-MM-dd')}
                            className={`${inputClasses} pl-12 [color-scheme:dark]`}
                        />
                    </div>
                </div>
            </div>

            {/* Total Days Display */}
            {totalDays > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <Clock size={16} className="text-blue-400" />
                    <span className="text-sm font-medium text-blue-200">
                        Total: {totalDays} day{totalDays > 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Overlap Warning */}
            {overlap.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">⚠️ Overlapping Request</p>
                    <p className="text-sm text-amber-200">
                        You have {overlap.length} existing request(s) during this period
                    </p>
                </div>
            )}

            {/* Reason */}
            <div>
                <label className={labelClasses}>Reason *</label>
                <div className="relative group">
                    <AlignLeft size={20} className="absolute left-4 top-6 text-white/40 group-focus-within:text-blue-400 transition-colors" />
                    <textarea
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        placeholder="Please provide a reason for your leave request (min 10 characters)..."
                        className={`${inputClasses} pl-12 resize-none`}
                    />
                </div>
                <p className="text-xs text-white/30 mt-1 ml-1">
                    {reason.length}/10 characters minimum
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3.5 text-sm font-bold text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        'Submit Request'
                    )}
                </button>
            </div>
        </form>
    );
};
