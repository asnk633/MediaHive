import { LeaveRequest, ApproveLeaveData, RejectLeaveData } from '@/types/leave';
import { supabase } from '@/lib/supabaseClient';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { MonitoringService } from '@/services/monitoringService';
import { tenantContext } from '@/lib/auth/tenantContext';
import { TABLES } from '@/lib/dbTables';

const COLLECTION = TABLES.LEAVE_REQUESTS;

export const LeaveRequestService = {
    /**
     * Subscribe to user's leave requests
     */
    subscribeToMyRequests: (uid: string, callback: (requests: LeaveRequest[]) => void) => {
        const subscription = supabase
            .channel('my_leaves')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: TABLES.LEAVE_REQUESTS,
                filter: `requested_by_id=eq.${uid}`
            }, async () => {
                const requests = await LeaveRequestService.getMyRequests(uid);
                callback(requests);
            })
            .subscribe();

        // Initial fetch
        LeaveRequestService.getMyRequests(uid).then(callback);

        return () => {
            subscription.unsubscribe();
        };
    },

    /**
     * Fetch user's leave requests
     */
    getMyRequests: async (uid: string): Promise<LeaveRequest[]> => {
        try {
            const { data, error } = await supabase
                .from(TABLES.LEAVE_REQUESTS)
                .select('*')
                .eq('requested_by_id', uid)
                .order('requested_at', { ascending: false });

            if (error) throw error;
            return (data as any[]) || [];
        } catch (error) {
            MonitoringService.error('[LeaveRequestService] Failed to fetch my requests', error, { uid });
            return [];
        }
    },

    /**
     * Subscribe to all pending requests (Admin view)
     */
    subscribeToPendingRequests: (callback: (requests: LeaveRequest[]) => void) => {
        const subscription = supabase
            .channel('pending_leaves')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: TABLES.LEAVE_REQUESTS,
                filter: `status=eq.pending`
            }, async () => {
                const requests = await LeaveRequestService.getPendingRequests();
                callback(requests);
            })
            .subscribe();

        // Initial fetch
        LeaveRequestService.getPendingRequests().then(callback);

        return () => {
            subscription.unsubscribe();
        };
    },

    /**
     * Fetch pending requests
     */
    getPendingRequests: async (): Promise<LeaveRequest[]> => {
        try {
            const { tenantId } = await tenantContext();
            const { data, error } = await supabase
                .from(TABLES.LEAVE_REQUESTS)
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('status', 'pending')
                .order('requested_at', { ascending: true });

            if (error) throw error;
            return (data as any[]) || [];
        } catch (error) {
            MonitoringService.error('[LeaveRequestService] Failed to fetch pending requests', error);
            return [];
        }
    },

    /**
     * Submit a new leave request
     */
    submitRequest: async (request: any): Promise<boolean> => {
        try {
            const { tenantId } = await tenantContext();
            const success = await CanonicalDataService.createRecord(
                TABLES.LEAVE_REQUESTS,
                {
                    ...request,
                    tenant_id: tenantId,
                    status: 'pending',
                    requested_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                'CREATE_LEAVE_REQUEST'
            );
            return !success.error;
        } catch (error) {
            MonitoringService.error('[LeaveRequestService] Failed to submit request', error, { request });
            return false;
        }
    },

    /**
     * Approve a leave request
     */
    approveRequest: async (data: ApproveLeaveData): Promise<boolean> => {
        try {
            const success = await CanonicalDataService.patchFields(
                TABLES.LEAVE_REQUESTS,
                data.requestId,
                {
                    status: 'approved',
                    reviewed_by_id: data.adminUid,
                    reviewed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                'UPDATE_LEAVE_REQUEST'
            );
            return success;
        } catch (error) {
            MonitoringService.error('[LeaveRequestService] Failed to approve request', error, { data });
            return false;
        }
    },

    /**
     * Reject a leave request
     */
    rejectRequest: async (data: RejectLeaveData): Promise<boolean> => {
        try {
            const success = await CanonicalDataService.patchFields(
                TABLES.LEAVE_REQUESTS,
                data.requestId,
                {
                    status: 'rejected',
                    reviewed_by_id: data.adminUid,
                    reviewed_at: new Date().toISOString(),
                    rejection_reason: data.reason,
                    updated_at: new Date().toISOString()
                },
                'UPDATE_LEAVE_REQUEST'
            );
            return success;
        } catch (error) {
            MonitoringService.error('[LeaveRequestService] Failed to reject request', error, { data });
            return false;
        }
    },

    /**
     * Cancel a leave request (by user)
     */
    cancelRequest: async (requestId: string): Promise<boolean> => {
        try {
            const success = await CanonicalDataService.patchFields(
                TABLES.LEAVE_REQUESTS,
                requestId,
                {
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                },
                'UPDATE_LEAVE_REQUEST'
            );
            return success;
        } catch (error) {
            MonitoringService.error('[LeaveRequestService] Failed to cancel request', error, { requestId });
            return false;
        }
    },

    /**
     * Calculate total days between two dates
     */
    calculateTotalDays: (start: Date, end: Date): number => {
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    },

    /**
     * Check for overlapping requests
     */
    checkOverlap: async (uid: string, start: Date, end: Date): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from(TABLES.LEAVE_REQUESTS)
                .select('id')
                .eq('requested_by_id', uid)
                .in('status', ['pending', 'approved'])
                .or(`start_date.lte.${end.toISOString()},end_date.gte.${start.toISOString()}`);

            if (error) throw error;
            return (data?.length || 0) > 0;
        } catch (error) {
            MonitoringService.error('[LeaveRequestService] Overlap check failed', error, { uid, start, end });
            return false;
        }
    }
};
