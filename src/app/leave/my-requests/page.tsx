"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LeaveRequest, LeaveStatus } from '@/types/leave';
import { LeaveRequestService } from '@/services/leaveRequestService';
import { LeaveRequestCard } from '@/components/leave/LeaveRequestCard';
import { ChevronLeft, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function MyRequestsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | LeaveStatus>('all');

    useEffect(() => {
        if (!user) return;

        const unsubscribe = LeaveRequestService.subscribeToMyRequests(user.uid, (data) => {
            setRequests(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCancel = async (id: string) => {
        if (!window.confirm('Are you sure you want to cancel this request?')) return;

        try {
            await LeaveRequestService.cancelRequest(id);
            toast.success('Request cancelled successfully');
        } catch (error: any) {
            console.error('Error cancelling request:', error);
            toast.error(error.message || 'Failed to cancel request');
        }
    };

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(r => r.status === filter);

    const tabs: { label: string; value: 'all' | LeaveStatus; count?: number }[] = [
        { label: 'All', value: 'all', count: requests.length },
        { label: 'Pending', value: 'pending', count: requests.filter(r => r.status === 'pending').length },
        { label: 'Approved', value: 'approved', count: requests.filter(r => r.status === 'approved').length },
        { label: 'Rejected', value: 'rejected', count: requests.filter(r => r.status === 'rejected').length }
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                                My Leave Requests
                            </h1>
                            <p className="text-[var(--color-text-secondary)]">
                                View and manage your leave requests
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/leave/request')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        <Plus size={16} />
                        New Request
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setFilter(tab.value)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                                ${filter === tab.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }
                            `}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${filter === tab.value ? 'bg-white/20' : 'bg-white/10'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 shadow-2xl min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 size={32} className="animate-spin text-blue-400" />
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="text-6xl mb-4">📅</div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                {filter === 'all' ? 'No Leave Requests' : `No ${filter} Requests`}
                            </h3>
                            <p className="text-white/50 mb-6">
                                {filter === 'all'
                                    ? "You haven't submitted any leave requests yet"
                                    : `You don't have any ${filter} leave requests`
                                }
                            </p>
                            {filter === 'all' && (
                                <button
                                    onClick={() => router.push('/leave/request')}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                                >
                                    Submit Your First Request
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRequests.map(request => (
                                <LeaveRequestCard
                                    key={request.id}
                                    request={request}
                                    onCancel={handleCancel}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
