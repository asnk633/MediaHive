
import { getFirebaseAuth } from '@/firebase/client';
import { apiClient } from '@/lib/apiClient';
import { DeviceRequest, DeviceLog } from '@/types/deviceRequest';
import { InventoryItem, InventoryCondition } from '@/types/inventory';
import { AuthUser } from '@/contexts/AuthContext';

const REQUESTS_COLLECTION = 'device_requests';
const LOGS_COLLECTION = 'device_logs';
const INVENTORY_COLLECTION = 'inventory';

export const deviceRequestService = {

    // --- READ ---

    // Get requests for a specific user
    getUserRequests: async (uid: string): Promise<DeviceRequest[]> => {
        const response = await apiClient(`/api/device-requests?userId=${uid}`, {
            method: 'GET'
        });
        
        return response.requests || [];
    },

    // Get all requests (Admin only - handled by rules, but service allows query)
    getAllRequests: async (): Promise<DeviceRequest[]> => {
        const response = await apiClient('/api/device-requests', {
            method: 'GET'
        });
        
        return response.requests || [];
    },

    getById: async (id: string): Promise<DeviceRequest | null> => {
        const response = await apiClient(`/api/device-requests/${id}`, {
            method: 'GET'
        });
        
        return response.request || null;
    },

    // --- WRITE ---

    createRequest: async (data: Omit<DeviceRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const response = await apiClient('/api/device-requests', {
            method: 'POST',
            body: JSON.stringify({
                ...data,
                status: 'pending'
            })
        });
        
        return response.id;
    },

    updateRequest: async (id: string, data: Partial<DeviceRequest>): Promise<void> => {
        await apiClient(`/api/device-requests/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // --- TRANSACTIONAL ACTIONS (Admin Only) ---

    // 1. Issue Item
    issueItem: async (requestId: string, itemId: string, adminUid: string, condition: InventoryCondition) => {
        await apiClient('/api/device-requests/issue', {
            method: 'POST',
            body: JSON.stringify({
                requestId,
                itemId,
                adminUid,
                condition
            })
        });
    },

    // 2. Return Item
    returnItem: async (requestId: string, adminUid: string, condition: InventoryCondition, notes?: string) => {
        await apiClient('/api/device-requests/return', {
            method: 'POST',
            body: JSON.stringify({
                requestId,
                adminUid,
                condition,
                notes
            })
        });
    },

    // Helper to find log ID (internal use for return flow UI)
    getActiveLogId: async (requestId: string): Promise<string | null> => {
        const response = await apiClient(`/api/device-logs/active?requestId=${requestId}`, {
            method: 'GET'
        });
        
        return response.logId || null;
    },

    // 2. Return Item (Revised with logId passed in)
    returnItemWithLogId: async (requestId: string, logId: string, adminUid: string, condition: InventoryCondition, notes?: string) => {
        await apiClient('/api/device-requests/return-with-log', {
            method: 'POST',
            body: JSON.stringify({
                requestId,
                logId,
                adminUid,
                condition,
                notes
            })
        });
    }
};
