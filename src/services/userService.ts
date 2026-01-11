import { apiClient } from '@/lib/apiClient';
import { User } from '@/types/user';

export type { User };

// API helper function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `/api/users${endpoint}`;
    return apiClient(url, options);
};


const USERS_COLLECTION = 'users';

// Helper to check for network/auth errors to avoid console noise
const isNetworkError = (error: any) => {
    const msg = error?.message || '';
    const code = error?.code || '';
    return (
        code === 'auth/network-request-failed' ||
        msg.includes('offline') ||
        msg.includes('network') ||
        msg.includes('Connection failed')
    );
};

export const UserService = {
    getAllUsers: async (): Promise<User[]> => {
        try {
            const response = await apiRequest('', {
                method: 'GET'
            });
            return response.users || [];
        } catch (error: any) {
            // Mock data for Dev Mode 403/401 (Admin Check Failure)
            if (process.env.NODE_ENV === 'development' && (error?.status === 403 || error?.status === 401)) {
                console.warn("[UserService] Dev Mode: Returning Mock Users due to 403/401", error);
                return [
                    { uid: 'mock_1', name: 'Admin User', email: 'admin@thaiba.com', role: 'admin', institutionId: 'inst_1', createdAt: new Date().toISOString(), isActive: true },
                    { uid: 'mock_2', name: 'Team Lead', email: 'team@thaiba.com', role: 'team', departmentId: 'dept_1', createdAt: new Date().toISOString(), isActive: true },
                    { uid: 'mock_3', name: 'Guest User', email: 'guest@thaiba.com', role: 'guest', createdAt: new Date().toISOString(), isActive: true }
                ];
            }

            // Silently handle 403/404/Network errors to keep console clean
            if (isNetworkError(error) || error.message?.includes('Forbidden') || error.message?.includes('Not Found')) {
                console.warn(`[UserService] Failed to fetch users: ${error.message}`);
                return [];
            }
            console.error("Failed to fetch users:", error);
            return [];
        }
    },

    updateUser: async (uid: string, data: Partial<User>) => {
        try {
            console.log(`[UserService] Updating user ${uid} with:`, data);
            await apiRequest('', {
                method: 'PUT',
                body: JSON.stringify({ uid, ...data })
            });
            console.log(`[UserService] ✅ Successfully updated user ${uid} via API`);
        } catch (error) {
            if (!isNetworkError(error)) {
                console.error(`[UserService] ❌ Failed to update user ${uid}:`, error);
            }
            throw error;
        }
    },

    getTeamMembers: async (): Promise<{ uid: string; name: string; avatarUrl?: string; photoURL?: string }[]> => {
        try {
            // Using the existing API route /api/users/team
            const response = await apiRequest('/team', { method: 'GET' });
            return response.teamMembers || [];
        } catch (error) {
            console.error("Failed to fetch team members:", error);
            return [];
        }
    },

    getAdmins: async (): Promise<{ uid: string; name: string }[]> => {
        try {
            // Using the existing API route /api/users/admins
            const response = await apiRequest('/admins', { method: 'GET' });
            return response.admins || [];
        } catch (error) {
            console.error("Failed to fetch admins:", error);
            return [];
        }
    }
};