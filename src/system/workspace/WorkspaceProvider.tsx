'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { canAccessFeature, UserRole } from '@/system/features/featureAccess';
import { FEATURE_REGISTRY, FeatureKey } from '@/system/features/featureRegistry';
import { supabase } from '@/lib/supabaseClient';

export interface Workspace {
    tenant_id: string;
    institution_id: string;
    name: string;
    features?: Record<string, boolean>;
}

interface WorkspaceContextType {
    currentWorkspace: Workspace | null;
    currentWorkspaceId: string | null;
    availableWorkspaces: Workspace[];
    currentRole: 'admin' | 'manager' | 'member' | 'guest';
    setWorkspace: (workspaceId: string) => void;
    loading: boolean;
    isSingleWorkspace: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const STORAGE_KEY = 'mediahive_workspace';

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const { user, authReady } = useAuth();
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);

    const currentWorkspaceId = currentWorkspace?.institution_id || null;
    const isSingleWorkspace = !loading && availableWorkspaces.length <= 1 && user?.role !== 'admin';

    // Fetch available institutions for the user's tenant
    const fetchWorkspaces = useCallback(async (tenantId: string) => {
        try {
            console.log(`[Workspace] Fetching institutions for tenant: ${tenantId}`);

            // 1. Fetch assigned workspace IDs from user_institutions table
            const { data: userInsts, error: uiError } = await supabase
                .from('user_institutions')
                .select('institution_id')
                .eq('user_id', user?.uid);

            if (uiError) throw uiError;
            const assignedIds = ((userInsts as any[]) || []).map((ui: any) => ui.institution_id) || [];

            // 2. Fetch institution details
            let query = supabase
                .from('institutions')
                .select('*')
                .eq('tenant_id', tenantId);

            // Role-based filtering: Team/Guest/Manager can only see assigned institutions
            // Global Admin can see all in the tenant
            if (user?.role !== 'admin') {
                if (assignedIds.length === 0) return [];
                query = query.in('id', assignedIds);
            }

            const { data: insts, error } = await query;

            if (error) throw error;

            const workspaces: Workspace[] = ((insts as any[]) || [])
                .map((inst: any) => ({
                    tenant_id: inst.tenant_id,
                    institution_id: inst.id,
                    name: inst.name,
                    features: inst.features || {}
                }));

            setAvailableWorkspaces(workspaces);
            return workspaces;
        } catch (error) {
            console.error('[Workspace] Failed to fetch institutions:', error);
            return [];
        }
    }, [user?.uid, user?.role]);

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
            let selected = workspaces.find(w => w.institution_id === savedId);

            // 2. Try User's profile institution_id (primary)
            if (!selected && user.institution_id) {
                selected = workspaces.find(w => w.institution_id === user.institution_id);
            }

            // 3. Fallback to first available from the allowed list
            if (!selected && workspaces.length > 0) {
                selected = workspaces[0];
            }

            if (selected) {
                setCurrentWorkspace(selected);
                localStorage.setItem(STORAGE_KEY, selected.institution_id);
            } else if (user.institution_id) {
                // UI-P14: Critical Fallback for production sync
                // If the user has a primary institution_id but it's not in the available list (e.g. sync lag),
                // we synthesize a workspace to prevent empty pages if RLS permits.
                const syntheticWorkspace: Workspace = {
                    tenant_id: String(user.tenant_id),
                    institution_id: user.institution_id,
                    name: "Default Institution",
                    features: {}
                };
                setCurrentWorkspace(syntheticWorkspace);
                console.log(`[Workspace] Applied synthetic fallback for primary institution: ${user.institution_id}`);
            } else if (savedId) {
                // If we have a saved ID but it's not in our allowed list, clear it
                localStorage.removeItem(STORAGE_KEY);
            }

            setLoading(false);
        };

        initWorkspace();
    }, [user?.uid, user?.tenant_id, user?.institution_id, authReady, fetchWorkspaces]);

    const setWorkspace = useCallback((workspaceId: string) => {
        const selected = availableWorkspaces.find(w => w.institution_id === workspaceId);
        if (selected) {
            setCurrentWorkspace(selected);
            localStorage.setItem(STORAGE_KEY, selected.institution_id);
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
                            (user?.role as UserRole) || 'guest',
                            currentWorkspace ? { id: currentWorkspace.institution_id, features: currentWorkspace.features } : undefined
                        );
                    });
                    return results;
                }
            };
        }
    }, [currentWorkspace, currentWorkspaceId, availableWorkspaces, user?.role]);

    const currentRole = useMemo(() => {
        if (!user) return 'guest';
        // Global admin has admin rights everywhere
        if (user.role === 'admin') return 'admin';
        
        // Check workspace-specific role
        if (currentWorkspaceId && user.institutionRoles?.[currentWorkspaceId]) {
            return user.institutionRoles[currentWorkspaceId] as any;
        }
        
        // Fallback to global role if this workspace is their primary
        if (user.institution_id === currentWorkspaceId) {
            return user.role as any;
        }
        
        return 'guest';
    }, [user, currentWorkspaceId]);

    return (
        <WorkspaceContext.Provider value={{
            currentWorkspace,
            currentWorkspaceId,
            availableWorkspaces,
            currentRole,
            setWorkspace,
            loading,
            isSingleWorkspace
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
