"use client";

import React from 'react';
import { LeaveRequest, LEAVE_STATUS_CONFIG, LEAVE_TYPE_LABELS } from '@/types/leave';
import { format } from 'date-fns';
import { Calendar, User, MessageSquare, Trash2 } from 'lucide-react';

interface LeaveRequestCardProps {
    request: LeaveRequest;
    onCancel?: (id: string) => void;
    showActions?: boolean;
}

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({
    request,
    onCancel,
    showActions = true
}) => {
    const statusConfig = LEAVE_STATUS_CONFIG[request.status];
    const canCancel = request.status === 'pending' && showActions && onCancel;

    const getSafeDate = (ts: any) => {
        if (!ts) return new Date();
        if (ts.toDate) return ts.toDate();
        if (typeof ts === 'object' && 'seconds' in ts) return new Date(ts.seconds * 1000);
        return new Date(ts);
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-white">
                            {LEAVE_TYPE_LABELS[request.type]}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusConfig.color}`}>
                            {statusConfig.icon} {statusConfig.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                        <Calendar size={14} />
                        <span>
                            {format(getSafeDate(request.startDate), 'MMM dd, yyyy')} - {format(getSafeDate(request.endDate), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-white/30">•</span>
                        <span className="font-medium text-white/60">{request.totalDays} day{request.totalDays > 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
                <div className="flex items-start gap-2 text-sm">
                    <MessageSquare size={14} className="text-white/40 mt-0.5 flex-shrink-0" />
                    <p className="text-white/70 italic">"{request.reason}"</p>
                </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-white/40 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>Requested {format(getSafeDate(request.requestedAt), 'MMM dd, yyyy')}</span>
                </div>

                {request.reviewedBy && (
                    <span>
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.reviewedBy.name}
                    </span>
                )}
            </div>

            {/* Rejection Reason */}
            {request.status === 'rejected' && request.rejectionReason && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-200">{request.rejectionReason}</p>
                </div>
            )}

            {/* Actions */}
            {canCancel && (
                <div className="mt-4 pt-3 border-t border-white/5">
                    <button
                        onClick={() => onCancel(request.id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                        Cancel Request
                    </button>
                </div>
            )}
        </div>
    );
};
