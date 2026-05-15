'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { canAccessFeature, UserRole } from '@/system/features/featureAccess';
import { FEATURE_REGISTRY, FeatureKey } from '@/system/features/featureRegistry';
import { supabase } from '@/lib/supabaseClient';

export interface Workspace {
    id: string | number;
    tenant_id: string;
    type: 'institution' | 'department';
    name: string;
    features?: Record<string, boolean>;
    tenantSettings?: Record<string, any>;
}

interface WorkspaceContextType {
    currentWorkspace: Workspace | null;
    currentWorkspaceId: string | number | null;
    availableWorkspaces: Workspace[];
    currentRole: 'admin' | 'manager' | 'member' | 'team';
    setWorkspace: (workspaceId: string) => void;
    loading: boolean;
    isSingleWorkspace: boolean;
    tenantSettings: Record<string, any>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const STORAGE_KEY = 'mediahive_workspace';

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const { user, authReady } = useAuth();
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantSettings, setTenantSettings] = useState<Record<string, any>>({});

    const currentWorkspaceId = currentWorkspace?.id || null;
    const isSingleWorkspace = !loading && availableWorkspaces.length <= 1 && user?.role !== 'admin';

    // Fetch available institutions for the user's tenant
    const fetchWorkspaces = useCallback(async (tenantId: string) => {
        try {
            console.log(`[Workspace] Fetching workspaces for tenant: ${tenantId}`);

            // 1. Fetch available entities in parallel
            const [instsRes, deptsRes, tenantRes] = await Promise.all([
                supabase.from('institutions').select('*').eq('tenant_id', tenantId),
                supabase.from('departments').select('*').eq('tenant_id', tenantId),
                supabase.from('tenants').select('settings').eq('id', tenantId).single()
            ]);

            if (instsRes.error) throw instsRes.error;
            if (deptsRes.error) throw deptsRes.error;
            
            const fetchedTenantSettings = tenantRes.data?.settings || {};
            setTenantSettings(fetchedTenantSettings);

            const allInstitutions = (instsRes.data as any[]) || [];
            const allDepartments = (deptsRes.data as any[]) || [];

            // 2. Role-based filtering
            let filteredInstitutions = allInstitutions;
            let filteredDepartments = allDepartments;

            if (user?.role !== 'admin') {
                // Source of truth: profile fields
                const allowedInstIds = user?.allowed_institutions || [];
                const primaryInstId = user?.institution_id;
                const primaryDeptId = user?.department_id;

                const allAllowedInsts = new Set([...allowedInstIds, primaryInstId].filter(Boolean));
                
                filteredInstitutions = allInstitutions.filter(inst => allAllowedInsts.has(inst.id));
                filteredDepartments = allDepartments.filter(dept => Number(dept.id) === Number(primaryDeptId));
            }

            // 3. Unify into Workspace models
            const workspaces: Workspace[] = [
                ...filteredDepartments.map((dept: any) => ({
                    id: dept.id,
                    tenant_id: dept.tenant_id,
                    type: 'department' as const,
                    name: dept.name,
                    features: dept.features || {},
                    tenantSettings: fetchedTenantSettings
                })),
                ...filteredInstitutions.map((inst: any) => ({
                    id: inst.id,
                    tenant_id: inst.tenant_id,
                    type: 'institution' as const,
                    name: inst.name,
                    features: inst.features || {},
                    tenantSettings: fetchedTenantSettings
                }))
            ];

            setAvailableWorkspaces(workspaces);
            return workspaces;
        } catch (error) {
            console.error('[Workspace] Failed to fetch workspaces:', error);
            return [];
        }
    }, [user?.uid, user?.role, user?.allowed_institutions, user?.institution_id, user?.department_id]);

    useEffect(() => {
        if (!authReady) return;

        const initWorkspace = async () => {
            if (!user?.tenant_id) {
                setLoading(false);
                return;
            }

            const workspaces = await fetchWorkspaces(String(user.tenant_id));

            // 1. Try localStorage
            const savedId = localStorage.getItem(STORAGE_KEY);
            let selected = workspaces.find(w => String(w.id) === savedId);

            // 2. Try User's primary department/institution
            if (!selected && user.department_id) {
                selected = workspaces.find(w => w.type === 'department' && Number(w.id) === Number(user.department_id));
            }
            if (!selected && user.institution_id) {
                selected = workspaces.find(w => w.type === 'institution' && String(w.id) === String(user.institution_id));
            }

            // 3. Fallback to first available
            if (!selected && workspaces.length > 0) {
                selected = workspaces[0];
            }

            if (selected) {
                if (String(currentWorkspace?.id) !== String(selected.id)) {
                    setCurrentWorkspace(selected);
                    localStorage.setItem(STORAGE_KEY, String(selected.id));
                }
            } else if (user.department_id || user.institution_id) {
                const fallbackId = String(user.department_id || user.institution_id);
                if (String(currentWorkspace?.id) !== fallbackId) {
                    const syntheticWorkspace: Workspace = {
                        id: fallbackId,
                        tenant_id: String(user.tenant_id || ''),
                        type: user.department_id ? 'department' : 'institution',
                        name: user.department_id ? "Default Department" : "Default Institution",
                        features: {},
                        tenantSettings: tenantSettings
                    };
                    setCurrentWorkspace(syntheticWorkspace);
                }
            } else if (savedId) {
                localStorage.removeItem(STORAGE_KEY);
            }

            setLoading(false);
        };

        initWorkspace();
    }, [user?.uid, user?.tenant_id, user?.institution_id, authReady, fetchWorkspaces, currentWorkspace?.id]);

    const setWorkspace = useCallback((workspaceId: string | number) => {
        const selected = availableWorkspaces.find(w => String(w.id) === String(workspaceId));
        if (selected) {
            setCurrentWorkspace(selected);
            localStorage.setItem(STORAGE_KEY, String(selected.id));
        }
    }, [availableWorkspaces]);

    // Developer Tool Utility
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).workspace = {
                get: () => ({
                    current: currentWorkspace,
                    id: currentWorkspaceId,
                    available: availableWorkspaces,
                    persistedId: localStorage.getItem(STORAGE_KEY)
                })
            };


            // Feature System Debug
            (window as any).features = {
                list: () => {
                    const results: any = {};
                    Object.keys(FEATURE_REGISTRY).forEach((key) => {
                        results[key] = canAccessFeature(
                            key as FeatureKey,
                            (user?.role as UserRole) || 'member',
                            currentWorkspace ? { id: String(currentWorkspace.id), features: currentWorkspace.features, tenantSettings } : undefined
                        );
                    });
                    return results;
                }
            };
        }
    }, [currentWorkspace, currentWorkspaceId, availableWorkspaces, user?.role]);

    const currentRole = useMemo(() => {
        if (!user) return 'member';

        // Global Admin always keeps their role
        if (user.role === 'admin') return 'admin';

        let role: string = 'member';
        
        // Check workspace-specific role (Institutions only usually, but generic support)
        const wsId = String(currentWorkspaceId);
        if (wsId && user.institutionRoles?.[wsId]) {
            role = user.institutionRoles[wsId];
        }
        // Fallback to global role if this workspace is their primary
        else if (String(user.institution_id) === wsId || String(user.department_id) === wsId) {
            role = user.role || 'member';
        }

        // Final normalization: 'guest' is legacy, now 'member'
        const normalized = role.toLowerCase();
        if (normalized === 'guest') return 'member';
        
        return normalized as any;
    }, [user, currentWorkspaceId, user?.role, user?.institution_id, user?.department_id]);

    return (
        <WorkspaceContext.Provider value={{
            currentWorkspace,
            currentWorkspaceId,
            availableWorkspaces,
            currentRole,
            setWorkspace,
            loading,
            isSingleWorkspace,
            tenantSettings
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}
