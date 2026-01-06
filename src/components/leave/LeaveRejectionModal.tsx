"use client";

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface LeaveRejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    requesterName: string;
}

export const LeaveRejectionModal: React.FC<LeaveRejectionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    requesterName
}) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (reason.length < 10) {
            return;
        }

        setLoading(true);
        try {
            await onConfirm(reason);
            setReason('');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-gradient-to-br from-[#1a2639] to-[#0f172a] rounded-3xl shadow-2xl border border-[#ffffff1a] p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-xl">
                            <AlertCircle size={20} className="text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Reject Leave Request</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-white/60">
                        You are rejecting <span className="font-semibold text-white">{requesterName}'s</span> leave request.
                        Please provide a clear reason for the rejection.
                    </p>

                    <div>
                        <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                            Rejection Reason *
                        </label>
                        <textarea
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            placeholder="e.g., Insufficient notice, overlapping with critical project deadline..."
                            className="w-full bg-[#0a0c10] text-white placeholder:text-white/30 border border-[#ffffff1a] rounded-xl py-3 px-4 outline-none transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 resize-none"
                        />
                        <p className="text-xs text-white/30 mt-1">
                            {reason.length}/10 characters minimum
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-sm font-bold text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || reason.length < 10}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
