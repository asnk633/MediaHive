import { FeatureKey, FEATURE_REGISTRY } from './featureRegistry';

const ROLE_RANK = {
    guest: 0,
    member: 1,
    team: 2,
    viewer: 2,
    standard: 3,
    manager: 4,
    admin: 5,
    owner: 6,
};

export type UserRole = 'guest' | 'member' | 'team' | 'viewer' | 'standard' | 'manager' | 'admin' | 'owner';

export interface WorkspaceContext {
    id: string;
    features?: Record<string, boolean>;
}

export function canAccessFeature(
    feature: FeatureKey,
    userRole: UserRole = 'guest',
    workspace?: WorkspaceContext
): boolean {
    const config = FEATURE_REGISTRY[feature];
    if (!config) return false;

    // 1. Role Check (Hard Gate)
    const userLevel = ROLE_RANK[userRole] ?? 0;
    const minLevel = ROLE_RANK[config.minRole ?? 'guest'];

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
