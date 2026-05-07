import { FeatureKey, FEATURE_REGISTRY } from './featureRegistry';

const ROLE_RANK = {
    member: 0,
    team: 1,
    manager: 2,
    admin: 3,
};

export type UserRole = 'member' | 'team' | 'manager' | 'admin';

export interface WorkspaceContext {
    id: string;
    features?: Record<string, boolean>;
    tenantSettings?: Record<string, any>;
}

export function canAccessFeature(
    feature: FeatureKey,
    userRole: UserRole = 'member',
    workspace?: WorkspaceContext
): boolean {
    const config = FEATURE_REGISTRY[feature];
    if (!config) return false;

    // 1. Role Check (Hard Gate)
    const userLevel = ROLE_RANK[userRole] ?? 0;
    
    // Check if there is a tenant override for the minimum role
    const overrideRole = workspace?.tenantSettings?.featureOverrides?.[feature];
    const minRoleToUse = (overrideRole && ROLE_RANK[overrideRole as UserRole] !== undefined) 
        ? overrideRole 
        : (config.minRole ?? 'member');
        
    const minLevel = ROLE_RANK[minRoleToUse as UserRole];

    if (userLevel < minLevel) return false;

    // 2. Workspace Override (Takes precedence over global default)
    if (workspace?.features && typeof workspace.features[feature] === 'boolean') {
        return workspace.features[feature];
    }

    // 3. Global Default
    return config.enabled;
}

// Dev Utility
if (typeof window !== 'undefined') {
    (window as any).features = {
        list: (userRole: UserRole = 'admin', workspace?: WorkspaceContext) => {
            const results: Record<string, boolean> = {};
            Object.keys(FEATURE_REGISTRY).forEach((key) => {
                results[key] = canAccessFeature(key as FeatureKey, userRole, workspace);
            });
            return results;
        }
    };
}
