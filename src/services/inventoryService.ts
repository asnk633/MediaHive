
import { InventoryItem } from '@/types/inventory';
import { AuthUser } from '@/contexts/AuthContext';
import { apiClient, apiPost } from '@/lib/apiClient';

// Inventory API Service
// Phase 1 Consumables Implementation
// Legacy Asset operations are currently piped through here although API validation might prevent Asset creation.
export const inventoryService = {
    // READ: Get all items (Team & Admin)
    getAll: async (): Promise<InventoryItem[]> => {
        try {
            const data = await apiClient('/api/inventory');
            return data.items || [];
        } catch (error) {
            console.error('Error fetching inventory:', error);
            return [];
        }
    },

    // READ: Get items currently out for use
    getOutForUseItems: async (): Promise<InventoryItem[]> => {
        try {
            const allItems = await inventoryService.getAll();
            return allItems.filter(item => item.status === 'in_use');
        } catch (error) {
            console.error('Error fetching out-for-use items:', error);
            return [];
        }
    },

    // READ: Get single item by ID
    getById: async (id: string): Promise<InventoryItem | null> => {
        try {
            return await apiClient(`/api/inventory/${id}`);
        } catch (error) {
            console.error(`Error fetching item ${id}:`, error);
            return null;
        }
    },

    // CREATE: (Admin only)
    create: async (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, user: AuthUser): Promise<string> => {
        const newItem = await apiPost('/api/inventory', data);
        return newItem.id;
    },

    // UPDATE: (Admin only)
    update: async (id: string, data: Partial<InventoryItem>, user: AuthUser): Promise<void> => {
        await apiClient(`/api/inventory/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    // DELETE: (Admin only)
    delete: async (id: string, user: AuthUser): Promise<void> => {
        await apiClient(`/api/inventory/${id}`, {
            method: 'DELETE'
        });
    },

    // Request Item (Guest/Team)
    createRequest: async (data: any): Promise<void> => {
        await apiClient('/api/device-requests', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // ADMIN: Sync Status
    syncStatus: async (): Promise<{ count: number }> => {
        return await apiPost('/api/admin/inventory/sync', {});
    }
};
