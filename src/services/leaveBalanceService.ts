import { LeaveBalance, LeaveType, DEFAULT_LEAVE_ALLOWANCES } from '@/types/leaveBalance';
import { apiClient } from '@/lib/apiClient';

const COLLECTION = 'user_leave_balances';

export const LeaveBalanceService = {
    /**
     * Get user's leave balance for a specific year
     */
    getUserBalance: async (uid: string, year?: number): Promise<LeaveBalance> => {
        const targetYear = year || new Date().getFullYear();
        
        const data = await apiClient(`/api/leave-balances/${uid}/${targetYear}`, {
            method: 'GET'
        });
        
        if (data) {
            return data;
        }
        
        // Initialize default balance if not exists
        return LeaveBalanceService.initializeBalance(uid, targetYear);
    },

    /**
     * Initialize default leave balance for a user/year
     */
    initializeBalance: async (uid: string, year: number): Promise<LeaveBalance> => {
        const balance: LeaveBalance = {
            uid,
            year,
            balances: {
                casual: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.casual },
                sick: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.sick },
                planned: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.planned },
                emergency: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.emergency },
                other: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.other }
            },
            updatedAt: new Date().toISOString() // Send as ISO string
        };
        
        await apiClient('/api/leave-balances', {
            method: 'POST',
            body: JSON.stringify(balance)
        });
        
        return balance;
    },

    /**
     * Deduct days from user's balance (on approval)
     */
    deductBalance: async (uid: string, type: LeaveType, days: number): Promise<void> => {
        const year = new Date().getFullYear();
        
        await apiClient(`/api/leave-balances/${uid}/${year}/deduct`, {
            method: 'PATCH',
            body: JSON.stringify({
                type,
                days,
                updatedAt: new Date().toISOString() // Send as ISO string
            })
        });
    },

    /**
     * Restore days to user's balance (on cancellation of approved leave)
     */
    restoreBalance: async (uid: string, type: LeaveType, days: number): Promise<void> => {
        const year = new Date().getFullYear();
        
        await apiClient(`/api/leave-balances/${uid}/${year}/restore`, {
            method: 'PATCH',
            body: JSON.stringify({
                type,
                days,
                updatedAt: new Date().toISOString() // Send as ISO string
            })
        });
    },

    /**
     * Check if user has sufficient balance for a leave request
     */
    checkAvailability: async (uid: string, type: LeaveType, days: number): Promise<boolean> => {
        const balance = await LeaveBalanceService.getUserBalance(uid);
        const available = balance.balances[type].total - balance.balances[type].taken;
        return available >= days;
    },

    /**
     * Get remaining balance for a specific leave type
     */
    getRemainingBalance: async (uid: string, type: LeaveType): Promise<number> => {
        const balance = await LeaveBalanceService.getUserBalance(uid);
        return balance.balances[type].total - balance.balances[type].taken;
    }
};
