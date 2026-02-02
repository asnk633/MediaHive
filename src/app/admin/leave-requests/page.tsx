'use client';



import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextProvider';
import { nativeNavigate } from '@/lib/utils';
import { LeaveRequest } from '@/types/leave';
import { LeaveRequestService } from '@/services/leaveRequestService';
import { LeaveApprovalCard } from '@/components/leave/LeaveApprovalCard';
import { LeaveRejectionModal } from '@/components/leave/LeaveRejectionModal';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLeaveRequestsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null);

    // Check admin access
    useEffect(() => {
        if (user && user.role !== 'admin') {
            nativeNavigate('/home', router, 'AdminLeaveRequests (Guard)');
        }
    }, [user, router]);

    // Subscribe to pending requests
    useEffect(() => {
        const unsubscribe = LeaveRequestService.subscribeToPendingRequests((data) => {
            setRequests(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (requestId: string) => {
        if (!user) return;

        try {
            await LeaveRequestService.approveRequest({
                requestId,
                adminUid: user.uid,
                adminName: user.officialName || user.name || 'Admin'
            });
            toast.success('Leave request approved');
        } catch (error: any) {
            console.error('Error approving request:', error);
            toast.error(error.message || 'Failed to approve request');
        }
    };

    const handleReject = (request: LeaveRequest) => {
        setRejectingRequest(request);
    };

    const confirmReject = async (reason: string) => {
        if (!user || !rejectingRequest) return;

        try {
            await LeaveRequestService.rejectRequest({
                requestId: rejectingRequest.id,
                adminUid: user.uid,
                adminName: user.officialName || user.name || 'Admin',
                reason
            });
            toast.success('Leave request rejected');
        } catch (error: any) {
            console.error('Error rejecting request:', error);
            toast.error(error.message || 'Failed to reject request');
        }
    };

    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                            Leave Requests Management
                        </h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Review and approve team leave requests
                        </p>
                    </div>
                </div>

                {/* Pending Count Badge */}
                {requests.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl w-fit">
                        <span className="text-sm font-bold text-amber-300">
                            {requests.length} Pending Request{requests.length > 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 shadow-2xl min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 size={32} className="animate-spin text-blue-400" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                All Caught Up!
                            </h3>
                            <p className="text-white/50">
                                No pending leave requests to review
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map(request => (
                                <LeaveApprovalCard
                                    key={request.id}
                                    request={request}
                                    onApprove={handleApprove}
                                    onReject={() => handleReject(request)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            <LeaveRejectionModal
                isOpen={!!rejectingRequest}
                onClose={() => setRejectingRequest(null)}
                onConfirm={confirmReject}
                requesterName={rejectingRequest?.requestedBy.name || ''}
            />
        </div>
    );
}
