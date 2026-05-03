// @ts-nocheck
import { LeaveRequest, LeaveType, ApproveLeaveData, RejectLeaveData } from '@/types/leave';
import { apiClient } from '@/lib/apiClient';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { MonitoringService } from '@/services/monitoringService';
import { getCurrentUser } from '@/lib/auth/verifyUser';

const COLLECTION = 'leave_requests';

export const LeaveRequestService = {
    /**
     * Subscribe to user's leave requests
     */
    subscribeToMyRequests: (uid: string, callback: (requests: LeaveRequest[]) => void) => {
        let pollInterval: NodeJS.Timeout | null = null;
        let isCancelled = false;

        const pollRequests = async () => {
            if (isCancelled) return;

            try {
                const data = await apiClient('/api/leave', {
                    method: 'GET'
                });

                callback(data.requests || []);
            } catch (error: any) {
                MonitoringService.warn('Leave requests polling failed', { error: error.message });
                callback([]);
            }

            if (!isCancelled) {
                pollInterval = setTimeout(pollRequests, 30000); // Poll every 30 seconds
            }
        };

        pollRequests();

        return () => {
            isCancelled = true;
            if (pollInterval) clearTimeout(pollInterval);
        };
    },

    /**
     * Subscribe to all pending requests (admin only)
     */
    subscribeToPendingRequests: (callback: (requests: LeaveRequest[]) => void) => {
        let pollInterval: NodeJS.Timeout | null = null;
        let isCancelled = false;

        const pollPendingRequests = async () => {
            if (isCancelled) return;

            try {
                const data = await apiClient('/api/leave?status=pending', {
                    method: 'GET'
                });

                callback(data.requests || []);
            } catch (error) {
                console.warn('Pending requests polling failed:', error);
                callback([]);
            }

            if (!isCancelled) {
                pollInterval = setTimeout(pollPendingRequests, 30000); // Poll every 30 seconds
            }
        };

        pollPendingRequests();

        return () => {
            isCancelled = true;
            if (pollInterval) clearTimeout(pollInterval);
        };
    },

    /**
     * Calculate total days between two dates (inclusive)
     */
    calculateTotalDays: (startDate: Date, endDate: Date): number => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Reset time to start of day for accurate calculation
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays + 1; // +1 to include both start and end dates
    },

    /**
     * Check for overlapping leave requests
     */
    checkOverlap: async (uid: string, startDate: Date, endDate: Date): Promise<LeaveRequest[]> => {
        try {
            const data = await apiClient(`/api/leave/check-overlap?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
                method: 'GET'
            });

            return data.overlappingRequests || [];
        } catch (error) {
            console.error('Check overlap failed:', error);
            return [];
        }
    },

    /**
     * Submit a new leave request (client-side, routes through API)
     */
    submitRequest: async (data: {
        type: LeaveType;
        startDate: Date;
        endDate: Date;
        reason: string;
    }): Promise<string> => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Not authenticated");

        const { data: result, error } = await CanonicalDataService.createRecord(
            'leave_requests',
            {
                ...data,
                user_id: user.id,
                status: 'pending'
            },
            'leave_request'
        );

        if (error) throw error;
        return result.id;
    },

    /**
     * Cancel a pending request
     */
    cancelRequest: async (requestId: string): Promise<void> => {
        const success = await CanonicalDataService.patchFields(
            'leave_requests',
            requestId,
            { status: 'cancelled' },
            'leave_request'
        );
        if (!success) throw new Error("Failed to cancel request");
    },

    /**
     * Approve a leave request (admin only)
     */
    approveRequest: async (data: ApproveLeaveData): Promise<void> => {
        const success = await CanonicalDataService.patchFields(
            'leave_requests',
            data.requestId,
            { 
                status: 'approved',
                approved_by: data.adminId,
                admin_notes: data.notes
            },
            'leave_request'
        );
        if (!success) throw new Error("Failed to approve request");
    },

    /**
     * Reject a leave request (admin only)
     */
    rejectRequest: async (data: RejectLeaveData): Promise<void> => {
        const success = await CanonicalDataService.patchFields(
            'leave_requests',
            data.requestId,
            { 
                status: 'rejected',
                rejected_by: data.adminId,
                admin_notes: data.notes
            },
            'leave_request'
        );
        if (!success) throw new Error("Failed to reject request");
    }
};
