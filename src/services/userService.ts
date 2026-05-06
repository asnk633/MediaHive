import { supabase } from '@/lib/supabaseClient';
import { User } from '@/types/user';
import { UserSchema } from '@/domain/schemas/user';
import { tenantContext } from '@/lib/auth/tenantContext';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';
import { MonitoringService } from '@/services/monitoringService';

export type { User };

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
            const { tenantId } = await tenantContext();

            const { data, error } = await safeQuery(() => supabase
                .from(TABLES.USERS)
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })
            );

            if (error) throw error;
            
            // Map id to uid for standard identification
            const items = Array.isArray(data) ? data : (data ? [data] : []);
            const rawData = items.map((item: any) => ({
                ...item,
                uid: item.id,
                name: item.full_name || item.name
            }));
            
            // DTO Validation
            const validatedData = (rawData || []).map((item: any) => {
                const parsed = UserSchema.safeParse(item);
                if (!parsed.success) {
                    MonitoringService.error("[UserService] DTO validation failed for user record", parsed.error, { userId: item.id });
                    // Return raw if parse fails but log it - or we could filter it out
                    return item as unknown as User;
                }
                const mapped = parsed.data as User;
                const { DataClassificationService } = require('@/services/dataClassificationService');
                return DataClassificationService.maskEntity('user', mapped);
            });

            return validatedData;
        } catch (error: any) {
            // Mock data for Dev Mode 403/401 (Admin Check Failure)
            if (process.env.NODE_ENV === 'development' && (error?.status === 403 || error?.status === 401)) {
                MonitoringService.warn("[UserService] Dev Mode: Returning Mock Users due to 403/401", { error: error.message });
                return [
                    { uid: 'mock_1', id: 'mock_1', name: 'Admin User', email: 'admin@thaiba.com', role: 'admin', institution_id: 'inst_1', created_at: new Date().toISOString(), isActive: true },
                    { uid: 'mock_2', id: 'mock_2', name: 'Team Lead', email: 'team@thaiba.com', role: 'manager', department_id: 'dept_1', created_at: new Date().toISOString(), isActive: true },
                    { uid: 'mock_3', id: 'mock_3', name: 'Guest User', email: 'guest@thaiba.com', role: 'guest', created_at: new Date().toISOString(), isActive: true }
                ];
            }

            if (isNetworkError(error) || error.message?.includes('Forbidden') || error.message?.includes('Not Found')) {
                MonitoringService.warn(`[UserService] Failed to fetch users: ${error.message}`);
                return [];
            }
            MonitoringService.error("Failed to fetch users", error);
            return [];
        }
    },

    updateUser: async (uid: string, data: Partial<User>) => {
        try {
            const { tenantId } = await tenantContext();

            const { error } = await safeQuery(() => supabase
                .from(TABLES.USERS)
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', uid)
                .eq('tenant_id', tenantId)
            );

            if (error) throw error;
            console.log(`[UserService] ✅ Successfully updated user ${uid} via Supabase`);
        } catch (error) {
            if (!isNetworkError(error)) {
                MonitoringService.error(`[UserService] Failed to update user ${uid}`, error);
            }
            throw error;
        }
    },

    getTeamMembers: async (): Promise<{ uid: string; name: string; avatar_url?: string; photoURL?: string }[]> => {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await safeQuery(() => supabase
                .from(TABLES.USERS)
                .select('id, full_name, avatar_url, department_id, institution_id')
                .eq('tenant_id', tenantId)
            );

            if (error) throw error;

            const users = Array.isArray(data) ? data : (data ? [data] : []);
            return users.map((p: any) => {
                // Partial validation for subset of fields
                const parsed = UserSchema.partial().safeParse(p);
                if (!parsed.success) {
                    console.warn("[UserService] Partial DTO validation failed for team member:", parsed.error);
                }
                return {
                    uid: p.id,
                    name: p.full_name || 'Unknown User',
                    avatar_url: p.avatar_url,
                    photoURL: p.avatar_url,
                    department_id: p.department_id,
                    institution_id: p.institution_id
                };
            });
        } catch (error) {
            console.error("Failed to fetch team members:", JSON.stringify(error, null, 2));
            return [];
        }
    },

    getAdmins: async (): Promise<{ uid: string; name: string }[]> => {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await safeQuery(() => supabase
                .from(TABLES.USERS)
                .select('id, name')
                .eq('tenant_id', tenantId)
                .eq('role', 'admin')
            );

            if (error) throw error;

            const users = Array.isArray(data) ? data : (data ? [data] : []);
            return users.map((p: any) => {
                const parsed = UserSchema.partial().safeParse(p);
                if (!parsed.success) {
                    console.warn("[UserService] Partial DTO validation failed for admin:", parsed.error);
                }
                return {
                    uid: p.id,
                    name: p.name
                };
            });
        } catch (error) {
            console.error("Failed to fetch admins:", error);
            return [];
        }
    }
};
