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
                    { uid: 'mock_3', id: 'mock_3', name: 'Member User', email: 'member@thaiba.com', role: 'member', created_at: new Date().toISOString(), isActive: true }
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

    getTeamMembers: async (contextId?: string | number | null, requesterId?: string, options?: { forceMediaIT?: boolean, includeAll?: boolean }): Promise<{ uid: string; name: string; avatar_url?: string; photoURL?: string; department_id?: string | number; institution_id?: string | number; role: string }[]> => {
        try {
            const { tenantId, userId: contextUserId } = await tenantContext();
            const userId = requesterId || contextUserId;

            // UUID Validation Gate
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!tenantId || !uuidRegex.test(tenantId)) {
                console.warn("[UserService] ⚠️ Invalid tenantId for getTeamMembers:", tenantId);
                return [];
            }

            // 1. Fetch ALL data for the tenant to ensure no silent misses
            const [profilesRes, wsRes] = await Promise.all([
                supabase.from(TABLES.USERS).select('*').eq('tenant_id', tenantId),
                supabase.from('user_institutions').select('*').eq('tenant_id', tenantId)
            ]);

            if (profilesRes.error) {
                console.error("[UserService] Profiles fetch error:", profilesRes.error);
                throw profilesRes.error;
            }
            
            const profiles = profilesRes.data || [];
            const allWsAssignments = wsRes.data || [];
            
            // 2. Identify requester role for scoping
            const requesterProfile = profiles.find((p: any) => p.id === userId);
            const globalRole = requesterProfile?.role?.toLowerCase();
            const isRequesterGlobalAdmin = globalRole === 'admin' || globalRole === 'superadmin';

            // Check if requester has elevated role in ANY institution
            const requesterWsAssignments = allWsAssignments.filter((a: any) => a.user_id === userId);
            const hasElevatedWsRole = requesterWsAssignments.some((a: any) => 
                a.role?.toLowerCase() === 'admin' || a.role?.toLowerCase() === 'manager'
            );

            const isOmniscient = isRequesterGlobalAdmin || hasElevatedWsRole;

            // 3. Resolve target institution ID (handle unit_id alias)
            let targetInstitutionId = contextId;
            if (targetInstitutionId) {
                const { data: institutionMappings } = await supabase.from('institutions').select('id, unit_id');
                if (institutionMappings) {
                    const resolvedInst = institutionMappings.find((m: any) => m.unit_id === targetInstitutionId || m.id === targetInstitutionId);
                    if (resolvedInst) {
                        targetInstitutionId = resolvedInst.id;
                    }
                }
            }

            // Media & IT Department IDs (Hardened to include 103, 100, 4)
            const MEDIA_IT_DEPT_IDS = [103, 100, 4];

            // 4. Map profiles to team members with proper filtering
            return profiles.reduce((acc: any[], p: any) => {
                // Security boundary: same tenant only
                if (p.tenant_id !== requesterProfile?.tenant_id) return acc;

                // Visibility logic:
                // - forceMediaIT: only show Media & IT department members
                // - contextId provided: strictly filter by that institution
                // - No contextId: 
                //    - Admin/Manager: sees Media & IT + their own institution/department
                //    - Normal Member: sees their own institution/department
                
                const isMediaITUser = MEDIA_IT_DEPT_IDS.includes(Number(p.department_id));
                const wsAssignment = allWsAssignments.find((a: any) => a.user_id === p.id && a.institution_id === targetInstitutionId);
                const isGlobalUser = !p.institution_id;
                
                let matchesContext = false;

                if (options?.forceMediaIT) {
                    matchesContext = isMediaITUser;
                } else if (options?.includeAll && isOmniscient) {
                    matchesContext = true;
                } else if (targetInstitutionId) {
                    const isTargetMatch = wsAssignment || String(p.institution_id) === String(targetInstitutionId);
                    // Even in a specific context, Admins/Managers should see Media & IT (executors)
                    matchesContext = isTargetMatch || (isOmniscient && isMediaITUser);
                } else {
                    // Default behavior (No contextId)
                    const sameInstitution = p.institution_id && p.institution_id === requesterProfile?.institution_id;
                    const sameDepartment = p.department_id && p.department_id === requesterProfile?.department_id;
                    
                    if (isOmniscient) {
                        // Admins see Media & IT + their own context
                        matchesContext = isMediaITUser || sameInstitution || sameDepartment || isGlobalUser;
                    } else {
                        // Members see their own context + global users
                        matchesContext = sameInstitution || sameDepartment || isGlobalUser;
                    }
                }

                if (matchesContext) {
                    // Determine effective role
                    const wsRole = wsAssignment?.role || (String(p.institution_id) === String(targetInstitutionId) ? p.role : null);
                    const effectiveRole = wsRole || p.role || 'member';

                    // Filter out system users to keep list clean
                    const fullName = p.full_name || p.name || '';
                    const isSystemUser = fullName.toLowerCase().includes('admin user') || 
                                       fullName.toLowerCase().includes('super admin') ||
                                       fullName.toLowerCase().includes('generic admin');
                    
                    if (!isSystemUser) {
                        acc.push({
                            uid: p.id,
                            name: fullName || 'Unknown User',
                            avatar_url: p.avatar_url,
                            photoURL: p.avatar_url,
                            role: effectiveRole,
                            institution_id: p.institution_id,
                            department_id: p.department_id
                        });
                    }
                }
                return acc;
            }, []);
        } catch (error) {
            console.error("[UserService] getTeamMembers failed:", error);
            return [];
        }
    },

    getAdmins: async (): Promise<{ uid: string; name: string }[]> => {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await safeQuery(() => supabase
                .from(TABLES.USERS)
                .select('id, name, full_name')
                .eq('tenant_id', tenantId)
                .eq('role', 'admin')
            );

            if (error) throw error;

            const users = Array.isArray(data) ? data : (data ? [data] : []);
            return users.map((p: any) => ({
                uid: p.id,
                name: p.full_name || p.name || 'Admin User'
            }));
        } catch (error) {
            console.error("Failed to fetch admins:", error);
            return [];
        }
    },

    getManagers: async (): Promise<{ uid: string; name: string }[]> => {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await safeQuery(() => supabase
                .from(TABLES.USERS)
                .select('id, name, full_name')
                .eq('tenant_id', tenantId)
                .eq('role', 'manager')
            );

            if (error) throw error;

            const users = Array.isArray(data) ? data : (data ? [data] : []);
            return users.map((p: any) => ({
                uid: p.id,
                name: p.full_name || p.name || 'Manager User'
            }));
        } catch (error) {
            console.error("Failed to fetch managers:", error);
            return [];
        }
    }
};
