import { apiClient } from '@/lib/apiClient';
import { SystemActivity } from '@/types/activity';

export const ActivityService = {
    /**
     * Log a new system activity (Fire & Forget)
     * We don't await this in critical paths to avoid blocking UI
     */
    logActivity: async (action: Omit<SystemActivity, 'id' | 'timestamp' | 'performed_by' | 'performedByRole'>) => {
        try {
            await apiClient('/api/activities', {
                method: 'POST',
                body: JSON.stringify(action)
            });
        } catch (error) {
            // fail silently for logs to not break app flow
            console.error('[ActivityService] Failed to log activity:', error);
        }
    },

    /**
     * Get recent system activities
     */
    getRecentActivity: async (limit: number = 50): Promise<SystemActivity[]> => {
        try {
            const response = await apiClient<{ activities: SystemActivity[] }>(`/api/activities?limit=${limit}`);
            return response.activities || [];
        } catch (error) {
            console.error('[ActivityService] Failed to fetch activities:', error);
            return [];
        }
    }
};
