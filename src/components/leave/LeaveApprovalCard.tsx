"use client";

import React from 'react';
import { LeaveRequest, LEAVE_TYPE_LABELS } from '@/types/leave';
import { format } from 'date-fns';
import { Calendar, User, MessageSquare, Check, X, AlertTriangle, Briefcase } from 'lucide-react';
import { SafeAvatar } from '@/components/ui/SafeAvatar';
import { useState, useEffect } from 'react';
import { ConflictDetectionService } from '@/services/conflictDetectionService';

interface LeaveApprovalCardProps {
    request: LeaveRequest;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    hasOverlap?: boolean;
}

export const LeaveApprovalCard: React.FC<LeaveApprovalCardProps> = ({
    request,
    onApprove,
    onReject,
    hasOverlap = false
}) => {
    const [taskConflicts, setTaskConflicts] = useState<number>(0);
    const [showConflictDetails, setShowConflictDetails] = useState(false);

    const getSafeDate = (ts: any) => {
        if (!ts) return new Date();
        if (ts.toDate) return ts.toDate();
        if (typeof ts === 'object' && 'seconds' in ts) return new Date(ts.seconds * 1000);
        return new Date(ts);
    };

    // Check for task conflicts when component mounts
    useEffect(() => {
        const checkConflicts = async () => {
            const result = await ConflictDetectionService.checkLeaveApprovalConflicts(
                request.requestedBy.uid,
                getSafeDate(request.startDate),
                getSafeDate(request.endDate)
            );
            setTaskConflicts(result.conflicts.length);
        };

        checkConflicts();
    }, [request]);

    return (
        <div className="bg-white/5 border border-[#ffffff1a] rounded-2xl p-6 hover:bg-white/[0.07] transition-all">
            {/* User Info */}
            <div className="flex items-start gap-4 mb-4">
                <SafeAvatar
                    src={request.requestedBy.photoURL}
                    alt={request.requestedBy.name}
                    size={48}
                    className="flex-shrink-0"
                />
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-0.5">
                        {request.requestedBy.name}
                    </h3>
                    <p className="text-sm text-white/50">
                        {request.requestedBy.department}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-white/40 mb-1">Requested</div>
                    <div className="text-sm text-white/60 font-medium">
                        {format(getSafeDate(request.requestedAt), 'MMM dd, yyyy')}
                    </div>
                </div>
            </div>

            {/* Leave Details */}
            <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-bold rounded-lg">
                        {LEAVE_TYPE_LABELS[request.type]}
                    </span>
                    {hasOverlap && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold rounded-lg">
                            <AlertTriangle size={12} />
                            Overlap
                        </span>
                    )}
                    {taskConflicts > 0 && (
                        <span
                            onClick={() => setShowConflictDetails(!showConflictDetails)}
                            className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold rounded-lg cursor-pointer hover:bg-orange-500/20 transition-colors"
                        >
                            <Briefcase size={12} />
                            {taskConflicts} Pending Task{taskConflicts > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-white/70">
                    <Calendar size={16} className="text-blue-400" />
                    <span className="text-sm">
                        {format(getSafeDate(request.startDate), 'MMM dd, yyyy')} - {format(getSafeDate(request.endDate), 'MMM dd, yyyy')}
                    </span>
                    <span className="text-white/50">•</span>
                    <span className="text-sm font-medium text-white/80">
                        {request.totalDays} day{request.totalDays > 1 ? 's' : ''}
                    </span>
                </div>

                <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                    <MessageSquare size={14} className="text-white/40 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white/70 italic">"{request.reason}"</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                    onClick={() => onApprove(request.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all active:scale-95"
                >
                    <Check size={16} />
                    Approve
                </button>
                <button
                    onClick={() => onReject(request.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all active:scale-95"
                >
                    <X size={16} />
                    Reject
                </button>
            </div>
        </div>
    );
};
