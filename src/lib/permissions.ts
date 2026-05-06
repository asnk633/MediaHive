export type Role = 'admin' | 'manager' | 'member' | 'guest' | 'team'; // Maintain 'team' for compat

export type Permission =
    | 'read:tasks'
    | 'create:tasks'
    | 'edit:tasks'
    | 'delete:tasks'
    | 'edit:task_status'
    | 'edit:task_priority'
    | 'assign:tasks'
    | 'read:events'
    | 'create:events'
    | 'edit:events'
    | 'delete:events'
    | 'read:users'
    | 'manage:users'
    | 'read:reports'
    | 'write:intervention'
    | 'read:audit_log'
    | 'upload:files';

export const ROLES: Record<string, Permission[]> = {
    admin: [
        'read:tasks', 'create:tasks', 'edit:tasks', 'delete:tasks',
        'edit:task_status', 'edit:task_priority', 'assign:tasks',
        'read:events', 'create:events', 'edit:events', 'delete:events',
        'read:users', 'manage:users', 'read:reports',
        'write:intervention', 'read:audit_log', 'upload:files'
    ],
    manager: [
        'read:tasks', 'create:tasks', 'edit:tasks', 'edit:task_status', 'edit:task_priority', 'assign:tasks',
        'read:events', 'create:events', 'edit:events',
        'read:users', 'upload:files', 'read:reports'
    ],
    member: [
        'read:tasks', 'create:tasks', 'edit:task_status',
        'read:events', 'create:events',
        'upload:files'
    ],
    team: [ // Legacy map to member/manager mix
        'read:tasks', 'create:tasks', 'edit:task_status', 'edit:task_priority',
        'read:events', 'create:events', 'edit:events',
        'read:users', 'upload:files', 'read:reports'
    ],
    guest: [
        'read:tasks', 'create:tasks',
        'read:events'
    ]
};

// --- Granular Permissions Logic ---

// Helper to reliably extract ID from user object or string or number
function getUserId(user: any): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    if (typeof user === 'number') return String(user);
    if (user.uid) return String(user.uid);
    if (user.id) return String(user.id);
    return '';
}

export function canEditTask(user: any, task: any, currentRole?: Role): boolean {
    if (!user || !task) return false;
    const role = currentRole || user.role?.toLowerCase() || 'guest';
    const userId = getUserId(user);

    // Admin/Manager -> always
    if (role === 'admin' || role === 'manager' || user.isAdmin) return true;

    // Member/Team -> only if assigned to them or created by them
    if (role === 'member' || (role === 'manager' || role === 'member') || user.isTeam) {
        const creatorId = getUserId(task.created_by);
        if (creatorId === userId) return true;
        
        if (!task.assigned_to) return false;
        const assignees = Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to];
        return assignees.some((a: any) => getUserId(a) === userId);
    }

    // Guest -> only if they created it
    const creatorId = getUserId(task.created_by);
    return creatorId === userId;
}

export function canChangeStatus(user: any, task: any, currentRole?: Role): boolean {
    if (!user || !task) return false;
    const role = currentRole || user.role?.toLowerCase() || 'guest';
    const userId = getUserId(user);

    // Admin/Manager/Member -> yes
    if (['admin', 'manager', 'member', 'team'].includes(role)) return true;

    // Guest -> only if creator
    const creatorId = getUserId(task.created_by);
    return creatorId === userId;
}

export function canEditPriority(user: any, task: any, currentRole?: Role): boolean {
    if (!user || !task) return false;
    const role = currentRole || user.role?.toLowerCase() || 'guest';

    // Admin/Manager -> yes
    if (['admin', 'manager'].includes(role)) return true;

    return false;
}

export function canAssignTask(user: any, currentRole?: Role): boolean {
    if (!user) return false;
    const role = currentRole || user.role?.toLowerCase() || 'guest';

    // Admin/Manager -> yes
    return ['admin', 'manager'].includes(role);
}

export function hasPermission(role: Role | string, permission: Permission): boolean {
    if (!role) return false;
    const r = role.toLowerCase();
    const permissions = ROLES[r] || ROLES.guest;
    return permissions.includes(permission);
}

export function canManageAllTasks(user: any, currentRole?: Role): boolean {
    if (!user) return false;
    const role = currentRole || user.role?.toLowerCase();
    return role === 'admin' || role === 'manager';
}

export function hasRole(user: any, role: Role | Role[]): boolean {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
}

/**
 * Resolves the primary role string from a user object.
 * Used for legacy compatibility with components not yet migrated to usePermissions hook.
 */
export function resolveUserRole(user: any): Role {
    if (!user) return 'guest';
    
    // 1. Direct role property
    if (user.role) {
        const r = user.role.toLowerCase();
        if (['admin', 'manager', 'member', 'team', 'guest'].includes(r)) {
            return r as Role;
        }
    }
    
    // 2. Boolean flags (legacy/compat)
    if (user.isAdmin) return 'admin';
    if (user.isTeam) return 'team';
    
    return 'guest';
}
