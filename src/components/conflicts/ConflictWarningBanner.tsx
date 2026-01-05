"use client";

import React from 'react';
import { AlertTriangle, Calendar, Briefcase, X } from 'lucide-react';
import { Conflict } from '@/types/conflict';
import { format } from 'date-fns';

interface ConflictWarningBannerProps {
    conflicts: Conflict[];
    onDismiss?: () => void;
    showOverride?: boolean;
    onOverride?: () => void;
}

export const ConflictWarningBanner: React.FC<ConflictWarningBannerProps> = ({
    conflicts,
    onDismiss,
    showOverride = false,
    onOverride
}) => {
    if (conflicts.length === 0) return null;

    const getIcon = (type: Conflict['type']) => {
        switch (type) {
            case 'user_on_leave':
                return <Calendar size={20} className="text-amber-400" />;
            case 'media_off_day':
                return <Calendar size={20} className="text-blue-400" />;
            case 'pending_tasks':
                return <Briefcase size={20} className="text-orange-400" />;
            default:
                return <AlertTriangle size={20} className="text-amber-400" />;
        }
    };

    return (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-l-4 border-amber-500 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <AlertTriangle size={24} className="text-amber-400" />
                </div>

                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                            ⚠️ Scheduling Conflict{conflicts.length > 1 ? 's' : ''} Detected
                        </h4>
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="text-white/40 hover:text-white/60 transition-colors"
                                aria-label="Dismiss"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {conflicts.map((conflict, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getIcon(conflict.type)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-white font-medium">
                                        {conflict.message}
                                    </p>

                                    {/* Conflict Details */}
                                    {conflict.type === 'user_on_leave' && conflict.details.leaveRequest && (
                                        <p className="text-xs text-white/60 mt-1">
                                            Leave period: {format(conflict.details.leaveRequest.startDate, 'MMM d')} - {format(conflict.details.leaveRequest.endDate, 'MMM d, yyyy')}
                                        </p>
                                    )}

                                    {conflict.type === 'pending_tasks' && conflict.details.tasks && (
                                        <div className="mt-1 space-y-1">
                                            {conflict.details.tasks.map((task, taskIndex) => (
                                                <p key={taskIndex} className="text-xs text-white/60">
                                                    • "{task.title}" - Due {format(task.dueDate, 'MMM d, yyyy')}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {showOverride && onOverride && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end gap-2">
                            <button
                                onClick={onOverride}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors text-sm"
                            >
                                Proceed Anyway
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
