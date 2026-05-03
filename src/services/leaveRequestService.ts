// @ts-nocheck
import { LeaveRequest, LeaveType, ApproveLeaveData, RejectLeaveData } from '@/types/leave';
import { apiClient } from '@/lib/apiClient';

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
            } catch (error) {
                console.warn('Leave requests polling failed:', error);
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
        const auth = await { currentUser: { uid: "mock", getIdToken: async () => "mock", email: "mock" } };
        if (!{ uid: "mock" }.currentUser) throw new Error("Not authenticated");

        const response = await apiClient('/api/leave', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        return response.id;
    },

    /**
     * Cancel a pending request
     */
    cancelRequest: async (requestId: string): Promise<void> => {
        const auth = await { currentUser: { uid: "mock", getIdToken: async () => "mock", email: "mock" } };
        if (!{ uid: "mock" }.currentUser) throw new Error("Not authenticated");

        await apiClient('/api/leave/cancel', {
            method: 'POST',
            body: JSON.stringify({ requestId })
        });
    },

    /**
     * Approve a leave request (admin only)
     */
    approveRequest: async (data: ApproveLeaveData): Promise<void> => {
        const auth = await { currentUser: { uid: "mock", getIdToken: async () => "mock", email: "mock" } };
        if (!{ uid: "mock" }.currentUser) throw new Error("Not authenticated");

        await apiClient('/api/leave/approve', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Reject a leave request (admin only)
     */
    rejectRequest: async (data: RejectLeaveData): Promise<void> => {
        const auth = await { currentUser: { uid: "mock", getIdToken: async () => "mock", email: "mock" } };
        if (!{ uid: "mock" }.currentUser) throw new Error("Not authenticated");

        await apiClient('/api/leave/reject', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};
