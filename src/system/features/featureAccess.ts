import { FeatureKey, FEATURE_REGISTRY } from './featureRegistry';

const ROLE_RANK = {
    guest: 0,
    viewer: 1,
    standard: 2,
    manager: 3,
    admin: 4,
    owner: 5,
};

export type UserRole = keyof typeof ROLE_RANK;

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
