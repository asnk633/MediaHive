import { LeaveBalance, LeaveType, DEFAULT_LEAVE_ALLOWANCES } from '@/types/leaveBalance';
import { supabase } from '@/lib/supabaseClient';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { MonitoringService } from '@/services/monitoringService';
import { tenantContext } from '@/lib/auth/tenantContext';
import { TABLES } from '@/lib/dbTables';

export const LeaveBalanceService = {
    /**
     * Get user's leave balance for a specific year
     */
    getUserBalance: async (uid: string, year?: number): Promise<LeaveBalance | null> => {
        const targetYear = year || new Date().getFullYear();
        try {
            const { data, error } = await supabase
                .from(TABLES.LEAVE_BALANCES)
                .select('*')
                .eq('user_id', uid)
                .eq('year', targetYear)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
                throw error;
            }

            if (data) return data;

            // Initialize default balance if not exists
            return LeaveBalanceService.initializeBalance(uid, targetYear);
        } catch (error) {
            MonitoringService.error('[LeaveBalanceService] Failed to fetch user balance', error, { uid, year: targetYear });
            return null;
        }
    },

    /**
     * Initialize default leave balance for a user/year
     */
    initializeBalance: async (uid: string, year: number): Promise<LeaveBalance> => {
        const { tenantId } = await tenantContext();
        const user = await supabase.auth.getUser();
        const institution_id = user.data.user?.user_metadata?.institution_id;

        const balanceData = {
            user_id: uid,
            tenant_id: tenantId,
            institution_id,
            year,
            balances: {
                casual: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.casual },
                sick: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.sick },
                planned: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.planned },
                emergency: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.emergency },
                other: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.other }
            },
            updated_at: new Date().toISOString()
        };

        try {
            await CanonicalDataService.createRecord(
                TABLES.LEAVE_BALANCES,
                balanceData,
                'INITIALIZE_LEAVE_BALANCE'
            );
            return balanceData as any as LeaveBalance;
        } catch (error) {
            MonitoringService.error('[LeaveBalanceService] Failed to initialize balance', error, { uid, year });
            return balanceData as any as LeaveBalance;
        }
    },

    /**
     * Deduct days from user's balance (on approval)
     */
    deductBalance: async (uid: string, type: LeaveType, days: number): Promise<void> => {
        const balance = await LeaveBalanceService.getUserBalance(uid);
        if (!balance) return;

        const newBalances = { ...balance.balances };
        newBalances[type] = {
            ...newBalances[type],
            taken: newBalances[type].taken + days
        };

        try {
            await CanonicalDataService.patchFields(
                TABLES.LEAVE_BALANCES,
                String(balance.id),
                { balances: newBalances, updated_at: new Date().toISOString() },
                'UPDATE_LEAVE_BALANCE'
            );
        } catch (error) {
            MonitoringService.error('[LeaveBalanceService] Failed to deduct balance', error, { uid, type, days });
        }
    },

    /**
     * Restore days to user's balance
     */
    restoreBalance: async (uid: string, type: LeaveType, days: number): Promise<void> => {
        const balance = await LeaveBalanceService.getUserBalance(uid);
        if (!balance) return;

        const newBalances = { ...balance.balances };
        newBalances[type] = {
            ...newBalances[type],
            taken: Math.max(0, newBalances[type].taken - days)
        };

        try {
            await CanonicalDataService.patchFields(
                TABLES.LEAVE_BALANCES,
                String(balance.id),
                { balances: newBalances, updated_at: new Date().toISOString() },
                'UPDATE_LEAVE_BALANCE'
            );
        } catch (error) {
            MonitoringService.error('[LeaveBalanceService] Failed to restore balance', error, { uid, type, days });
        }
    },

    /**
     * Check if user has sufficient balance for a leave request
     */
    checkAvailability: async (uid: string, type: LeaveType, days: number): Promise<boolean> => {
        const balance = await LeaveBalanceService.getUserBalance(uid);
        if (!balance) return false;
        const available = balance.balances[type].total - balance.balances[type].taken;
        return available >= days;
    },

    /**
     * Get remaining balance for a specific leave type
     */
    getRemainingBalance: async (uid: string, type: LeaveType): Promise<number> => {
        const balance = await LeaveBalanceService.getUserBalance(uid);
        if (!balance) return 0;
        return balance.balances[type].total - balance.balances[type].taken;
    }
};
